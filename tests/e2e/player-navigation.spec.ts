import { expect, test } from "@playwright/test";

import { expectNoHorizontalOverflow } from "./support/assertions";

test("dashboard exposes the correct responsive shell for a player", async ({
  page,
}, testInfo) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Saison réelle")).toBeVisible();
  await expect(page.getByText("Capital MKB")).toBeVisible();
  await expect(page.getByText("Rechutomètre", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Podium" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Administration" })).toHaveCount(
    0,
  );

  const mobile = testInfo.project.name === "chromium-mobile";
  await expect(
    page.getByRole("navigation", {
      name: mobile ? "Navigation mobile" : "Navigation principale",
    }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("desktop and mobile navigation preserve a visible active state", async ({
  page,
}) => {
  await page.goto("/dashboard");
  const navigation = page
    .getByRole("navigation", {
      name: /Navigation (principale|mobile)/,
    })
    .filter({ visible: true });
  const markets = navigation.getByRole("link", { name: /Marchés/ });
  await markets.click();
  await expect(page).toHaveURL(/\/markets/);
  await expect(markets).toHaveAttribute("aria-current", "page");
  await expectNoHorizontalOverflow(page);
});

test("market filters, suspended state, selection and detail remain usable", async ({
  page,
}, testInfo) => {
  await page.goto("/markets");
  await expect(
    page.getByRole("heading", { name: "Tableau des cotes" }),
  ).toBeVisible();
  await expect(page.getByText("SUSPENDED")).toBeVisible();
  await page.getByRole("link", { name: "Physique" }).click();
  await expect(page).toHaveURL(/category=PHYSICAL/);
  await page.getByLabel("Rechercher").fill("bisou");
  await page.getByRole("button", { name: "Filtrer" }).click();
  await expect(page).toHaveURL(/q=bisou/);
  await expect(page.getByRole("article")).not.toHaveCount(0);

  const odd = page
    .getByRole("button", { name: /Oui, cote .*marché ouvert/i })
    .first();
  await odd.click();
  await expect(odd).toHaveAttribute("aria-pressed", "true");

  if (testInfo.project.name === "chromium-mobile") {
    await page.getByText("Ouvrir le ticket").click();
  }
  await expect(
    page
      .getByLabel("Ticket de pari")
      .filter({ visible: true })
      .getByText("1 sélection"),
  ).toBeVisible();

  if (testInfo.project.name === "chromium-mobile") {
    await page.getByText("Fermer le ticket").click();
  }

  const card = page.getByRole("article").first();
  const title = card.getByRole("heading").first();
  await title.getByRole("link").click();
  await expect(
    page.getByRole("heading", { name: "Historique de cote" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Historique des cotes/ }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("bets, wallet and leaderboard expose only expected player data", async ({
  page,
}) => {
  await page.goto("/bets");
  await expect(
    page.getByRole("heading", { name: "Tickets enregistrés" }),
  ).toBeVisible();
  await page.goto("/wallet");
  await expect(
    page.getByRole("heading", { name: "Capital de dignité" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Journal immuable" }),
  ).toBeVisible();
  await page.goto("/leaderboard");
  await expect(
    page.getByRole("heading", { name: "Performance MKB" }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Capital" }),
  ).toBeVisible();
  await expect(page.getByText(/transaction détaillée/i)).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("logout clears the protected session", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Déconnexion" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=/);
});
