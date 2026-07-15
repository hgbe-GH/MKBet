import { notFound } from "next/navigation";
import Image from "next/image";
import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { MediaModerationControls } from "@/components/media/media-moderation-controls";
import { MediaUploadForm } from "@/components/media/media-upload-form";
import { listSeasonMedia } from "@/data/supabase/media/repository";
export const dynamic = "force-dynamic";
export default async function AdminMediaPage() {
  const season = await requireSportsbookSeason();
  if (!season.roles.includes("ADMIN")) notFound();
  const media = await listSeasonMedia(season.id);
  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-black tracking-[0.14em] text-[var(--brand)] uppercase">
          Administration
        </p>
        <h1 className="mt-1 text-3xl font-black">Médias privés</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Les images restent invisibles aux membres jusqu’à validation.
        </p>
      </header>
      <MediaUploadForm seasonId={season.id} />
      <section className="grid gap-3">
        {media.map((item) => (
          <article
            className="rounded-lg border border-[var(--border)] bg-white p-4"
            key={item.id}
          >
            <Image
              alt={item.caption ?? "Média de saison"}
              className="h-32 w-24 rounded object-cover"
              height={128}
              src={`/api/media/${item.id}`}
              unoptimized
              width={96}
            />
            <p className="mt-2 font-black">{item.caption ?? "Sans légende"}</p>
            <p className="text-sm text-[var(--text-secondary)]">
              {item.status}
            </p>
            <MediaModerationControls mediaId={item.id} status={item.status} />
          </article>
        ))}
      </section>
    </div>
  );
}
