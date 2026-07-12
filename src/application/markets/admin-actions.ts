"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  extractBettingErrorCode,
  mapBettingErrorToMessage,
} from "@/application/betting/betting-errors";
import { marketAdministrationSchema } from "@/application/betting/betting-schemas";
import { requireAuthForAction } from "@/auth/require-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface MarketActionState {
  ok: boolean;
  message: string;
}

function isoFromForm(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : "";
}

export async function openTemplateMarketAction(
  _previous: MarketActionState,
  formData: FormData,
): Promise<MarketActionState> {
  await requireAuthForAction();
  const parsed = marketAdministrationSchema.safeParse({
    seasonId: formData.get("seasonId"),
    templateCode: formData.get("templateCode"),
    deadlineAt: isoFromForm(formData.get("deadlineAt")),
    opensAt: isoFromForm(formData.get("opensAt")),
    closesAt: isoFromForm(formData.get("closesAt")),
    titleOverride: formData.get("titleOverride") || null,
    trashTitleOverride: formData.get("trashTitleOverride") || null,
    description: formData.get("description") || null,
    idempotencyKey: formData.get("idempotencyKey") || randomUUID(),
  });
  if (!parsed.success)
    return { ok: false, message: "Vérifie les dates et les champs du marché." };
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("open_template_binary_market", {
    p_season_id: parsed.data.seasonId,
    p_template_code: parsed.data.templateCode,
    p_deadline_at: parsed.data.deadlineAt,
    p_opens_at: parsed.data.opensAt,
    p_closes_at: parsed.data.closesAt,
    p_title_override: parsed.data.titleOverride ?? "",
    p_trash_title_override: parsed.data.trashTitleOverride ?? "",
    p_description: parsed.data.description ?? "",
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) {
    const code = extractBettingErrorCode(error);
    return { ok: false, message: mapBettingErrorToMessage(code) };
  }
  revalidatePath("/admin/markets");
  revalidatePath("/markets");
  return {
    ok: true,
    message: "Marché créé avec ses cotes et snapshots initiaux.",
  };
}

const statusSchema = z.object({
  marketId: z.string().uuid(),
  action: z.enum(["SUSPEND", "REOPEN", "CLOSE"]),
  reason: z.string().trim().max(500).optional(),
});

export async function changeMarketStatusAction(
  input: z.infer<typeof statusSchema>,
): Promise<MarketActionState> {
  await requireAuthForAction();
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: "Action de marché invalide." };
  const supabase = await createServerSupabaseClient();
  const result =
    parsed.data.action === "SUSPEND"
      ? await supabase.rpc("suspend_market", {
          p_market_id: parsed.data.marketId,
          p_reason: parsed.data.reason ?? "Suspension administrative",
        })
      : parsed.data.action === "REOPEN"
        ? await supabase.rpc("reopen_market", {
            p_market_id: parsed.data.marketId,
          })
        : await supabase.rpc("close_market", {
            p_market_id: parsed.data.marketId,
            p_reason: parsed.data.reason,
          });
  if (result.error) {
    const code = extractBettingErrorCode(result.error);
    return { ok: false, message: mapBettingErrorToMessage(code) };
  }
  revalidatePath("/admin/markets");
  revalidatePath("/markets");
  return { ok: true, message: "Statut du marché mis à jour." };
}

const initializeSchema = z.object({
  seasonId: z.string().uuid(),
  physicalDeadlineAt: z.string().datetime({ offset: true }),
  relationshipDeadlineAt: z.string().datetime({ offset: true }),
  closesAt: z.string().datetime({ offset: true }),
  idempotencyKey: z.string().uuid(),
});

export async function initializeDefaultMarketsAction(
  input: z.infer<typeof initializeSchema>,
): Promise<MarketActionState> {
  await requireAuthForAction();
  const parsed = initializeSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: "Dates d'initialisation invalides." };
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("initialize_default_season_markets", {
    p_season_id: parsed.data.seasonId,
    p_physical_deadline_at: parsed.data.physicalDeadlineAt,
    p_relationship_deadline_at: parsed.data.relationshipDeadlineAt,
    p_closes_at: parsed.data.closesAt,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) {
    const code = extractBettingErrorCode(error);
    return { ok: false, message: mapBettingErrorToMessage(code) };
  }
  revalidatePath("/admin/markets");
  revalidatePath("/markets");
  return { ok: true, message: "Les sept marchés de base sont prêts." };
}
