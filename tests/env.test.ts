import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getPublicSupabaseEnv,
  getServerSupabaseEnv,
  getSiteUrl,
} from "@/config/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("environment validation", () => {
  it("validates the site URL only when it is requested", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");

    expect(() => getSiteUrl()).toThrowError(
      /NEXT_PUBLIC_SITE_URL is missing or invalid/,
    );
  });

  it("returns a validated absolute site URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://mk-bet.vercel.app");

    expect(getSiteUrl()).toBe("https://mk-bet.vercel.app");
  });

  it("reports missing public Supabase configuration clearly", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(() => getPublicSupabaseEnv()).toThrowError(
      /NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
  });

  it("keeps the service role optional for public Supabase features", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    expect(getPublicSupabaseEnv()).toEqual({
      url: "https://project.supabase.co",
      anonKey: "public-anon-key",
    });
  });

  it("requires the service role for administrative Supabase features", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    expect(() => getServerSupabaseEnv()).toThrowError(
      /SUPABASE_SERVICE_ROLE_KEY/,
    );
  });
});
