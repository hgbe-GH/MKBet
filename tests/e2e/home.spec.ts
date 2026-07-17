import { expect, test } from "@playwright/test";

test("opens the permanent Margot and Kévin room", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Tout se joue entre nous.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Entrer dans la salle" }),
  ).toHaveAttribute("href", "/login?next=/direct");
});
