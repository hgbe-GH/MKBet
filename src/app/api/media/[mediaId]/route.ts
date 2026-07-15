import { NextResponse } from "next/server";
import { requireAuthForAction } from "@/auth/require-auth";
import { getSeasonMedia } from "@/data/supabase/media/repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ mediaId: string }> },
) {
  try {
    await requireAuthForAction();
    const media = await getSeasonMedia((await params).mediaId);
    if (!media) return new NextResponse(null, { status: 404 });
    const { data, error } = await (
      await createServerSupabaseClient()
    ).storage
      .from("season-media")
      .download(media.storage_path);
    if (error || !data) return new NextResponse(null, { status: 404 });
    return new NextResponse(await data.arrayBuffer(), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": media.media_type,
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
