"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { z } from "zod";

import { requireAuthForAction } from "@/auth/require-auth";
import {
  createEventReportFormSchema,
  type EventEvidenceFile,
} from "@/application/events/event-report-schema";
import { mapEventError } from "@/application/events/event-errors";
import {
  ensureSingleRoomAccess,
  submitEventReport,
  voteEventReport,
} from "@/data/supabase/events/repository";
import type { EventVoteDecision } from "@/domain/events/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface EventActionState {
  ok: boolean;
  message: string;
}

const idempotencyKeySchema = z.uuid();

const failure = (message: string): EventActionState => ({ ok: false, message });

function asEvidenceDescriptor(file: File): EventEvidenceFile {
  return { name: file.name, size: file.size, type: file.type as EventEvidenceFile["type"] };
}

async function removeUploadedEvidence(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.storage.from("season-media").remove(paths);
  } catch {
    // Best-effort compensation: a later orphan cleanup may remove the blob.
  }
}

export async function submitEventReportAction(
  _: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const auth = await requireAuthForAction();
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const parsed = createEventReportFormSchema().safeParse({
    reportType: formData.get("reportType"),
    occurredAt: formData.get("occurredAt"),
    note: formData.get("note"),
    marketId: formData.get("marketId") || undefined,
    outcomeId: formData.get("outcomeId") || undefined,
    files: files.map(asEvidenceDescriptor),
  });
  const idempotencyKey = idempotencyKeySchema.safeParse(
    formData.get("idempotencyKey"),
  );
  if (!parsed.success || !idempotencyKey.success) {
    return failure("Vérifie la date, la description et les preuves choisies.");
  }

  let roomId: string;
  try {
    roomId = await ensureSingleRoomAccess();
  } catch (error) {
    return failure(mapEventError(error));
  }

  const uploadedPaths: string[] = [];
  try {
    const supabase = await createServerSupabaseClient();
    for (const file of files) {
      const output = await sharp(Buffer.from(await file.arrayBuffer()))
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 84 })
        .toBuffer();
      const path = `${roomId}/${auth.userId}/${randomUUID()}.webp`;
      const { error } = await supabase.storage
        .from("season-media")
        .upload(path, output, { contentType: "image/webp", upsert: false });
      if (error) throw new Error("EVENT_EVIDENCE_UPLOAD_FAILED");
      uploadedPaths.push(path);
    }

    await submitEventReport({
      reportType: parsed.data.reportType,
      occurredAt: parsed.data.occurredAt,
      note: parsed.data.note,
      marketId: parsed.data.marketId ?? null,
      outcomeId: parsed.data.outcomeId ?? null,
      media: uploadedPaths.map((storagePath, index) => ({
        storage_path: storagePath,
        caption: files[index]?.name ?? null,
        taken_at: null,
      })),
      idempotencyKey: idempotencyKey.data,
    });
  } catch {
    await removeUploadedEvidence(uploadedPaths);
    return failure("L’événement n’a pas pu être enregistré. Réessaie.");
  }

  revalidatePath("/direct");
  revalidatePath("/markets");
  return { ok: true, message: "Événement envoyé au vote du groupe." };
}

export async function voteEventReportAction(
  reportId: string,
  decision: EventVoteDecision,
): Promise<EventActionState> {
  await requireAuthForAction();
  try {
    await voteEventReport(reportId, decision);
  } catch (error) {
    return failure(mapEventError(error));
  }
  for (const path of ["/direct", "/markets", "/bets", "/leaderboard"]) {
    revalidatePath(path);
  }
  return { ok: true, message: "Ton vote est enregistré." };
}

