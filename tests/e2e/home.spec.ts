import { expect, test } from "@playwright/test";

test("opens the permanent Margot and Kévin room", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "La salle des marchés de la rechute",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "ENTRER DANS LA SALLE" }),
  ).toHaveAttribute("href", "/login?next=/direct");
});
