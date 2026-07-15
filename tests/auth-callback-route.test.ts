import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { exchangeCodeForSession, rpc } = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession },
    rpc,
  })),
}));

import { GET } from "@/app/auth/callback/route";

describe("GET /auth/callback", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    exchangeCodeForSession.mockResolvedValue({ error: null });
    rpc.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("records a safe stage when the callback has no code", async () => {
    const response = await GET(
      new NextRequest("https://mk-bet.vercel.app/auth/callback"),
    );

    expect(response.headers.get("location")).toBe(
      "https://mk-bet.vercel.app/auth/error?reason=missing_code",
    );
    expect(consoleError).toHaveBeenCalledWith("[auth.callback] failed", {
      stage: "missing_code",
    });
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("records a safe stage when the PKCE exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({
      error: new Error("sensitive provider detail"),
    });

    const response = await GET(
      new NextRequest(
        "https://mk-bet.vercel.app/auth/callback?code=secret-code",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://mk-bet.vercel.app/auth/error?reason=exchange",
    );
    expect(consoleError).toHaveBeenCalledWith("[auth.callback] failed", {
      stage: "exchange",
    });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "sensitive provider detail",
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "secret-code",
    );
  });

  it("distinguishes a profile provisioning failure", async () => {
    rpc.mockResolvedValueOnce({
      data: null,
      error: new Error("sensitive database detail"),
    });

    const response = await GET(
      new NextRequest(
        "https://mk-bet.vercel.app/auth/callback?code=secret-code",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://mk-bet.vercel.app/auth/error?reason=profile",
    );
    expect(consoleError).toHaveBeenCalledWith("[auth.callback] failed", {
      stage: "profile",
    });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "sensitive database detail",
    );
  });

  it("distinguishes a single-room provisioning failure", async () => {
    rpc
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: new Error("sensitive room detail"),
      });

    const response = await GET(
      new NextRequest(
        "https://mk-bet.vercel.app/auth/callback?code=secret-code",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://mk-bet.vercel.app/auth/error?reason=room",
    );
    expect(consoleError).toHaveBeenCalledWith("[auth.callback] failed", {
      stage: "room",
    });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "sensitive room detail",
    );
  });

  it("redirects a valid callback to a sanitized internal path", async () => {
    const response = await GET(
      new NextRequest(
        "https://mk-bet.vercel.app/auth/callback?code=secret-code&next=%2Fmarkets",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://mk-bet.vercel.app/markets",
    );
    expect(consoleError).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenNthCalledWith(1, "ensure_current_profile");
    expect(rpc).toHaveBeenNthCalledWith(2, "ensure_single_room_access");
  });
});
