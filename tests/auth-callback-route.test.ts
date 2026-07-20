import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  createServerSupabaseClient,
  exchangeCodeForSession,
  getClaims,
  initializeAuthenticatedAccess,
} = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  getClaims: vi.fn(),
  initializeAuthenticatedAccess: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient,
}));

vi.mock("@/application/auth/initialize-access", () => ({
  initializeAuthenticatedAccess,
}));

import { GET } from "@/app/auth/callback/route";

describe("GET /auth/callback", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    createServerSupabaseClient.mockResolvedValue({
      auth: { exchangeCodeForSession, getClaims },
    });
    exchangeCodeForSession.mockResolvedValue({ error: null });
    getClaims.mockResolvedValue({
      data: { claims: { amr: ["password"] } },
      error: null,
    });
    initializeAuthenticatedAccess.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("routes authoritative recovery claims to the password update without initialization", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { amr: [{ method: "recovery" }] } },
      error: null,
    });

    const response = await GET(
      new NextRequest(
        "https://mk-bet.vercel.app/auth/callback?code=secret-code&intent=signup&next=%2Fmarkets",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://mk-bet.vercel.app/auth/update-password",
    );
    expect(initializeAuthenticatedAccess).not.toHaveBeenCalled();
  });

  it.each(["", "&intent=forged"])(
    "trusts recovery claims when the intent suffix is %s",
    async (intentSuffix) => {
      getClaims.mockResolvedValue({
        data: { claims: { amr: ["recovery"] } },
        error: null,
      });

      const response = await GET(
        new NextRequest(
          `https://mk-bet.vercel.app/auth/callback?code=secret-code${intentSuffix}`,
        ),
      );

      expect(response.headers.get("location")).toBe(
        "https://mk-bet.vercel.app/auth/update-password",
      );
      expect(initializeAuthenticatedAccess).not.toHaveBeenCalled();
    },
  );

  it("rejects a forged recovery intent on an ordinary session", async () => {
    const response = await GET(
      new NextRequest(
        "https://mk-bet.vercel.app/auth/callback?code=secret-code&intent=recovery",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://mk-bet.vercel.app/auth/error?reason=recovery",
    );
    expect(initializeAuthenticatedAccess).not.toHaveBeenCalled();
  });

  it.each([
    ["missing", { data: null, error: null }],
    ["malformed", { data: { claims: { amr: "recovery" } }, error: null }],
    [
      "errored",
      { data: null, error: new Error("sensitive claims provider detail") },
    ],
  ])("maps %s claims to a stable claims failure", async (_label, result) => {
    getClaims.mockResolvedValue(result);

    const response = await GET(
      new NextRequest(
        "https://mk-bet.vercel.app/auth/callback?code=secret-code&intent=signup",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://mk-bet.vercel.app/auth/error?reason=claims",
    );
    expect(initializeAuthenticatedAccess).not.toHaveBeenCalled();
    expect(JSON.stringify(consoleError.mock.calls)).not.toMatch(
      /secret-code|sensitive claims provider detail|recovery/i,
    );
  });

  it("maps a thrown claims lookup to the stable claims failure", async () => {
    getClaims.mockRejectedValue(new Error("sensitive thrown claims detail"));

    const response = await GET(
      new NextRequest(
        "https://mk-bet.vercel.app/auth/callback?code=secret-code&intent=signup",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://mk-bet.vercel.app/auth/error?reason=claims",
    );
    expect(initializeAuthenticatedAccess).not.toHaveBeenCalled();
    expect(JSON.stringify(consoleError.mock.calls)).not.toMatch(
      /secret-code|sensitive thrown claims detail|signup/i,
    );
  });

  it("initializes non-recovery callbacks and redirects to a sanitized internal path", async () => {
    const response = await GET(
      new NextRequest(
        "https://mk-bet.vercel.app/auth/callback?code=secret-code&intent=signup&next=%2Fmarkets",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://mk-bet.vercel.app/markets",
    );
    expect(initializeAuthenticatedAccess).toHaveBeenCalledOnce();

    const unsafeResponse = await GET(
      new NextRequest(
        "https://mk-bet.vercel.app/auth/callback?code=secret-code&next=https%3A%2F%2Fevil.example",
      ),
    );
    expect(unsafeResponse.headers.get("location")).toBe(
      "https://mk-bet.vercel.app/direct",
    );
  });

  it.each(["profile", "room"] as const)(
    "maps a %s initialization failure without leaking raw details",
    async (stage) => {
      initializeAuthenticatedAccess.mockResolvedValue({ ok: false, stage });

      const response = await GET(
        new NextRequest(
          "https://mk-bet.vercel.app/auth/callback?code=secret-code&next=%2Fmarkets",
        ),
      );

      expect(response.headers.get("location")).toBe(
        `https://mk-bet.vercel.app/auth/error?reason=${stage}`,
      );
      expect(consoleError).toHaveBeenCalledWith("[auth.callback] failed", {
        stage,
      });
    },
  );

  it("maps thrown initialization failures to a stable profile stage", async () => {
    initializeAuthenticatedAccess.mockRejectedValue(
      new Error("sensitive thrown initialization detail"),
    );

    const response = await GET(
      new NextRequest(
        "https://mk-bet.vercel.app/auth/callback?code=secret-code",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://mk-bet.vercel.app/auth/error?reason=profile",
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "sensitive thrown initialization detail",
    );
  });

  it("keeps missing-code and exchange failures stable without leaking secrets", async () => {
    const missingResponse = await GET(
      new NextRequest("https://mk-bet.vercel.app/auth/callback"),
    );
    expect(missingResponse.headers.get("location")).toBe(
      "https://mk-bet.vercel.app/auth/error?reason=missing_code",
    );

    exchangeCodeForSession.mockResolvedValue({
      error: new Error("sensitive provider detail"),
    });
    const exchangeResponse = await GET(
      new NextRequest(
        "https://mk-bet.vercel.app/auth/callback?code=secret-code&intent=recovery&next=%2Fprivate",
      ),
    );
    expect(exchangeResponse.headers.get("location")).toBe(
      "https://mk-bet.vercel.app/auth/error?reason=exchange",
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toMatch(
      /secret-code|sensitive provider detail|private|recovery/i,
    );
    expect(getClaims).not.toHaveBeenCalled();
  });

  it("contains client creation exceptions as stable exchange failures", async () => {
    createServerSupabaseClient.mockRejectedValue(
      new Error("sensitive Supabase configuration detail"),
    );

    const response = await GET(
      new NextRequest(
        "https://mk-bet.vercel.app/auth/callback?code=secret-code&intent=recovery&next=%2Fprivate",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://mk-bet.vercel.app/auth/error?reason=exchange",
    );
    expect(consoleError).toHaveBeenCalledWith("[auth.callback] failed", {
      stage: "exchange",
    });
    expect(
      `${response.headers.get("location")}${JSON.stringify(consoleError.mock.calls)}`,
    ).not.toMatch(/secret-code|configuration detail|private|recovery/i);
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(getClaims).not.toHaveBeenCalled();
  });

  it("contains thrown code exchanges as stable exchange failures", async () => {
    exchangeCodeForSession.mockRejectedValue(
      new Error("sensitive exchange network detail"),
    );

    const response = await GET(
      new NextRequest(
        "https://mk-bet.vercel.app/auth/callback?code=secret-code&intent=signup&next=%2Fmarkets",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://mk-bet.vercel.app/auth/error?reason=exchange",
    );
    expect(consoleError).toHaveBeenCalledWith("[auth.callback] failed", {
      stage: "exchange",
    });
    expect(
      `${response.headers.get("location")}${JSON.stringify(consoleError.mock.calls)}`,
    ).not.toMatch(/secret-code|network detail|markets|signup/i);
    expect(getClaims).not.toHaveBeenCalled();
  });
});
