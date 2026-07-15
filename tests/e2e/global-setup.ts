import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "../../src/types/database";
import { e2eAuthState, e2eBaseUrl } from "./support/auth-state";
import { getLocalSupabaseEnvironment } from "./support/local-supabase";

const mailpitMessagesSchema = z.object({
  messages: z.array(
    z.object({
      ID: z.string().min(1),
      To: z.array(z.object({ Address: z.email() })),
    }),
  ),
});
const mailpitMessageDetailSchema = z.object({
  HTML: z.string(),
  Text: z.string(),
});

async function waitForMagicLink(email: string): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const response = await fetch("http://127.0.0.1:54324/api/v1/messages");
    if (response.ok) {
      const list = mailpitMessagesSchema.parse(await response.json());
      const message = list.messages.find((candidate) =>
        candidate.To.some((recipient) => recipient.Address === email),
      );
      if (message) {
        const detail = await fetch(
          `http://127.0.0.1:54324/api/v1/message/${encodeURIComponent(message.ID)}`,
        );
        if (detail.ok) {
          const body = mailpitMessageDetailSchema.parse(await detail.json());
          const links = `${body.HTML}\n${body.Text}`.match(
            /https?:\/\/[^\s"'<>]+/g,
          );
          const magicLink = (links ?? [])
            .map((link) => link.replaceAll("&amp;", "&"))
            .find((link) => link.includes("/auth/v1/verify"));
          if (magicLink) return magicLink;
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("The local magic-link email was not delivered.");
}

async function saveBrowserSession(
  email: string,
  displayName: string,
  statePath: string,
): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${e2eBaseUrl}/login?next=/direct`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Nom d’affichage").fill(displayName);
  await page.getByRole("button", { name: "RECEVOIR MON LIEN D’ACCÈS" }).click();
  await page.getByText(/un lien d'accès vient d'être envoyé/i).waitFor();
  await page.goto(await waitForMagicLink(email));
  await page.waitForURL(`${e2eBaseUrl}/direct`, { timeout: 30_000 });
  await context.storageState({ path: statePath });
  await browser.close();
}

export default async function globalSetup() {
  const environment = getLocalSupabaseEnvironment();
  const serviceClient = createClient<Database>(
    environment.url,
    environment.serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const suffix = randomUUID();
  const identities = [
    {
      email: `author-${suffix}@example.test`,
      displayName: "Alice Signalement",
      statePath: e2eAuthState.author,
    },
    {
      email: `validator-a-${suffix}@example.test`,
      displayName: "Bob Validation",
      statePath: e2eAuthState.validatorA,
    },
    {
      email: `validator-b-${suffix}@example.test`,
      displayName: "Chloé Validation",
      statePath: e2eAuthState.validatorB,
    },
    {
      email: `opposer-${suffix}@example.test`,
      displayName: "David Mobile",
      statePath: e2eAuthState.opposer,
    },
  ];

  for (const identity of identities) {
    const { error } = await serviceClient.auth.admin.createUser({
      email: identity.email,
      email_confirm: true,
      user_metadata: { display_name: identity.displayName },
    });
    if (error)
      throw new Error(`Unable to create E2E identity: ${error.message}`);
  }

  await mkdir(path.dirname(e2eAuthState.author), { recursive: true });
  for (const identity of identities) {
    await saveBrowserSession(
      identity.email,
      identity.displayName,
      identity.statePath,
    );
  }
}
