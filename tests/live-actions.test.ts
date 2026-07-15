import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc, redirect, revalidatePath } = vi.hoisted(() => ({
  rpc: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  revalidatePath: vi.fn(),
}));

import { createLiveSessionAction } from "@/application/lives/actions";

vi.mock("@/auth/require-auth", () => ({
  requireAuthForAction: vi.fn(async () => ({ userId: "actor" })),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({ rpc })),
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));

function validFormData() {
  const formData = new FormData();
  formData.set("seasonId", "10000000-0000-4000-8000-000000000001");
  formData.set("title", "Live instantané");
  formData.set("liveType", "INSTANT");
  formData.set("hostUserId", "20000000-0000-4000-8000-000000000001");
  formData.set("idempotencyKey", "30000000-0000-4000-8000-000000000001");
  return formData;
}

describe("createLiveSessionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rpc.mockResolvedValue({ data: { id: "live-id" }, error: null });
  });

  it("sends null schedules for an unscheduled instant live", async () => {
    await expect(
      createLiveSessionAction({ ok: false, message: "" }, validFormData()),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(rpc).toHaveBeenCalledWith("create_live_session", {
      p_attendees: [],
      p_description: "",
      p_host_user_id: "20000000-0000-4000-8000-000000000001",
      p_idempotency_key: "30000000-0000-4000-8000-000000000001",
      p_live_type: "INSTANT",
      p_location_label: "",
      p_scheduled_end: null,
      p_scheduled_start: null,
      p_season_id: "10000000-0000-4000-8000-000000000001",
      p_title: "Live instantané",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/lives");
    expect(redirect).toHaveBeenCalledWith("/admin/lives?created=1");
  });

  it("returns safe validation and database error messages", async () => {
    const invalid = new FormData();
    await expect(
      createLiveSessionAction({ ok: false, message: "" }, invalid),
    ).resolves.toEqual({
      ok: false,
      message: "Vérifie les informations du live.",
    });

    rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "LIVE_HOST_REQUIRED" },
    });
    await expect(
      createLiveSessionAction({ ok: false, message: "" }, validFormData()),
    ).resolves.toEqual({
      ok: false,
      message: "Choisis un hôte actif disposant du rôle LIVE_HOST.",
    });
  });
});
