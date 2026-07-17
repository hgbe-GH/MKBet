import { describe, expect, it } from "vitest";

import {
  parseCreatedUserRegistry,
  parsePasswordAuthTestEmail,
} from "./e2e/support/local-auth-admin";
import { extractSafeAuthLink } from "./e2e/support/mailpit";

describe("E2E authentication support", () => {
  it("accepts only a registry of user UUIDs", () => {
    expect(
      parseCreatedUserRegistry({
        userIds: ["11111111-1111-4111-8111-111111111111"],
      }),
    ).toEqual(["11111111-1111-4111-8111-111111111111"]);
    expect(() =>
      parseCreatedUserRegistry({ userIds: ["not-an-id"] }),
    ).toThrow();
  });

  it("restricts cleanup to the generated password-auth namespace", () => {
    expect(
      parsePasswordAuthTestEmail(
        "auth-chromium-desktop-0-11111111-1111-4111-8111-111111111111@example.test",
      ),
    ).toBe(
      "auth-chromium-desktop-0-11111111-1111-4111-8111-111111111111@example.test",
    );
    expect(() => parsePasswordAuthTestEmail("friend@example.test")).toThrow();
  });

  it("extracts only an exact local Supabase auth link with a safe callback", () => {
    const safe =
      "http://127.0.0.1:54321/auth/v1/verify?token=secret&type=recovery&redirect_to=" +
      encodeURIComponent("http://localhost:3100/auth/callback?intent=recovery");
    const wrongKind = safe.replace("type=recovery", "type=signup");
    const wrongHost = safe.replace("127.0.0.1:54321", "example.invalid");
    const unsafeRedirect = safe.replace(
      encodeURIComponent("http://localhost:3100/auth/callback?intent=recovery"),
      encodeURIComponent(
        "https://example.invalid/auth/callback?intent=recovery",
      ),
    );

    expect(extractSafeAuthLink(`${wrongKind} ${safe}`, "recovery")).toBe(safe);
    expect(extractSafeAuthLink(wrongHost, "recovery")).toBeNull();
    expect(extractSafeAuthLink(unsafeRedirect, "recovery")).toBeNull();
  });
});
