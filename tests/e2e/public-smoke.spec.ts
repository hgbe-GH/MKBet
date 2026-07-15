import { expect, test } from "@playwright/test";

test("public home and health remain accessible without auth", async ({
  page,
  request,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "La salle des marchés de la rechute" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "ENTRER DANS LA SALLE" }),
  ).toHaveAttribute("href", "/login?next=/direct");

  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  await expect(response).toBeOK();
  expect(await response.json()).toEqual({
    status: "ok",
    application: "mk-bet",
  });
});
