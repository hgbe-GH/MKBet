import { expect, test } from "@playwright/test";

import { e2eAuthState } from "./support/auth-state";

test.describe("live creation", () => {
  test.use({ storageState: e2eAuthState.admin });

  test("an admin creates a scheduled live that another season member can read", async ({
    page,
    browser,
  }, testInfo) => {
    const title = `Live admin E2E ${testInfo.project.name} ${testInfo.repeatEachIndex + 1}`;
    await page.goto("/admin/lives/new");
    await page.getByLabel("Titre").fill(title);
    await page.getByLabel("Hôte").selectOption({ label: "Hôte Live E2E" });
    await page.getByLabel("Début planifié (UTC)").fill("2029-03-10T18:00");
    await page.getByLabel("Fin planifiée (UTC)").fill("2029-03-10T22:00");
    await page.getByLabel("Participant Lecteur Live E2E").check();
    await page.getByRole("button", { name: "CRÉER LE LIVE" }).click();

    await expect(page).toHaveURL(/\/admin\/lives\?created=1/);
    const createdLive = page.getByRole("article").filter({ hasText: title });
    await expect(createdLive).toContainText("SCHEDULED");

    const readerContext = await browser.newContext({
      storageState: e2eAuthState.liveReader,
    });
    const readerPage = await readerContext.newPage();
    await readerPage.goto("/lives");
    await expect(readerPage.getByText(title)).toBeVisible();
    await readerPage.getByRole("link", { name: title }).click();
    await expect(readerPage).toHaveURL(/\/lives\/[0-9a-f-]+/);
    await expect(
      readerPage.getByText("Hôte Live E2E", { exact: true }),
    ).toBeVisible();
    await expect(readerPage.getByText(/Lecteur Live E2E/)).toBeVisible();
    await readerContext.close();
  });
});

test.describe("live host creation", () => {
  test.use({ storageState: e2eAuthState.liveHost });

  test("a live host creates only their own instant live", async ({
    page,
  }, testInfo) => {
    const title = `Live hôte E2E ${testInfo.project.name} ${testInfo.repeatEachIndex + 1}`;
    await page.goto("/admin/lives/new");
    await expect(page.getByText(/Hôte : toi-même/i)).toBeVisible();
    await page.getByLabel("Titre").fill(title);
    await page.getByLabel("Type de live").selectOption("INSTANT");
    await page.getByRole("button", { name: "CRÉER LE LIVE" }).click();

    await expect(page).toHaveURL(/\/admin\/lives\?created=1/);
    const createdLive = page.getByRole("article").filter({ hasText: title });
    await expect(createdLive).toContainText("PROPOSED");
  });
});
