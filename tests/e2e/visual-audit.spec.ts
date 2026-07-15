import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test, type Page, type TestInfo } from "@playwright/test";

import { e2eAuthState } from "./support/auth-state";

test.use({ storageState: e2eAuthState.visual });

async function capture(
  page: Page,
  testInfo: TestInfo,
  name: string,
  fullPage = true,
): Promise<void> {
  const directory = path.join(
    process.cwd(),
    "tests/e2e/.artifacts",
    testInfo.project.name,
  );
  await mkdir(directory, { recursive: true });
  await page.screenshot({
    animations: "disabled",
    fullPage,
    path: path.join(directory, `${name}.png`),
  });
}

async function selectTwoOutcomes(page: Page): Promise<void> {
  const openCards = page.getByRole("article").filter({
    has: page.getByRole("button", { name: /Oui, cote .*marché ouvert/i }),
  });
  await openCards
    .nth(0)
    .getByRole("button", { name: /Oui, cote .*marché ouvert/i })
    .click();
  await openCards
    .nth(1)
    .getByRole("button", { name: /Oui, cote .*marché ouvert/i })
    .click();
}

test("captures and snapshots deterministic public and sportsbook screens", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  await page.goto("/");
  if (testInfo.project.name === "chromium-desktop") {
    await capture(page, testInfo, "home");
  }

  await page.goto("/login");
  await capture(page, testInfo, "login");
  if (testInfo.project.name === "chromium-desktop") {
    await expect(page).toHaveScreenshot("login-desktop.png", {
      animations: "disabled",
    });
  }

  await page.goto("/dashboard");
  await expect(page.getByText("Saison réelle")).toBeVisible();
  await capture(page, testInfo, "dashboard");
  if (testInfo.project.name === "chromium-desktop") {
    await expect(page).toHaveScreenshot("dashboard-desktop.png", {
      animations: "disabled",
      mask: [
        page.locator("header").first(),
        page.locator("#main-content > div > section > p").first(),
      ],
    });
  }

  await page.goto("/markets");
  await expect(
    page.getByRole("heading", { name: "Tableau des cotes" }),
  ).toBeVisible();
  await capture(page, testInfo, "markets");
  await expect(page).toHaveScreenshot(
    testInfo.project.name === "chromium-mobile"
      ? "markets-mobile.png"
      : "markets-desktop.png",
    {
      animations: "disabled",
      mask: [page.locator("header").first()],
    },
  );

  const firstMarketLink = page
    .getByRole("article")
    .first()
    .getByRole("heading")
    .getByRole("link");
  await firstMarketLink.click();
  await expect(
    page.getByRole("heading", { name: "Historique de cote" }),
  ).toBeVisible();
  await capture(page, testInfo, "market-detail");

  await page.goto("/markets");
  await expect(
    page.getByRole("heading", { name: "Tableau des cotes" }),
  ).toBeVisible();
  if (testInfo.project.name === "chromium-mobile") {
    await capture(page, testInfo, "ticket-closed", false);
  }
  await selectTwoOutcomes(page);
  if (testInfo.project.name === "chromium-mobile") {
    await page.getByText("Ouvrir le ticket").click();
    await expect(page).toHaveScreenshot("ticket-mobile-open.png", {
      animations: "disabled",
      mask: [page.locator("header").first()],
    });
  }
  await capture(page, testInfo, "ticket-open", false);

  for (const [route, name, heading] of [
    ["/bets", "bets", "Tickets enregistrés"],
    ["/wallet", "wallet", "Capital de dignité"],
    ["/leaderboard", "leaderboard", "Performance MKB"],
  ] as const) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await capture(page, testInfo, name);
  }
});
