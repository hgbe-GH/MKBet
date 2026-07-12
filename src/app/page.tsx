import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-100">
      <SiteHeader />
      <main
        className="relative isolate flex flex-1 items-center overflow-hidden px-5 py-12 sm:px-8 sm:py-16"
        id="main-content"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(120,113,108,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,113,108,0.08)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]"
        />
        <section className="mk-enter mx-auto w-full max-w-3xl overflow-hidden bg-white shadow-[0_28px_80px_rgba(41,37,36,0.12)]">
          <div className="h-1.5 bg-red-900" />
          <div className="p-7 sm:p-12 lg:p-14">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-[0.68rem] font-black tracking-[0.15em] text-red-900 uppercase">
                <span
                  aria-hidden="true"
                  className="mk-status-dot h-2 w-2 rounded-full bg-red-700"
                />
                PRÉ-SAISON
              </span>
              <span className="text-[0.68rem] font-bold tracking-[0.16em] text-stone-500 uppercase">
                Margot × Kévin
              </span>
            </div>

            <div className="py-9 sm:py-12">
              <p className="mb-3 text-sm font-bold tracking-[0.14em] text-red-800 uppercase">
                Saison post-rupture
              </p>
              <h1 className="max-w-2xl text-4xl leading-[0.98] font-black tracking-[-0.055em] text-stone-950 sm:text-6xl">
                La salle des marchés de la rechute
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-stone-600">
                Les marchés ouvriront prochainement.
              </p>
            </div>

            <div className="flex flex-col gap-5 border-t border-stone-200 pt-7 sm:flex-row sm:items-center sm:justify-between">
              <Button disabled type="button">
                CONSULTER LES COTES
              </Button>
              <p className="flex items-center gap-2 text-xs font-bold tracking-[0.08em] text-stone-500 uppercase">
                <span aria-hidden="true">●</span>
                100 % monnaie fictive
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
