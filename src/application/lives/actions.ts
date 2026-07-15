"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthForAction } from "@/auth/require-auth";
import { asRpcClient } from "@/data/supabase/rpc";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

import { createLiveSessionSchema } from "./create-live-schema";
import { extractLiveErrorCode, mapLiveErrorToMessage } from "./live-errors";

export interface LiveActionState {
  ok: boolean;
  message: string;
}

interface CreateLiveSessionRpcArgs extends Record<string, unknown> {
  p_season_id: string;
  p_title: string;
  p_description: string;
  p_location_label: string;
  p_live_type: "PROGRAMMED" | "INSTANT" | "TIME_WINDOW";
  p_host_user_id: string;
  p_scheduled_start: string | null;
  p_scheduled_end: string | null;
  p_attendees: Json;
  p_idempotency_key: string;
}

function readUtcDate(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  if (typeof value !== "string" || !value) return null;
  const date = new Date(`${value}Z`);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function readAttendees(formData: FormData) {
  return formData
    .getAll("attendeeUserId")
    .filter((value): value is string => typeof value === "string")
    .map((userId) => ({
      userId,
      liveRole: formData.get(`attendeeRole:${userId}`),
    }));
}

export async function createLiveSessionAction(
  _previousState: LiveActionState,
  formData: FormData,
): Promise<LiveActionState> {
  await requireAuthForAction();
  const parsed = createLiveSessionSchema.safeParse({
    seasonId: formData.get("seasonId"),
    title: formData.get("title"),
    description: formData.get("description") || null,
    locationLabel: formData.get("locationLabel") || null,
    liveType: formData.get("liveType"),
    hostUserId: formData.get("hostUserId"),
    attendees: readAttendees(formData),
    scheduledStart: readUtcDate(formData, "scheduledStart"),
    scheduledEnd: readUtcDate(formData, "scheduledEnd"),
    idempotencyKey: formData.get("idempotencyKey") || randomUUID(),
  });
  if (!parsed.success) {
    return { ok: false, message: "Vérifie les informations du live." };
  }

  const rpcArgs: CreateLiveSessionRpcArgs = {
    p_season_id: parsed.data.seasonId,
    p_title: parsed.data.title,
    p_description: parsed.data.description ?? "",
    p_location_label: parsed.data.locationLabel ?? "",
    p_live_type: parsed.data.liveType,
    p_host_user_id: parsed.data.hostUserId,
    p_scheduled_start: parsed.data.scheduledStart,
    p_scheduled_end: parsed.data.scheduledEnd,
    p_attendees: parsed.data.attendees.map((attendee) => ({
      user_id: attendee.userId,
      live_role: attendee.liveRole,
    })),
    p_idempotency_key: parsed.data.idempotencyKey,
  };
  const supabase = asRpcClient(await createServerSupabaseClient());
  const { error } = await supabase.rpc<Json>("create_live_session", rpcArgs);
  if (error) {
    return {
      ok: false,
      message: mapLiveErrorToMessage(extractLiveErrorCode(error)),
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/lives");
  revalidatePath("/lives");
  redirect("/admin/lives?created=1");
}
