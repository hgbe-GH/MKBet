import { expect, test } from "@playwright/test";

test("player session renders the protected sportsbook shell", async ({
  page,
}, testInfo) => {
  await page.goto("/dashboard");

  await expect(
    page.getByRole("heading", {
      name: /Margot × Kévin — (Desktop|Mobile)/,
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", {
      name:
        testInfo.project.name === "chromium-mobile"
          ? "Navigation mobile"
          : "Navigation principale",
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Administration" })).toHaveCount(
    0,
  );
});
