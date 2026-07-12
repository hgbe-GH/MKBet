// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  mapAuthErrorToMessage,
  sanitizeInternalRedirectPath,
} from "@/application/auth";
import {
  invitationTokenSchema,
  loginFormSchema,
  seasonFormSchema,
  updateAccountSchema,
} from "@/application/auth/validation";
import { AUTH_ERROR_CODES } from "@/auth/auth-errors";

describe("auth redirects", () => {
  it("accepts only internal redirect paths", () => {
    expect(sanitizeInternalRedirectPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeInternalRedirectPath("/invite/token-value")).toBe(
      "/invite/token-value",
    );
    expect(sanitizeInternalRedirectPath("https://example.com")).toBe(
      "/seasons",
    );
    expect(sanitizeInternalRedirectPath("//example.com")).toBe("/seasons");
    expect(sanitizeInternalRedirectPath("javascript:alert(1)")).toBe(
      "/seasons",
    );
    expect(sanitizeInternalRedirectPath("")).toBe("/seasons");
  });
});

describe("auth validation", () => {
  it("validates login input without leaking account existence", () => {
    expect(
      loginFormSchema.parse({
        email: "  ALICE@example.com ",
        displayName: "  Alice   Marchés ",
        next: "/invite/private-token",
      }),
    ).toEqual({
      email: "alice@example.com",
      displayName: "Alice Marchés",
      next: "/invite/private-token",
    });

    expect(() =>
      loginFormSchema.parse({ email: "not-email", displayName: "" }),
    ).toThrow();
  });

  it("validates season creation input", () => {
    expect(
      seasonFormSchema.parse({
        title: "  Saison A ",
        description: "  Table privée ",
        breakupDate: "2026-07-01",
        startedAt: "2026-07-12T10:00:00.000Z",
        startingBalanceMkb: "1000",
        secretBetsUntilClose: "on",
      }),
    ).toMatchObject({
      title: "Saison A",
      description: "Table privée",
      startingBalanceMkb: 1000,
      secretBetsUntilClose: true,
    });
  });

  it("validates invitation token and account update input", () => {
    expect(invitationTokenSchema.parse("abc.DEF-123_4567")).toBe(
      "abc.DEF-123_4567",
    );
    expect(updateAccountSchema.parse({ displayName: "  Bob  " })).toEqual({
      displayName: "Bob",
      avatarUrl: null,
    });
    expect(() =>
      updateAccountSchema.parse({ displayName: "<b></b>" }),
    ).toThrow();
  });
});

describe("auth errors", () => {
  it("exposes stable error codes and generic French messages", () => {
    expect(AUTH_ERROR_CODES).toContain("AUTH_REQUIRED");
    expect(AUTH_ERROR_CODES).toContain("INVITATION_EMAIL_MISMATCH");
    expect(mapAuthErrorToMessage("AUTH_EMAIL_SEND_FAILED")).toBe(
      "Impossible d'envoyer le lien d'accès. Réessaie dans quelques instants.",
    );
    expect(mapAuthErrorToMessage("DATABASE_OPERATION_FAILED")).not.toMatch(
      /token|secret|SUPABASE_SERVICE_ROLE_KEY/i,
    );
  });
});
