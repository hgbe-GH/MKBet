import { expect, test } from "@playwright/test";

test("public home and health remain accessible without auth", async ({
  page,
  request,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Tout se joue entre nous." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Entrer dans la salle" }),
  ).toHaveAttribute("href", "/login?next=/direct");

  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  await expect(response).toBeOK();
  expect(await response.json()).toEqual({
    status: "ok",
    application: "mk-bet",
  });
});
