import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePath, remove, rpc, toBuffer, upload } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  remove: vi.fn(),
  rpc: vi.fn(),
  toBuffer: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("@/auth/require-auth", () => ({
  requireAuthForAction: vi.fn(async () => ({ userId: "media-user" })),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    rpc,
    storage: {
      from: vi.fn(() => ({ remove, upload })),
    },
  })),
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("sharp", () => ({
  default: vi.fn(() => ({
    resize: vi.fn(() => ({
      webp: vi.fn(() => ({ toBuffer })),
    })),
    rotate: vi.fn(() => ({
      resize: vi.fn(() => ({
        webp: vi.fn(() => ({ toBuffer })),
      })),
    })),
  })),
}));

import {
  moderateMediaAction,
  uploadSeasonMediaAction,
} from "@/application/media/actions";

const initialState = { ok: false, message: "" };
const seasonId = "10000000-0000-4000-8000-000000000001";

function mediaFormData() {
  const formData = new FormData();
  formData.set("seasonId", seasonId);
  formData.set(
    "file",
    new File(["image bytes"], "souvenir.jpg", { type: "image/jpeg" }),
  );
  return formData;
}

describe("uploadSeasonMediaAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upload.mockResolvedValue({ error: null });
    remove.mockResolvedValue({ error: null });
    rpc.mockResolvedValue({ data: null, error: null });
    toBuffer.mockResolvedValue(Buffer.from("normalised"));
  });

  it("removes the private blob when metadata registration fails", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: "INVALID_MEDIA_OBJECT" },
    });

    await expect(
      uploadSeasonMediaAction(initialState, mediaFormData()),
    ).resolves.toEqual({
      ok: false,
      message:
        "L’enregistrement du média a échoué. Aucun fichier n’a été conservé.",
    });

    expect(remove).toHaveBeenCalledWith([
      expect.stringMatching(
        new RegExp(`^${seasonId}/media-user/[0-9a-f-]{36}\\.webp$`),
      ),
    ]);
  });

  it("maps unreadable image bytes to a safe message", async () => {
    toBuffer.mockRejectedValue(new Error("decoder internals"));

    await expect(
      uploadSeasonMediaAction(initialState, mediaFormData()),
    ).resolves.toEqual({
      ok: false,
      message: "Le fichier image ne peut pas être traité.",
    });
    expect(upload).not.toHaveBeenCalled();
  });

  it("invalidates dependent pages after an approved status is persisted", async () => {
    await expect(moderateMediaAction("media-id", "APPROVED")).resolves.toBe(
      undefined,
    );

    expect(rpc).toHaveBeenCalledWith("moderate_media_asset", {
      p_media_asset_id: "media-id",
      p_status: "APPROVED",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/lives");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/media");
  });
});
