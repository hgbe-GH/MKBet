import { randomUUID } from "node:crypto";

import { expect, test, type Locator, type Page } from "@playwright/test";

import { expectNoHorizontalOverflow } from "./support/assertions";
import {
  deleteLocalPasswordAuthTestUser,
  deleteLocalUserIds,
  findLocalPasswordAuthTestUserId,
} from "./support/local-auth-admin";
import { waitForAuthEmailLink } from "./support/mailpit";

test.use({
  screenshot: "off",
  storageState: { cookies: [], origins: [] },
  trace: "off",
  video: "off",
});

const runId = randomUUID();
const initialPassword = "MkBet-auth-2026!";
const updatedPassword = "MkBet-auth-new-2026!";
const invalidCredentialsMessage =
  "Connexion impossible. Vérifie tes informations ou réinitialise ton mot de passe.";
const resetRequestMessage =
  "Si un compte correspond à cette adresse, un e-mail de récupération vient d'être envoyé.";
const trackedUserIds = new Map<string, string>();

function testEmail(projectName: string, repeatEachIndex: number): string {
  const project = projectName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  return `auth-${project}-${repeatEachIndex}-${runId}@example.test`;
}

async function expectVisibleKeyboardFocus(locator: Locator): Promise<void> {
  await expect(locator).toBeFocused();
  const outline = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim(),
      color: style.outlineColor,
      style: style.outlineStyle,
      width: style.outlineWidth,
    };
  });
  expect(outline.style).not.toBe("none");
  expect(Number.parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
  const color = parseCssColor(outline.color);
  const background = parseCssColor(outline.background);
  expect(color.alpha).toBeGreaterThan(0);
  expect(
    contrastRatio(color.channels, background.channels),
  ).toBeGreaterThanOrEqual(3);
}

async function resetDocumentFocus(page: Page): Promise<void> {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });
}

function parseCssColor(value: string): {
  alpha: number;
  channels: [number, number, number];
} {
  const hex = value.match(/^#([0-9a-f]{6})$/i)?.[1];
  if (hex) {
    return {
      alpha: 1,
      channels: [0, 2, 4].map((index) =>
        Number.parseInt(hex.slice(index, index + 2), 16),
      ) as [number, number, number],
    };
  }
  const rgb = value.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/,
  );
  if (!rgb) throw new Error("Unsupported computed color.");
  return {
    alpha: rgb[4] ? Number.parseFloat(rgb[4]) : 1,
    channels: [rgb[1], rgb[2], rgb[3]].map(Number) as [number, number, number],
  };
}

function relativeLuminance(channels: [number, number, number]): number {
  const [red, green, blue] = channels.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function contrastRatio(
  first: [number, number, number],
  second: [number, number, number],
): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
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

test.afterEach(async ({}, testInfo) => {
  const email = testEmail(testInfo.project.name, testInfo.repeatEachIndex);
  const trackedId = trackedUserIds.get(email);
  try {
    if (trackedId) await deleteLocalUserIds([trackedId]);
    else await deleteLocalPasswordAuthTestUser(email);
  } finally {
    trackedUserIds.delete(email);
  }
});

test("creates an immediately accessible password account and recovers it without enumeration", async ({
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

  await expect(page).toHaveURL(/\/direct$/);
  await expect(
    page.getByRole("heading", { name: /Le groupe fait le marché/ }),
  ).toBeVisible();
  const createdUserId = await findLocalPasswordAuthTestUserId(email);
  expect(createdUserId).not.toBeNull();
  trackedUserIds.set(email, createdUserId ?? "");
  await expect(page.locator("body")).not.toContainText(email);
  await expect(page.locator("body")).not.toContainText(initialPassword);

  await page.goto("/settings/account");
  await page.getByRole("button", { name: "Déconnexion" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await submitSignIn(page, email, "incorrect-password");
  await expect(page.getByText(invalidCredentialsMessage)).toBeVisible();
  await submitSignIn(page, unknownEmail, "incorrect-password");
  await expect(page.getByText(invalidCredentialsMessage)).toBeVisible();

  await page.goto("/login?next=/markets");
  await submitSignIn(page, email, initialPassword);
  await expect(page).toHaveURL(/\/markets$/);
  await page.goto("/auth/update-password");
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/forgot-password");
  await page.getByLabel("Adresse e-mail").fill(unknownEmail);
  await page.getByRole("button", { name: "ENVOYER L’E-MAIL" }).click();
  await expect(
    page.getByText(resetRequestMessage, { exact: true }),
  ).toBeVisible();

  await page.goto("/forgot-password");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByRole("button", { name: "ENVOYER L’E-MAIL" }).click();
  await expect(
    page.getByRole("heading", { name: "Consulte ta boîte mail" }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText(email);
  await expect(
    page.getByText(resetRequestMessage, { exact: true }),
  ).toBeVisible();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(await waitForAuthEmailLink(email, "recovery"));
  await expect(page).toHaveURL(/\/auth\/update-password$/);
  await resetDocumentFocus(page);
  await page.keyboard.press("Tab");
  await expectVisibleKeyboardFocus(
    page.getByRole("link", { name: "Retour à l’accueil MK Bet" }),
  );
  await page.keyboard.press("Tab");
  const newPassword = page.getByLabel("Nouveau mot de passe", {
    exact: true,
  });
  await expectVisibleKeyboardFocus(newPassword);
  await newPassword.fill(updatedPassword);
  await page.keyboard.press("Tab");
  await expectVisibleKeyboardFocus(
    page.getByRole("button", { name: "Afficher le mot de passe" }),
  );
  await page.keyboard.press("Tab");
  const newPasswordConfirmation = page.getByLabel(
    "Confirmer le nouveau mot de passe",
  );
  await expectVisibleKeyboardFocus(newPasswordConfirmation);
  await newPasswordConfirmation.fill(updatedPassword);
  await page.keyboard.press("Tab");
  await expectVisibleKeyboardFocus(
    page.getByRole("button", {
      name: "Afficher la confirmation du mot de passe",
    }),
  );
  await page.keyboard.press("Tab");
  await expectVisibleKeyboardFocus(
    page.getByRole("button", { name: "MODIFIER LE MOT DE PASSE" }),
  );
  await expectNoHorizontalOverflow(page);
  await page.getByRole("button", { name: "MODIFIER LE MOT DE PASSE" }).click();
  await expect(page).toHaveURL(/\/login\?notice=password-updated$/);
  await expect(
    page.getByRole("heading", { name: "Mot de passe modifié" }),
  ).toBeVisible();
  await expect(
    page.getByText("Tu peux maintenant te connecter."),
  ).toBeVisible();
  await expect(page.getByLabel("Adresse e-mail")).toBeVisible();
  await expect(page.getByLabel("Mot de passe", { exact: true })).toBeVisible();
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

  await page.goto("/forgot-password");
  await resetDocumentFocus(page);
  await page.keyboard.press("Tab");
  await expectVisibleKeyboardFocus(
    page.getByRole("link", { name: "Retour à l’accueil MK Bet" }),
  );
  await page.keyboard.press("Tab");
  await expectVisibleKeyboardFocus(page.getByLabel("Adresse e-mail"));
  await page.keyboard.press("Tab");
  await expectVisibleKeyboardFocus(
    page.getByRole("button", { name: "ENVOYER L’E-MAIL" }),
  );
  await expectNoHorizontalOverflow(page);
});
