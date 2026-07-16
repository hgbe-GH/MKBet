import { expect, test } from "@playwright/test";

import {
  expectNoHorizontalOverflow,
  expectNoSeriousAxeViolations,
} from "./support/assertions";

test("home exposes brand, metadata, favicon and responsive public content", async ({
  page,
}) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("MK Bet");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /salle privée des marchés fictifs/i,
  );
  await expect(
    page.getByLabel("MK Bet, aller au contenu principal"),
  ).toBeVisible();
  await expect(page.getByText("SALLE OUVERTE")).toBeVisible();
  await expect(page.getByText("100 % monnaie fictive")).toBeVisible();
  const faviconHref = await page
    .locator('link[rel="icon"]')
    .getAttribute("href");
  expect(faviconHref).toBeTruthy();
  const favicon = await page.request.get(faviconHref ?? "/icon.svg");
  expect(favicon.status()).toBe(200);
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
});

test("login is keyboard accessible and exposes password authentication", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Bon retour dans la salle" }),
  ).toBeVisible();
  const email = page.getByLabel("Adresse e-mail");
  await email.focus();
  await expect(email).toBeFocused();
  await expect(email).toHaveCSS("min-height", "48px");
  await expect(page.getByLabel("Mot de passe")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "SE CONNECTER" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAxeViolations(page);
});

test("unknown route renders the branded 404", async ({ page }) => {
  const response = await page.goto("/route-qui-n-existe-pas");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Marché introuvable" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "RETOUR À L’ACCUEIL" }),
  ).toBeVisible();
});
