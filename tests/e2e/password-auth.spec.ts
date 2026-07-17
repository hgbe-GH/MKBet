import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { expectNoHorizontalOverflow } from "./support/assertions";
import { waitForAuthEmailLink } from "./support/mailpit";

test.use({ storageState: { cookies: [], origins: [] } });

const runId = randomUUID();
const initialPassword = "MkBet-auth-2026!";
const updatedPassword = "MkBet-auth-new-2026!";
const invalidCredentialsMessage =
  "Connexion impossible. Vérifie tes informations ou réinitialise ton mot de passe.";
const resetRequestMessage =
  "Si un compte correspond à cette adresse, un e-mail de récupération vient d'être envoyé.";

function testEmail(projectName: string, repeatEachIndex: number): string {
  const project = projectName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  return `auth-${project}-${repeatEachIndex}-${runId}@example.test`;
}

async function submitSignIn(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname === "/login",
    ),
    page.getByRole("button", { name: "SE CONNECTER" }).click(),
  ]);
}

test("creates, confirms and recovers a password account without enumeration", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const email = testEmail(testInfo.project.name, testInfo.repeatEachIndex);
  const unknownEmail = `unknown-${testInfo.repeatEachIndex}-${runId}@example.test`;

  await page.goto("/login?mode=register&next=/direct");
  await page.getByLabel("Nom d’affichage").fill("Joueuse E2E");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(initialPassword);
  await page.getByLabel("Confirmer le mot de passe").fill(initialPassword);
  await page.getByRole("button", { name: "CRÉER MON COMPTE" }).click();

  await expect(
    page.getByRole("heading", { name: "Confirme ton adresse" }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText(email);
  await expect(page.locator("body")).not.toContainText(initialPassword);

  await page.goto(await waitForAuthEmailLink(email, "signup"));
  await expect(page).toHaveURL(/\/direct$/);
  await expect(
    page.getByRole("heading", { name: /Le groupe fait le marché/ }),
  ).toBeVisible();

  await page.goto("/settings/account");
  await page.getByRole("button", { name: "Déconnexion" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await submitSignIn(page, email, "incorrect-password");
  await expect(page.getByText(invalidCredentialsMessage)).toBeVisible();
  await submitSignIn(page, unknownEmail, "incorrect-password");
  await expect(page.getByText(invalidCredentialsMessage)).toBeVisible();

  await submitSignIn(page, email, initialPassword);
  await expect(page).toHaveURL(/\/direct$/);
  await page.goto("/auth/update-password");
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/forgot-password");
  await page.getByLabel("Adresse e-mail").fill(unknownEmail);
  await page.getByRole("button", { name: "ENVOYER L’E-MAIL" }).click();
  const resetMessage = await page
    .getByRole("heading", { name: "Consulte ta boîte mail" })
    .locator("..")
    .locator("p")
    .first()
    .textContent();
  expect(resetMessage).toBe(resetRequestMessage);

  await page.goto("/forgot-password");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByRole("button", { name: "ENVOYER L’E-MAIL" }).click();
  await expect(
    page.getByRole("heading", { name: "Consulte ta boîte mail" }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText(email);
  const existingResetMessage = await page
    .getByRole("heading", { name: "Consulte ta boîte mail" })
    .locator("..")
    .locator("p")
    .first()
    .textContent();
  expect(existingResetMessage).toBe(resetRequestMessage);

  await page.goto(await waitForAuthEmailLink(email, "recovery"));
  await expect(page).toHaveURL(/\/auth\/update-password$/);
  await page
    .getByLabel("Nouveau mot de passe", { exact: true })
    .fill(updatedPassword);
  await page
    .getByLabel("Confirmer le nouveau mot de passe")
    .fill(updatedPassword);
  await page.getByRole("button", { name: "MODIFIER LE MOT DE PASSE" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/auth/update-password");
  await expect(page).toHaveURL(/\/login$/);
  await submitSignIn(page, email, initialPassword);
  await expect(page.getByText(invalidCredentialsMessage)).toBeVisible();

  await page.goto("/login?next=//example.invalid");
  await submitSignIn(page, email, updatedPassword);
  await expect(page).toHaveURL(/\/direct$/);
});

test("keeps password forms keyboard-safe on mobile with reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/login?mode=register");

  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Retour à l’accueil MK Bet" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Connexion" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Créer un compte" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Nom d’affichage")).toBeFocused();

  const motion = page.locator('[data-motion="auth-content"]');
  await expect(motion).toHaveCSS("animation-name", "none");
  await expectNoHorizontalOverflow(page);
});
