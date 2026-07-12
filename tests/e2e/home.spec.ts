import { expect, test } from "@playwright/test";

test("shows the MK Bet pre-season home page", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "La salle des marchés de la rechute",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "CONSULTER LES COTES" }),
  ).toBeDisabled();
});
