import { expect, test } from "@playwright/test";

import { expectNoSeriousAxeViolations } from "./support/assertions";

const protectedPages = ["/dashboard", "/markets", "/leaderboard"];

for (const route of protectedPages) {
  test(`${route} has no serious or critical axe violation`, async ({
    page,
  }) => {
    await page.goto(route);
    await expect(page.locator("#main-content")).toBeVisible();
    await expectNoSeriousAxeViolations(page);
  });
}

test("market detail and open ticket pass axe", async ({ page }, testInfo) => {
  await page.goto("/markets");
  await expect(
    page.getByRole("heading", { name: "Tableau des cotes" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Oui, cote .*marché ouvert/i })
    .first()
    .click();
  if (testInfo.project.name === "chromium-mobile") {
    await page.getByText("Ouvrir le ticket").click();
  }
  await expectNoSeriousAxeViolations(page);
  if (testInfo.project.name === "chromium-mobile") {
    await page.getByText("Fermer le ticket").click();
  }
  await page
    .getByRole("article")
    .first()
    .getByRole("heading")
    .getByRole("link")
    .click();
  await expectNoSeriousAxeViolations(page);
});

test("keyboard reaches skip link, navigation, filters, odds and ticket", async ({
  page,
}, testInfo) => {
  await page.goto("/markets");
  await expect(
    page.getByRole("heading", { name: "Tableau des cotes" }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", {
    name: "Aller au contenu principal",
  });
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await page.getByLabel("Rechercher").focus();
  await expect(page.getByLabel("Rechercher")).toBeFocused();
  const odd = page
    .getByRole("button", { name: /Oui, cote .*marché ouvert/i })
    .first();
  await odd.focus();
  await expect(odd).toBeFocused();
  await odd.press("Enter");
  await expect(odd).toHaveAttribute("aria-pressed", "true");

  if (testInfo.project.name === "chromium-mobile") {
    const ticket = page.locator(
      'button[aria-controls="mobile-bet-slip-panel"]',
    );
    await ticket.click();
    await expect(ticket).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(ticket).toHaveAttribute("aria-expanded", "false");
    await expect(ticket).toBeFocused();
  }
});
