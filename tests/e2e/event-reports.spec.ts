import { expect, test, type Browser } from "@playwright/test";
import sharp from "sharp";

import { e2eAuthState } from "./support/auth-state";
import { expectNoHorizontalOverflow } from "./support/assertions";
import { resetSingleRoomScenario } from "./support/database";

async function voteWith(
  browser: Browser,
  storageState: string,
  note: string,
  decision: "Valider" | "Invalider",
) {
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();
  await page.goto("/direct");
  const report = page.getByRole("article").filter({ hasText: note });
  await report
    .getByRole("button", { name: `${decision} ce fait`, exact: true })
    .click();
  await expect(report).toContainText(
    decision === "Valider"
      ? "Ton vote : validation."
      : "Ton vote : invalidation.",
  );
  await context.close();
}

test("a private proof is confirmed by two members and settles the bet", async ({
  browser,
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  resetSingleRoomScenario();

  await page.goto("/markets");
  const kissMarket = page
    .getByRole("article")
    .filter({ hasText: /Premier bisou/i });
  await kissMarket
    .getByRole("button", { name: /Oui, cote .*marché ouvert/i })
    .click();
  const ticket = page.getByLabel("Ticket de pari").filter({ visible: true });
  await ticket.getByLabel("Mise en MKB").fill("100");
  await ticket.getByRole("button", { name: "VÉRIFIER LE TICKET" }).click();
  await ticket.getByRole("button", { name: "PLACER MON PRONOSTIC" }).click();
  await expect(ticket.getByText(/Ticket #[A-Z0-9]+/)).toBeVisible();

  const note = `Baiser confirmé E2E ${testInfo.repeatEachIndex}`;
  const png = await sharp({
    create: {
      background: { alpha: 1, b: 35, g: 20, r: 105 },
      channels: 4,
      height: 12,
      width: 16,
    },
  })
    .png()
    .toBuffer();
  await page.goto("/report");
  await page.getByLabel("Type d’événement").selectOption("KISS");
  await page
    .getByLabel("Date et heure réelles")
    .fill(new Date(Date.now() - 60_000).toISOString().slice(0, 16));
  await page.getByLabel("Ce qui s’est passé").fill(note);
  await page
    .getByLabel("Marché concerné", { exact: true })
    .selectOption({ label: "Premier bisou post-rupture" });
  await page.getByLabel("Preuves privées", { exact: true }).setInputFiles({
    buffer: png,
    mimeType: "image/png",
    name: "preuve-baiser.png",
  });
  await page.getByRole("button", { name: "Envoyer au vote" }).click();
  await expect(
    page.getByText("Événement envoyé au vote du groupe."),
  ).toBeVisible({ timeout: 30_000 });

  await page.goto("/direct");
  const authorReport = page.getByRole("article").filter({ hasText: note });
  await expect(authorReport).toContainText("Tu ne peux pas voter");
  await expect(authorReport.getByRole("img")).toBeVisible();
  const imageSrc = await authorReport.getByRole("img").getAttribute("src");
  const mediaPath = new URL(imageSrc ?? "", "http://localhost:3100").pathname;
  expect(mediaPath).toMatch(/^\/api\/media\/[0-9a-f-]+$/);

  await voteWith(browser, e2eAuthState.validatorA, note, "Valider");
  await voteWith(browser, e2eAuthState.validatorB, note, "Valider");

  await page.goto("/direct?vue=confirmed");
  await expect(
    page.getByRole("article").filter({ hasText: note }),
  ).toContainText("Confirmé");
  await page.goto("/bets?status=settled");
  await expect(page.getByText("WON").first()).toBeVisible();
  await expect(page.getByText(/MKB disponibles/)).toBeVisible();

  const anonymous = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const response = await anonymous.request.get(
    mediaPath ?? "/api/media/missing",
  );
  expect(response.status()).toBe(404);
  await anonymous.close();
});

test("two invalidations reject the report and reopen its market", async ({
  browser,
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  resetSingleRoomScenario();
  const note = `Retour officiel refusé E2E ${testInfo.repeatEachIndex}`;

  await page.goto("/report");
  await page
    .getByLabel("Type d’événement")
    .selectOption("OFFICIAL_RELATIONSHIP");
  await page
    .getByLabel("Date et heure réelles")
    .fill(new Date(Date.now() - 60_000).toISOString().slice(0, 16));
  await page.getByLabel("Ce qui s’est passé").fill(note);
  await page
    .getByLabel("Marché concerné", { exact: true })
    .selectOption({ label: "Retour officiel en couple" });
  await page.getByRole("button", { name: "Envoyer au vote" }).click();
  await expect(
    page.getByText("Événement envoyé au vote du groupe."),
  ).toBeVisible();

  await voteWith(browser, e2eAuthState.validatorA, note, "Invalider");
  await voteWith(browser, e2eAuthState.validatorB, note, "Invalider");

  await page.goto("/direct?vue=rejected");
  await expect(
    page.getByRole("article").filter({ hasText: note }),
  ).toContainText("Invalidé");
  await page.goto("/markets");
  const officialMarket = page
    .getByRole("article")
    .filter({ hasText: /Retour officiel/i });
  await expect(
    officialMarket.getByRole("button", { name: /marché ouvert/i }).first(),
  ).toBeEnabled();
});

test("the direct feed and report form fit a mobile viewport", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-mobile");
  await page.goto("/direct");
  await expect(
    page.getByRole("heading", { name: /Le groupe fait le marché/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Navigation mobile" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole("link", { name: "Déclarer", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Déclarer un événement" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
