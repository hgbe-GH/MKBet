import { describe, expect, it } from "vitest";

import playwrightConfig from "../playwright.config";
import nextConfig from "../next.config";
import { e2eAuthState } from "./e2e/support/auth-state";

describe("Playwright configuration", () => {
  it("defines dedicated desktop and mobile Chromium projects", () => {
    const projects = playwrightConfig.projects ?? [];

    expect(projects.map((project) => project.name)).toEqual(
      expect.arrayContaining(["chromium-desktop", "chromium-mobile"]),
    );
    expect(
      projects.find((project) => project.name === "chromium-desktop")?.use,
    ).toMatchObject({ viewport: { width: 1440, height: 1000 } });
  });

  it("keeps diagnostic artifacts focused on failures", () => {
    expect(playwrightConfig.use).toMatchObject({
      trace: "on-first-retry",
      screenshot: "only-on-failure",
      video: "retain-on-failure",
    });
    expect(playwrightConfig.webServer).toMatchObject({
      command: "pnpm e2e:server",
      reuseExistingServer: true,
    });
  });

  it("reserves isolated sessions for the author and two validators", () => {
    expect(e2eAuthState.author).toMatch(/tests\/e2e\/\.auth\/author\.json$/);
    expect(e2eAuthState.validatorA).not.toBe(e2eAuthState.validatorB);
  });

  it("allows multipart media uploads larger than the default Server Action limit", () => {
    expect(nextConfig.experimental?.serverActions).toMatchObject({
      bodySizeLimit: "12mb",
    });
  });
});
