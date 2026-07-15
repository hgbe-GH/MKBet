import { expect, test } from "@playwright/test";

import { expectNoHorizontalOverflow } from "./support/assertions";

const viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
];

const routes = ["/direct", "/report", "/markets", "/bets", "/leaderboard"];

test("critical pages fit all required viewport widths", async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("#main-content")).toBeVisible();
      await expectNoHorizontalOverflow(page);
      if (viewport.width === 360 && route === "/markets") {
        const undersizedTargets = await page
          .locator(
            "a[href]:visible:not(.sr-only), button:visible, input:visible, select:visible",
          )
          .evaluateAll((elements) =>
            elements
              .map((element) => {
                const rect = element.getBoundingClientRect();
                return {
                  label:
                    element.getAttribute("aria-label") ??
                    element.textContent?.trim().slice(0, 40) ??
                    element.tagName,
                  height: rect.height,
                };
              })
              .filter((target) => target.height > 0 && target.height < 40),
          );
        expect(undersizedTargets).toEqual([]);
      }
    }
  }
});
