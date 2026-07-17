import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../../src/types/database";
import { e2eAuthState, e2eBaseUrl } from "./support/auth-state";
import { getLocalSupabaseEnvironment } from "./support/local-supabase";

const e2ePassword = "MkBet-E2E-2026!";

async function saveBrowserSession(
  email: string,
  statePath: string,
): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${e2eBaseUrl}/login?next=/direct`);
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(e2ePassword);
  await page.getByRole("button", { name: "SE CONNECTER" }).click();
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
      password: e2ePassword,
      user_metadata: { display_name: identity.displayName },
    });
    if (error) throw new Error("Unable to create an E2E identity.");
  }

  await mkdir(path.dirname(e2eAuthState.author), { recursive: true });
  for (const identity of identities) {
    await saveBrowserSession(identity.email, identity.statePath);
  }
}
