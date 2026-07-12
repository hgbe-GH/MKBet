import { createSeasonAction } from "@/application/seasons/actions";
import { NewSeasonForm } from "@/components/seasons/new-season-form";

export const dynamic = "force-dynamic";

export default function NewSeasonPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-black tracking-[0.14em] text-red-800 uppercase">
          Nouvelle saison
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.035em]">
          Ouvrir un championnat
        </h1>
      </div>
      <section className="rounded-md border border-stone-200 bg-white p-6">
        <NewSeasonForm action={createSeasonAction} />
      </section>
    </div>
  );
}
