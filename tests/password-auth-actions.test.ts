// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { SupabaseConfigurationError } from "@/lib/supabase/errors";

const {
  createServerSupabaseClient,
  getClaims,
  getSiteUrl,
  redirect,
  resetPasswordForEmail,
  rpc,
  signInWithPassword,
  signOut,
  signUp,
  updateUser,
} = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  getClaims: vi.fn(),
  getSiteUrl: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  resetPasswordForEmail: vi.fn(),
  rpc: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect }));

vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient }));

vi.mock("@/config/env", () => ({ getSiteUrl }));

vi.mock("@/data/supabase/rpc", () => ({
  asRpcClient: vi.fn(() => ({ rpc })),
}));

import {
  requestPasswordResetAction,
  signInWithPasswordAction,
  signUpWithPasswordAction,
  updatePasswordAction,
  type AuthFormState,
} from "@/application/auth/actions";
import { initializeAuthenticatedAccess } from "@/application/auth/initialize-access";
import { hasRecoveryAuthenticationMethod } from "@/application/auth/recovery-claims";

const initialState: AuthFormState = {
  ok: false,
  code: "AUTH_REQUIRED",
  message: "",
};

function formData(values: Record<string, string>): FormData {
  const form = new FormData();
  for (const [name, value] of Object.entries(values)) {
    form.set(name, value);
  }
  return form;
}

const validSignInData = () =>
  formData({
    email: "  ALICE@example.com ",
    password: "mot-de-passe-solide",
    next: "/markets",
  });

const validSignUpData = () =>
  formData({
    displayName: "  Alice   Marchés ",
    email: "  ALICE@example.com ",
    password: "mot-de-passe-solide",
    passwordConfirmation: "mot-de-passe-solide",
    next: "/direct",
  });

const validResetData = () => formData({ email: "  ALICE@example.com " });

const validPasswordUpdateData = () =>
  formData({
    password: "nouveau-mot-de-passe",
    passwordConfirmation: "nouveau-mot-de-passe",
  });

describe("password authentication actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSiteUrl.mockReturnValue("https://mk-bet.vercel.app");
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getClaims,
        resetPasswordForEmail,
        signInWithPassword,
        signOut,
        signUp,
        updateUser,
      },
    });
    getClaims.mockResolvedValue({
      data: { claims: { amr: [{ method: "recovery" }] } },
      error: null,
    });
    resetPasswordForEmail.mockResolvedValue({ error: null });
    rpc.mockResolvedValue({ data: "resource-id", error: null });
    signInWithPassword.mockResolvedValue({ error: null });
    signOut.mockResolvedValue({ error: null });
    signUp.mockResolvedValue({ data: { user: {} }, error: null });
    updateUser.mockResolvedValue({ error: null });
  });

  it("signs in with normalized credentials, initializes access in order, and redirects safely", async () => {
    await expect(
      signInWithPasswordAction(initialState, validSignInData()),
    ).rejects.toThrow("NEXT_REDIRECT:/markets");

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "alice@example.com",
      password: "mot-de-passe-solide",
    });
    expect(rpc).toHaveBeenNthCalledWith(1, "ensure_current_profile");
    expect(rpc).toHaveBeenNthCalledWith(2, "ensure_single_room_access");
    expect(redirect).toHaveBeenCalledWith("/markets");
  });

  it("sanitizes an external sign-in redirect to the internal default", async () => {
    const unsafeData = validSignInData();
    unsafeData.set("next", "https://evil.example/private");

    await expect(
      signInWithPasswordAction(initialState, unsafeData),
    ).rejects.toThrow("NEXT_REDIRECT:/direct");

    expect(redirect).toHaveBeenCalledWith("/direct");
  });

  it("returns a generic failure without leaking invalid-credential details", async () => {
    signInWithPassword.mockResolvedValue({
      error: new Error("user missing: alice@example.com"),
    });

    const result = await signInWithPasswordAction(
      initialState,
      validSignInData(),
    );

    expect(result).toMatchObject({
      ok: false,
      code: "AUTH_INVALID_CREDENTIALS",
    });
    expect(JSON.stringify(result)).not.toContain("user missing");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("signs out and reports a database failure when the profile RPC throws", async () => {
    rpc.mockRejectedValueOnce(new Error("profile raw"));

    const result = await signInWithPasswordAction(
      initialState,
      validSignInData(),
    );

    expect(signOut).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      ok: false,
      code: "DATABASE_OPERATION_FAILED",
    });
    expect(JSON.stringify(result)).not.toContain("profile raw");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("signs out and reports a database failure when the room RPC throws", async () => {
    rpc
      .mockResolvedValueOnce({ data: "profile-id", error: null })
      .mockRejectedValueOnce(new Error("room raw"));

    const result = await signInWithPasswordAction(
      initialState,
      validSignInData(),
    );

    expect(signOut).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      ok: false,
      code: "DATABASE_OPERATION_FAILED",
    });
    expect(JSON.stringify(result)).not.toContain("room raw");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("creates an account with normalized data and a safe confirmation callback", async () => {
    const result = await signUpWithPasswordAction(
      initialState,
      validSignUpData(),
    );

    expect(signUp).toHaveBeenCalledWith({
      email: "alice@example.com",
      password: "mot-de-passe-solide",
      options: {
        data: { display_name: "Alice Marchés" },
        emailRedirectTo:
          "https://mk-bet.vercel.app/auth/callback?intent=signup&next=%2Fdirect",
      },
    });
    expect(result).toEqual({
      ok: true,
      message:
        "Compte créé. Confirme ton adresse depuis l'e-mail reçu avant de te connecter.",
    });
  });

  it("uses the configured site origin and sanitizes an external sign-up redirect", async () => {
    const unsafeData = validSignUpData();
    unsafeData.set("next", "//evil.example/private");

    await signUpWithPasswordAction(initialState, unsafeData);

    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo:
            "https://mk-bet.vercel.app/auth/callback?intent=signup&next=%2Fdirect",
        }),
      }),
    );
    expect(getSiteUrl).toHaveBeenCalledOnce();
  });

  it("returns the exact same success for new and already-registered accounts", async () => {
    const newAccountResult = await signUpWithPasswordAction(
      initialState,
      validSignUpData(),
    );
    signUp.mockResolvedValue({
      data: { user: null },
      error: new Error("User already registered"),
    });

    const registeredAccountResult = await signUpWithPasswordAction(
      initialState,
      validSignUpData(),
    );

    expect(newAccountResult).toEqual({
      ok: true,
      message:
        "Compte créé. Confirme ton adresse depuis l'e-mail reçu avant de te connecter.",
    });
    expect(registeredAccountResult).toEqual(newAccountResult);
    expect(JSON.stringify(registeredAccountResult)).not.toContain(
      "User already registered",
    );
  });

  it.each([
    ["success", null],
    ["functional error", new Error("account not found")],
  ])("returns the same generic reset success for %s", async (_case, error) => {
    resetPasswordForEmail.mockResolvedValue({ error });

    const result = await requestPasswordResetAction(
      initialState,
      validResetData(),
    );

    expect(resetPasswordForEmail).toHaveBeenCalledWith("alice@example.com", {
      redirectTo: "https://mk-bet.vercel.app/auth/callback?intent=recovery",
    });
    expect(result).toEqual({
      ok: true,
      message:
        "Si un compte correspond à cette adresse, un e-mail de récupération vient d'être envoyé.",
    });
    expect(JSON.stringify(result)).not.toContain("account not found");
  });

  it("checks recovery claims before updating the password", async () => {
    const result = await updatePasswordAction(
      initialState,
      validPasswordUpdateData(),
    );

    expect(getClaims).toHaveBeenCalledOnce();
    expect(updateUser).toHaveBeenCalledWith({
      password: "nouveau-mot-de-passe",
    });
    expect(getClaims.mock.invocationCallOrder[0]).toBeLessThan(
      updateUser.mock.invocationCallOrder[0],
    );
    expect(signOut).toHaveBeenCalledOnce();
    expect(updateUser.mock.invocationCallOrder[0]).toBeLessThan(
      signOut.mock.invocationCallOrder[0],
    );
    expect(result).toEqual({
      ok: true,
      message: "Mot de passe modifié. Tu peux maintenant te connecter.",
    });
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("keeps a successful password update successful when local sign-out cleanup fails", async () => {
    signOut.mockRejectedValue(new Error("sensitive cleanup detail"));

    const result = await updatePasswordAction(
      initialState,
      validPasswordUpdateData(),
    );

    expect(result).toEqual({
      ok: true,
      message: "Mot de passe modifié. Tu peux maintenant te connecter.",
    });
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(JSON.stringify(result)).not.toContain("sensitive cleanup detail");
  });

  it("accepts a recovery AMR represented as a string", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { amr: ["recovery"] } },
      error: null,
    });

    const result = await updatePasswordAction(
      initialState,
      validPasswordUpdateData(),
    );

    expect(updateUser).toHaveBeenCalledWith({
      password: "nouveau-mot-de-passe",
    });
    expect(result).toEqual({
      ok: true,
      message: "Mot de passe modifié. Tu peux maintenant te connecter.",
    });
  });

  it("rejects an ordinary password session for a recovery update", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { amr: [{ method: "password" }] } },
      error: null,
    });

    const result = await updatePasswordAction(
      initialState,
      validPasswordUpdateData(),
    );

    expect(result).toMatchObject({ ok: false, code: "AUTH_INVALID_SESSION" });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it.each([
    ["missing claims", null, null],
    ["malformed claims", { claims: { amr: "recovery" } }, null],
    ["claims error", null, new Error("invalid JWT raw")],
  ])("rejects %s for a recovery update", async (_label, data, error) => {
    getClaims.mockResolvedValue({ data, error });

    const result = await updatePasswordAction(
      initialState,
      validPasswordUpdateData(),
    );

    expect(result).toMatchObject({
      ok: false,
      code: "AUTH_INVALID_SESSION",
    });
    expect(updateUser).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("invalid JWT raw");
  });

  it("returns a generic password-update failure without raw details", async () => {
    updateUser.mockResolvedValue({ error: new Error("weak password raw") });

    const result = await updatePasswordAction(
      initialState,
      validPasswordUpdateData(),
    );

    expect(result).toMatchObject({
      ok: false,
      code: "AUTH_PASSWORD_UPDATE_FAILED",
    });
    expect(JSON.stringify(result)).not.toContain("weak password raw");
  });

  it("maps a Supabase configuration exception to the stable configuration error", async () => {
    createServerSupabaseClient.mockRejectedValue(
      new SupabaseConfigurationError("private configuration detail"),
    );

    const result = await signInWithPasswordAction(
      initialState,
      validSignInData(),
    );

    expect(result).toMatchObject({
      ok: false,
      code: "SUPABASE_NOT_CONFIGURED",
    });
    expect(JSON.stringify(result)).not.toContain(
      "private configuration detail",
    );
  });

  it.each([
    ["sign-up", signUpWithPasswordAction, validSignUpData],
    ["reset", requestPasswordResetAction, validResetData],
    ["update", updatePasswordAction, validPasswordUpdateData],
  ])(
    "maps a client configuration exception for %s without raw details",
    async (_label, action, validData) => {
      createServerSupabaseClient.mockRejectedValue(
        new SupabaseConfigurationError("private client configuration"),
      );

      const result = await action(initialState, validData());

      expect(result).toMatchObject({
        ok: false,
        code: "SUPABASE_NOT_CONFIGURED",
      });
      expect(JSON.stringify(result)).not.toContain(
        "private client configuration",
      );
    },
  );

  it.each([
    ["sign-up", signUpWithPasswordAction, validSignUpData],
    ["reset", requestPasswordResetAction, validResetData],
  ])(
    "maps a site URL configuration exception for %s without raw details",
    async (_label, action, validData) => {
      getSiteUrl.mockImplementationOnce(() => {
        throw new Error("raw NEXT_PUBLIC_SITE_URL detail");
      });

      const result = await action(initialState, validData());

      expect(result).toMatchObject({
        ok: false,
        code: "SUPABASE_NOT_CONFIGURED",
      });
      expect(JSON.stringify(result)).not.toContain(
        "raw NEXT_PUBLIC_SITE_URL detail",
      );
    },
  );
});

describe("hasRecoveryAuthenticationMethod", () => {
  it.each([
    [{ amr: ["recovery"] }],
    [{ amr: [{ method: "recovery" }] }],
    [{ amr: ["password", { method: "recovery" }] }],
  ])("accepts a valid recovery AMR %#", (claims) => {
    expect(hasRecoveryAuthenticationMethod(claims)).toBe(true);
  });

  it.each([
    null,
    undefined,
    {},
    { amr: "recovery" },
    { amr: [] },
    { amr: ["password"] },
    { amr: [{ method: "password" }] },
    { amr: [null, "recovery"] },
    { amr: [{ method: 42 }, "recovery"] },
  ])("fails closed for missing, ordinary, or malformed claims %#", (claims) => {
    expect(hasRecoveryAuthenticationMethod(claims)).toBe(false);
  });
});

describe("initializeAuthenticatedAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the profile stage and stops when profile initialization fails", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: new Error("raw profile") });

    const result = await initializeAuthenticatedAccess({} as never);

    expect(result).toEqual({ ok: false, stage: "profile" });
    expect(rpc).toHaveBeenCalledOnce();
  });

  it("returns the room stage when room initialization fails", async () => {
    rpc
      .mockResolvedValueOnce({ data: "profile-id", error: null })
      .mockResolvedValueOnce({ data: null, error: new Error("raw room") });

    const result = await initializeAuthenticatedAccess({} as never);

    expect(result).toEqual({ ok: false, stage: "room" });
    expect(rpc).toHaveBeenNthCalledWith(1, "ensure_current_profile");
    expect(rpc).toHaveBeenNthCalledWith(2, "ensure_single_room_access");
  });

  it("converts a thrown profile RPC failure to the profile stage", async () => {
    rpc.mockRejectedValueOnce(new Error("thrown raw profile"));

    const result = await initializeAuthenticatedAccess({} as never);

    expect(result).toEqual({ ok: false, stage: "profile" });
    expect(JSON.stringify(result)).not.toContain("thrown raw profile");
  });

  it("converts a thrown room RPC failure to the room stage", async () => {
    rpc
      .mockResolvedValueOnce({ data: "profile-id", error: null })
      .mockRejectedValueOnce(new Error("thrown raw room"));

    const result = await initializeAuthenticatedAccess({} as never);

    expect(result).toEqual({ ok: false, stage: "room" });
    expect(JSON.stringify(result)).not.toContain("thrown raw room");
  });
});
