import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface SeasonMedia {
  id: string;
  caption: string | null;
  mediaType: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";
}
export async function listSeasonMedia(
  seasonId: string,
): Promise<SeasonMedia[]> {
  const { data, error } = await (
    await createServerSupabaseClient()
  )
    .from("media_assets")
    .select("id, caption, media_type, status")
    .eq("season_id", seasonId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("DATABASE_OPERATION_FAILED");
  return (data ?? []).map((row) => ({
    id: row.id,
    caption: row.caption,
    mediaType: row.media_type,
    status: row.status,
  }));
}
export async function getSeasonMedia(mediaId: string) {
  const { data, error } = await (
    await createServerSupabaseClient()
  )
    .from("media_assets")
    .select("storage_path, media_type")
    .eq("id", mediaId)
    .maybeSingle();
  if (error) throw new Error("DATABASE_OPERATION_FAILED");
  return data;
}
