import { expect, test } from "@playwright/test";
import sharp from "sharp";

import { e2eAuthState } from "./support/auth-state";

test.describe("private season media", () => {
  test.use({ storageState: e2eAuthState.admin });

  test("an admin uploads and approves a media that a member can read", async ({
    browser,
    page,
  }, testInfo) => {
    const caption = `Média E2E ${testInfo.project.name} ${testInfo.repeatEachIndex + 1}`;
    const png = await sharp({
      create: {
        background: { alpha: 1, b: 40, g: 20, r: 90 },
        channels: 4,
        height: 2,
        width: 2,
      },
    })
      .png()
      .toBuffer();
    await page.goto("/admin/media");
    await expect(page.getByTestId("season-media-upload-form")).toHaveAttribute(
      "data-upload-ready",
      "true",
    );
    await page.getByLabel("Image").setInputFiles({
      buffer: png,
      mimeType: "image/png",
      name: "souvenir.png",
    });
    await page.getByLabel("Légende").fill(caption);
    await page.getByRole("button", { name: "ENVOYER POUR VALIDATION" }).click();
    await expect(
      page.getByText(
        "Média envoyé : il attend la validation d’un administrateur.",
      ),
    ).toBeVisible({ timeout: 15_000 });

    const pendingMedia = page.getByRole("article").filter({ hasText: caption });
    await expect(pendingMedia).toContainText("PENDING");
    await pendingMedia.getByRole("button", { name: "APPROUVER" }).click();
    await expect(pendingMedia).toContainText("APPROVED", { timeout: 30_000 });

    const readerContext = await browser.newContext({
      storageState: e2eAuthState.liveReader,
    });
    const readerPage = await readerContext.newPage();
    await readerPage.goto("/lives");
    const image = readerPage.getByRole("img", { name: caption });
    await expect(image).toBeVisible();
    const mediaUrl = await image.getAttribute("src");
    expect(mediaUrl).toMatch(/^\/api\/media\/[0-9a-f-]+$/);

    const response = await readerPage.goto(mediaUrl ?? "/api/media/missing");
    expect(response?.status()).toBe(200);
    await readerContext.close();

    const anonymousContext = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const anonymousPage = await anonymousContext.newPage();
    const anonymousResponse = await anonymousPage.goto(
      mediaUrl ?? "/api/media/missing",
    );
    expect(anonymousResponse?.status()).toBe(404);
    await anonymousContext.close();
  });
});
