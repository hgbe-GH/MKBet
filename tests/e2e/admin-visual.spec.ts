import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { e2eAuthState } from "./support/auth-state";

test.use({ storageState: e2eAuthState.admin });

test("captures the administration console", async ({ page }, testInfo) => {
  await page.goto("/admin/markets");
  await expect(
    page.getByRole("heading", { name: "Marchés réels" }),
  ).toBeVisible();
  const directory = path.join(
    process.cwd(),
    "tests/e2e/.artifacts",
    testInfo.project.name,
  );
  await mkdir(directory, { recursive: true });
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: path.join(directory, "admin.png"),
  });
});
