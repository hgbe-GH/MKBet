import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePath, remove, rpc, toBuffer, upload } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  remove: vi.fn(),
  rpc: vi.fn(),
  toBuffer: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("@/auth/require-auth", () => ({
  requireAuthForAction: vi.fn(async () => ({
    userId: "91000000-0000-4000-8000-000000000001",
  })),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    rpc,
    storage: { from: vi.fn(() => ({ remove, upload })) },
  })),
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("sharp", () => ({
  default: vi.fn(() => ({
    rotate: vi.fn(() => ({
      resize: vi.fn(() => ({
        webp: vi.fn(() => ({ toBuffer })),
      })),
    })),
  })),
}));

import {
  submitEventReportAction,
  voteEventReportAction,
} from "@/application/events/actions";
import { submitEventReport } from "@/data/supabase/events/repository";

const roomId = "6d6b0000-0000-4000-8000-000000000001";
const reportId = "6d6b0000-0000-4000-8000-000000000020";

function reportFormData(fileCount = 2) {
  const data = new FormData();
  data.set("reportType", "KISS");
  data.set("occurredAt", "2026-07-15T14:00:00.000Z");
  data.set("note", "Un baiser observé par le groupe.");
  data.set("marketId", "6d6b0000-0000-4000-8000-000000000010");
  data.set("outcomeId", "6d6b0000-0000-4000-8000-000000000011");
  data.set("idempotencyKey", "6d6b0000-0000-4000-8000-000000000012");
  for (let index = 0; index < fileCount; index += 1) {
    data.append(
      "files",
      new File([`image-${index}`], `preuve-${index}.png`, {
        type: "image/png",
      }),
    );
  }
  return data;
}

describe("event report repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls submit_event_report with the exact typed RPC parameters", async () => {
    rpc.mockResolvedValue({
      data: { report_id: reportId, status: "PENDING" },
      error: null,
    });

    await expect(
      submitEventReport({
        reportType: "KISS",
        occurredAt: "2026-07-15T14:00:00.000Z",
        note: "Preuve",
        marketId: null,
        outcomeId: null,
        media: [],
        idempotencyKey: "6d6b0000-0000-4000-8000-000000000012",
      }),
    ).resolves.toMatchObject({ report_id: reportId });

    expect(rpc).toHaveBeenCalledWith("submit_event_report", {
      p_report_type: "KISS",
      p_occurred_at: "2026-07-15T14:00:00.000Z",
      p_note: "Preuve",
      p_market_id: null,
      p_outcome_id: null,
      p_media: [],
      p_idempotency_key: "6d6b0000-0000-4000-8000-000000000012",
    });
  });
});

describe("event report actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toBuffer.mockResolvedValue(Buffer.from("normalised"));
    upload.mockResolvedValue({ error: null });
    remove.mockResolvedValue({ error: null });
    rpc.mockImplementation(async (name: string) => {
      if (name === "ensure_single_room_access") {
        return { data: roomId, error: null };
      }
      return {
        data: { report_id: reportId, status: "PENDING" },
        error: null,
      };
    });
  });

  it("normalises and uploads every proof before submitting the report", async () => {
    await expect(
      submitEventReportAction({ ok: false, message: "" }, reportFormData()),
    ).resolves.toEqual({
      ok: true,
      message: "Événement envoyé au vote du groupe.",
    });

    expect(toBuffer).toHaveBeenCalledTimes(2);
    expect(upload).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenCalledWith(
      "submit_event_report",
      expect.objectContaining({
        p_media: [
          expect.objectContaining({
            storage_path: expect.stringMatching(
              new RegExp(`^${roomId}/91000000-0000-4000-8000-000000000001/`),
            ),
          }),
          expect.objectContaining({
            storage_path: expect.stringMatching(
              new RegExp(`^${roomId}/91000000-0000-4000-8000-000000000001/`),
            ),
          }),
        ],
      }),
    );
  });

  it("removes every uploaded blob when report persistence fails", async () => {
    rpc.mockImplementation(async (name: string) => {
      if (name === "ensure_single_room_access") {
        return { data: roomId, error: null };
      }
      return { data: null, error: { message: "internal database detail" } };
    });

    await expect(
      submitEventReportAction({ ok: false, message: "" }, reportFormData()),
    ).resolves.toEqual({
      ok: false,
      message: "L’événement n’a pas pu être enregistré. Réessaie.",
    });

    expect(remove).toHaveBeenCalledOnce();
    expect(remove.mock.calls[0]?.[0]).toHaveLength(2);
  });

  it("maps votes to a safe result and revalidates every financial view", async () => {
    await expect(voteEventReportAction(reportId, "CONFIRM")).resolves.toEqual({
      ok: true,
      message: "Ton vote est enregistré.",
    });

    expect(rpc).toHaveBeenCalledWith("vote_event_report", {
      p_report_id: reportId,
      p_decision: "CONFIRM",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/direct");
    expect(revalidatePath).toHaveBeenCalledWith("/markets");
    expect(revalidatePath).toHaveBeenCalledWith("/bets");
    expect(revalidatePath).toHaveBeenCalledWith("/leaderboard");
  });
});
