"use server";

import { randomUUID } from "node:crypto";

import sharp from "sharp";
import { revalidatePath } from "next/cache";

import { requireAuthForAction } from "@/auth/require-auth";
import { asRpcClient } from "@/data/supabase/rpc";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  buildSeasonMediaPath,
  validateMediaUpload,
  validateMediaUploadForm,
} from "@/application/media/validation";

export interface MediaActionState {
  ok: boolean;
  message: string;
}
function failure(message: string): MediaActionState {
  return { ok: false, message };
}

export async function uploadSeasonMediaAction(
  _: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  const auth = await requireAuthForAction();
  const seasonId = formData.get("seasonId");
  const caption = formData.get("caption");
  const file = formData.get("file");
  const formValidation = validateMediaUploadForm({
    caption: typeof caption === "string" ? caption : undefined,
    file,
    seasonId,
  });
  if (!formValidation.ok) return failure(formValidation.message);
  const validation = validateMediaUpload(file);
  if (!(file instanceof File) || !validation.ok) {
    return failure(
      validation.ok
        ? "Choisis une image JPEG, PNG ou WebP de 10 Mo maximum."
        : validation.message,
    );
  }
  let output: Buffer;
  try {
    output = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer();
  } catch {
    return failure("Le fichier image ne peut pas être traité.");
  }
  const path = buildSeasonMediaPath(
    formValidation.seasonId,
    auth.userId,
    randomUUID(),
  );
  const supabase = await createServerSupabaseClient();
  const { error: uploadError } = await supabase.storage
    .from("season-media")
    .upload(path, output, { contentType: "image/webp", upsert: false });
  if (uploadError) return failure("Le téléversement du média a échoué.");
  const { error } = await asRpcClient(supabase).rpc("register_media_asset", {
    p_season_id: formValidation.seasonId,
    p_storage_path: path,
    p_media_type: "image/webp",
    p_caption: formValidation.caption,
    p_live_id: null,
    p_taken_at: null,
  });
  if (error) {
    await supabase.storage.from("season-media").remove([path]);
    return failure(
      "L’enregistrement du média a échoué. Aucun fichier n’a été conservé.",
    );
  }
  revalidatePath("/lives");
  revalidatePath("/admin/media");
  return {
    ok: true,
    message: "Média envoyé : il attend la validation d’un administrateur.",
  };
}

export async function moderateMediaAction(
  mediaId: string,
  status: "APPROVED" | "ARCHIVED" | "REJECTED",
): Promise<void> {
  await requireAuthForAction();
  const { error } = await asRpcClient(await createServerSupabaseClient()).rpc(
    "moderate_media_asset",
    { p_media_asset_id: mediaId, p_status: status },
  );
  if (error) throw new Error("MEDIA_MODERATION_FORBIDDEN");
  revalidatePath("/lives");
  revalidatePath("/admin/media");
}
