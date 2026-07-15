import { beforeEach, describe, expect, it, vi } from "vitest";

const { download, getSeasonMedia, requireAuthForAction } = vi.hoisted(() => ({
  download: vi.fn(),
  getSeasonMedia: vi.fn(),
  requireAuthForAction: vi.fn(),
}));

vi.mock("@/auth/require-auth", () => ({ requireAuthForAction }));
vi.mock("@/data/supabase/media/repository", () => ({ getSeasonMedia }));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    storage: { from: vi.fn(() => ({ download })) },
  })),
}));

import { GET } from "@/app/api/media/[mediaId]/route";

const params = Promise.resolve({ mediaId: "media-id" });

describe("GET /api/media/[mediaId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthForAction.mockResolvedValue({ userId: "member" });
    getSeasonMedia.mockResolvedValue(null);
  });

  it("returns the same 404 for a missing or inaccessible media asset", async () => {
    const response = await GET(
      new Request("http://localhost/api/media/media-id"),
      {
        params,
      },
    );

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
  });

  it("does not disclose whether authentication or membership failed", async () => {
    requireAuthForAction.mockRejectedValue(new Error("AUTH_REQUIRED"));

    const response = await GET(
      new Request("http://localhost/api/media/media-id"),
      {
        params,
      },
    );

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
  });

  it("returns a private no-store image only after the RLS-backed lookup", async () => {
    getSeasonMedia.mockResolvedValue({
      media_type: "image/webp",
      storage_path: "season/member/asset.webp",
    });
    download.mockResolvedValue({
      data: new Blob(["image"]),
      error: null,
    });

    const response = await GET(
      new Request("http://localhost/api/media/media-id"),
      {
        params,
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Content-Type")).toBe("image/webp");
    expect(download).toHaveBeenCalledWith("season/member/asset.webp");
  });
});
