import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { e2eAuthState, e2eBaseUrl } from "./support/auth-state";
import { getLocalSupabaseEnvironment } from "./support/local-supabase";
import { asRpcClient } from "../../src/data/supabase/rpc";
import type { Database } from "../../src/types/database";

interface TestIdentity {
  email: string;
  displayName: string;
  client: SupabaseClient<Database>;
}

interface SeasonDates {
  breakupDate: string;
  startedAt: string;
  closesAt: string;
  physicalDeadlineAt: string;
  relationshipDeadlineAt: string;
}

const dates: SeasonDates = {
  breakupDate: "2026-07-01",
  startedAt: "2026-07-01T10:00:00.000Z",
  closesAt: "2029-12-31T20:00:00.000Z",
  physicalDeadlineAt: "2030-01-02T20:00:00.000Z",
  relationshipDeadlineAt: "2030-03-31T20:00:00.000Z",
};

const mailpitMessagesSchema = z.object({
  messages: z.array(
    z.object({
      ID: z.string().min(1),
      To: z.array(z.object({ Address: z.string().email() })),
    }),
  ),
});
const mailpitMessageDetailSchema = z.object({
  HTML: z.string(),
  Text: z.string(),
});

function assertNoError(
  error: { message: string } | null,
  context: string,
): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

async function createIdentity(
  serviceClient: SupabaseClient<Database>,
  url: string,
  publishableKey: string,
  email: string,
  displayName: string,
): Promise<TestIdentity> {
  const password = randomBytes(32).toString("base64url");
  const created = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  assertNoError(created.error, `Unable to create ${displayName}`);

  const client = createClient<Database>(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signedIn = await client.auth.signInWithPassword({ email, password });
  assertNoError(signedIn.error, `Unable to sign in ${displayName}`);

  return { email, displayName, client };
}

async function createSeason(
  owner: TestIdentity,
  databaseUrl: string,
  title: string,
): Promise<string> {
  const created = await owner.client.rpc("create_season", {
    p_title: title,
    p_description: "Saison reproductible réservée aux tests end-to-end.",
    p_breakup_date: dates.breakupDate,
    p_started_at: dates.startedAt,
    p_starting_balance_mkb: 1000,
    p_secret_bets_until_close: false,
    p_idempotency_key: randomUUID(),
  });
  assertNoError(created.error, `Unable to create ${title}`);
  const seasonId = created.data?.[0]?.season_id;
  if (!seasonId) throw new Error(`Unable to resolve ${title}.`);

  const validatedSeasonId = z.string().uuid().parse(seasonId);
  execFileSync(
    "psql",
    [
      databaseUrl,
      "-v",
      "ON_ERROR_STOP=1",
      "-v",
      `season_id=${validatedSeasonId}`,
    ],
    {
      input:
        "update public.seasons set status = 'ACTIVE' where id = :'season_id'::uuid;",
      stdio: ["pipe", "ignore", "ignore"],
    },
  );

  const initialized = await owner.client.rpc(
    "initialize_default_season_markets",
    {
      p_season_id: seasonId,
      p_physical_deadline_at: dates.physicalDeadlineAt,
      p_relationship_deadline_at: dates.relationshipDeadlineAt,
      p_closes_at: dates.closesAt,
      p_idempotency_key: randomUUID(),
    },
  );
  assertNoError(initialized.error, `Unable to initialize ${title}`);

  const officialCouple = await owner.client
    .from("markets")
    .select("id")
    .eq("season_id", seasonId)
    .eq("event_code", "OFFICIAL_COUPLE")
    .single();
  assertNoError(officialCouple.error, `Unable to find suspended market`);
  if (officialCouple.data) {
    const suspended = await owner.client.rpc("suspend_market", {
      p_market_id: officialCouple.data.id,
      p_reason: "Validation E2E de l’état suspendu",
    });
    assertNoError(suspended.error, `Unable to suspend test market`);
  }

  return seasonId;
}

async function inviteSeasonMember(
  owner: TestIdentity,
  member: TestIdentity,
  seasonId: string,
  role: "LIVE_HOST" | "PLAYER",
): Promise<void> {
  const invitation = await asRpcClient(owner.client).rpc<
    Array<{ token: string }>
  >("create_season_invitation", {
    p_season_id: seasonId,
    p_proposed_role: role,
    p_proposed_subject_key: null,
    p_email: member.email,
    p_expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    p_max_uses: 1,
  });
  assertNoError(invitation.error, `Unable to invite ${member.displayName}`);
  const token = invitation.data?.[0]?.token;
  if (!token) throw new Error(`Unable to resolve invitation token.`);

  const accepted = await member.client.rpc("accept_season_invitation", {
    p_token: token,
  });
  assertNoError(accepted.error, `Unable to accept player invitation`);
}

function stabilizeVisualMarketOdds(
  databaseUrl: string,
  seasonId: string,
): void {
  // Opening odds are intentionally time-sensitive in production; screenshot
  // fixtures need an explicit value to remain comparable across calendar days.
  const validatedSeasonId = z.string().uuid().parse(seasonId);
  execFileSync(
    "psql",
    [
      databaseUrl,
      "-v",
      "ON_ERROR_STOP=1",
      "-v",
      `season_id=${validatedSeasonId}`,
    ],
    {
      input: [
        "update public.market_outcomes as outcome",
        "set displayed_odds = case outcome.code",
        "  when 'YES' then 1.15",
        "  when 'NO' then 4.80",
        "  else outcome.displayed_odds",
        "end",
        "from public.markets as market",
        "where outcome.market_id = market.id",
        "  and market.season_id = :'season_id'::uuid",
        "  and market.event_code = 'KISS';",
      ].join("\n"),
      stdio: ["pipe", "ignore", "ignore"],
    },
  );
}

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
          const content = `${body.HTML}\n${body.Text}`;
          const links = content.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
          const magicLink = links
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
  path: string,
): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${e2eBaseUrl}/login?next=/dashboard`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Nom d’affichage").fill(displayName);
  await page.getByRole("button", { name: "RECEVOIR MON LIEN D’ACCÈS" }).click();
  const formMessage = page.locator("form p.rounded-md");
  await formMessage.waitFor();
  const message = await formMessage.textContent();
  if (
    message !==
    "Si cette adresse est autorisée, un lien d'accès vient d'être envoyé."
  ) {
    throw new Error(`Local login failed: ${message ?? "missing form state"}`);
  }
  const actionLink = await waitForMagicLink(email);
  await page.goto(actionLink);
  await page.waitForLoadState("networkidle");
  const finalUrl = new URL(page.url());
  if (
    finalUrl.origin !== e2eBaseUrl ||
    !finalUrl.pathname.startsWith("/dashboard")
  ) {
    throw new Error(
      `Local Auth callback ended at ${finalUrl.origin}${finalUrl.pathname}.`,
    );
  }
  await context.storageState({ path });
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
  const [
    admin,
    bootstrap,
    playerDesktop,
    playerMobile,
    visual,
    liveHost,
    liveReader,
  ] = await Promise.all([
    createIdentity(
      serviceClient,
      environment.url,
      environment.publishableKey,
      `admin-${suffix}@example.test`,
      "Camille Admin",
    ),
    createIdentity(
      serviceClient,
      environment.url,
      environment.publishableKey,
      `committee-${suffix}@example.test`,
      "Comité E2E",
    ),
    createIdentity(
      serviceClient,
      environment.url,
      environment.publishableKey,
      `player-desktop-${suffix}@example.test`,
      "Noé Desktop",
    ),
    createIdentity(
      serviceClient,
      environment.url,
      environment.publishableKey,
      `player-mobile-${suffix}@example.test`,
      "Lina Mobile",
    ),
    createIdentity(
      serviceClient,
      environment.url,
      environment.publishableKey,
      `visual-${suffix}@example.test`,
      "Noé Desktop",
    ),
    createIdentity(
      serviceClient,
      environment.url,
      environment.publishableKey,
      `live-host-${suffix}@example.test`,
      "Hôte Live E2E",
    ),
    createIdentity(
      serviceClient,
      environment.url,
      environment.publishableKey,
      `live-reader-${suffix}@example.test`,
      "Lecteur Live E2E",
    ),
  ]);

  const adminSeason = await createSeason(
    admin,
    environment.dbUrl,
    "Administration E2E",
  );
  await inviteSeasonMember(admin, liveHost, adminSeason, "LIVE_HOST");
  await inviteSeasonMember(admin, liveReader, adminSeason, "PLAYER");
  const desktopSeason = await createSeason(
    bootstrap,
    environment.dbUrl,
    "Margot × Kévin — Desktop",
  );
  await inviteSeasonMember(bootstrap, playerDesktop, desktopSeason, "PLAYER");
  const visualSeason = await createSeason(
    bootstrap,
    environment.dbUrl,
    "Margot × Kévin — Desktop",
  );
  await inviteSeasonMember(bootstrap, visual, visualSeason, "PLAYER");
  stabilizeVisualMarketOdds(environment.dbUrl, visualSeason);
  const mobileSeason = await createSeason(
    bootstrap,
    environment.dbUrl,
    "Margot × Kévin — Mobile",
  );
  await inviteSeasonMember(bootstrap, playerMobile, mobileSeason, "PLAYER");

  await mkdir(path.dirname(e2eAuthState.admin), { recursive: true });
  await saveBrowserSession(admin.email, admin.displayName, e2eAuthState.admin);
  await saveBrowserSession(
    liveHost.email,
    liveHost.displayName,
    e2eAuthState.liveHost,
  );
  await saveBrowserSession(
    liveReader.email,
    liveReader.displayName,
    e2eAuthState.liveReader,
  );
  await saveBrowserSession(
    playerDesktop.email,
    playerDesktop.displayName,
    e2eAuthState.playerDesktop,
  );
  await saveBrowserSession(
    playerMobile.email,
    playerMobile.displayName,
    e2eAuthState.playerMobile,
  );
  await saveBrowserSession(
    visual.email,
    visual.displayName,
    e2eAuthState.visual,
  );
}
