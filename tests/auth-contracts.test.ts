// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  mapAuthErrorToMessage,
  sanitizeInternalRedirectPath,
} from "@/application/auth";
import {
  invitationTokenSchema,
  passwordResetRequestSchema,
  passwordUpdateSchema,
  seasonFormSchema,
  signInFormSchema,
  signUpFormSchema,
  updateAccountSchema,
} from "@/application/auth/validation";
import { AUTH_ERROR_CODES } from "@/auth/auth-errors";

describe("auth redirects", () => {
  it("accepts only internal redirect paths", () => {
    expect(sanitizeInternalRedirectPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeInternalRedirectPath("/invite/token-value")).toBe(
      "/invite/token-value",
    );
    expect(sanitizeInternalRedirectPath("https://example.com")).toBe("/direct");
    expect(sanitizeInternalRedirectPath("//example.com")).toBe("/direct");
    expect(sanitizeInternalRedirectPath("javascript:alert(1)")).toBe("/direct");
    expect(sanitizeInternalRedirectPath("")).toBe("/direct");
  });
});

describe("auth validation", () => {
  it("normalizes sign-in input and sanitizes its redirect", () => {
    expect(
      signInFormSchema.parse({
        email: "  ALICE@example.com ",
        password: "mot-de-passe-solide",
        next: "/markets",
      }),
    ).toEqual({
      email: "alice@example.com",
      password: "mot-de-passe-solide",
      next: "/markets",
    });

    expect(
      signInFormSchema.parse({
        email: "alice@example.com",
        password: " mot-de-passe-solide ",
        next: "https://example.com",
      }),
    ).toEqual({
      email: "alice@example.com",
      password: " mot-de-passe-solide ",
      next: "/direct",
    });
  });

  it("normalizes and validates sign-up input", () => {
    expect(
      signUpFormSchema.parse({
        email: "alice@example.com",
        displayName: "  Alice   Marchés ",
        password: "mot-de-passe-solide",
        passwordConfirmation: "mot-de-passe-solide",
        next: "/direct",
      }),
    ).toMatchObject({
      displayName: "Alice Marchés",
      next: "/direct",
    });

    expect(() =>
      signUpFormSchema.parse({
        email: "not-email",
        displayName: "Alice",
        password: "mot-de-passe-solide",
        passwordConfirmation: "mot-de-passe-solide",
      }),
    ).toThrow();
    expect(() =>
      signUpFormSchema.parse({
        email: "alice@example.com",
        displayName: "Alice",
        password: "tropcourt",
        passwordConfirmation: "different!",
      }),
    ).toThrow();
    expect(() =>
      signUpFormSchema.parse({
        email: "alice@example.com",
        displayName: "<Alice>",
        password: "mot-de-passe-solide",
        passwordConfirmation: "mot-de-passe-solide",
        next: "//example.com",
      }),
    ).toThrow();
    expect(
      signUpFormSchema.parse({
        email: "alice@example.com",
        displayName: "Alice",
        password: "mot-de-passe-solide",
        passwordConfirmation: "mot-de-passe-solide",
        next: "https://example.com",
      }).next,
    ).toBe("/direct");
  });

  it("normalizes password reset requests", () => {
    expect(
      passwordResetRequestSchema.parse({ email: " ALICE@example.com " }),
    ).toEqual({ email: "alice@example.com" });
  });

  it("validates matching password updates", () => {
    expect(
      passwordUpdateSchema.parse({
        password: "nouveau-mot-de-passe",
        passwordConfirmation: "nouveau-mot-de-passe",
      }),
    ).toEqual({
      password: "nouveau-mot-de-passe",
      passwordConfirmation: "nouveau-mot-de-passe",
    });

    expect(() =>
      passwordUpdateSchema.parse({
        password: "tropcourt",
        passwordConfirmation: "tropcourt",
      }),
    ).toThrow();
    expect(() =>
      passwordUpdateSchema.parse({
        password: "nouveau-mot-de-passe",
        passwordConfirmation: "autre-mot-de-passe",
      }),
    ).toThrow();
    const overlengthResult = passwordUpdateSchema.safeParse({
      password: "a".repeat(129),
      passwordConfirmation: "a".repeat(129),
    });
    expect(overlengthResult.success).toBe(false);
    if (!overlengthResult.success) {
      expect(overlengthResult.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["password"],
            message: "Le mot de passe est trop long",
          }),
        ]),
      );
    }
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
    expect(AUTH_ERROR_CODES).toEqual(
      expect.arrayContaining([
        "AUTH_INVALID_CREDENTIALS",
        "AUTH_SIGN_UP_FAILED",
        "AUTH_PASSWORD_RESET_FAILED",
        "AUTH_PASSWORD_UPDATE_FAILED",
      ]),
    );
    expect(mapAuthErrorToMessage("AUTH_INVALID_CREDENTIALS")).toBe(
      "Connexion impossible. Vérifie tes informations ou réinitialise ton mot de passe.",
    );
    expect(mapAuthErrorToMessage("AUTH_SIGN_UP_FAILED")).toBe(
      "Impossible de créer le compte. Vérifie les informations et réessaie.",
    );
    expect(mapAuthErrorToMessage("AUTH_PASSWORD_RESET_FAILED")).toBe(
      "La demande n'a pas pu être traitée. Réessaie dans quelques instants.",
    );
    expect(mapAuthErrorToMessage("AUTH_PASSWORD_UPDATE_FAILED")).toBe(
      "Le mot de passe n'a pas pu être modifié. Demande un nouveau lien.",
    );
    expect(mapAuthErrorToMessage("AUTH_CALLBACK_FAILED")).toBe(
      "La demande d'authentification n'a pas pu être validée. Recommence depuis la connexion.",
    );
    const genericAuthCodes = [
      "AUTH_INVALID_CREDENTIALS",
      "AUTH_SIGN_UP_FAILED",
      "AUTH_PASSWORD_RESET_FAILED",
      "AUTH_PASSWORD_UPDATE_FAILED",
      "AUTH_CALLBACK_FAILED",
    ] as const;
    for (const code of genericAuthCodes) {
      expect(mapAuthErrorToMessage(code)).not.toMatch(
        /token|secret|supabase|utilisateur (?:existe|introuvable)/i,
      );
    }
  });
});
