import { expect, test, type TestInfo } from "@playwright/test";

import { e2eAuthState } from "./support/auth-state";

test.use({ storageState: e2eAuthState.admin });

test("admin navigation and market lifecycle use real RPC controls", async ({
  page,
}, testInfo: TestInfo) => {
  const marketTitle = `Marché audit visuel ${testInfo.repeatEachIndex + 1}`;
  await page.goto("/dashboard");
  await expect(
    page.getByRole("link", { name: "Administration" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Administration" }).click();
  await expect(
    page.getByRole("heading", { name: "Console MK Bet" }),
  ).toBeVisible();
  await page
    .locator("#main-content")
    .getByRole("link", { name: /Marchés/ })
    .click();
  await page.getByRole("link", { name: "NOUVEAU MARCHÉ" }).click();

  await page.getByLabel("Template").selectOption("KISS");
  await page.getByLabel("Ouverture").fill("2026-07-01T12:00");
  await page.getByLabel("Clôture").fill("2030-04-01T12:00");
  await page.getByLabel("Échéance").fill("2030-04-02T12:00");
  await page.getByLabel("Titre facultatif").fill(marketTitle);
  await page
    .getByLabel("Description")
    .fill("Marché créé par le parcours Playwright.");
  await page.getByRole("button", { name: "CRÉER LE MARCHÉ" }).click();
  await expect(page.getByText(/Marché créé avec ses cotes/)).toBeVisible({
    timeout: 15_000,
  });

  await page.goto("/admin/markets");
  const market = page.getByRole("article").filter({ hasText: marketTitle });
  await expect(market).toContainText("OPEN");
  page.on("dialog", (dialog) => dialog.accept());
  await market.getByRole("button", { name: "Suspendre" }).click();
  await expect(market).toContainText("SUSPENDED");
  await market.getByRole("button", { name: "Rouvrir" }).click();
  await expect(market).toContainText("OPEN");
  await market.getByRole("button", { name: "Fermer" }).click();
  await expect(market).toContainText("CLOSED");
  await expect(
    page.getByRole("heading", { name: "Audit récent" }),
  ).toBeVisible();
});
