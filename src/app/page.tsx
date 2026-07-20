import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col text-white">
      <SiteHeader />
      <main
        className="relative isolate flex flex-1 items-center overflow-hidden px-5 py-12 sm:px-8"
        data-public-aurora
        id="main-content"
      >
        <div
          aria-hidden="true"
          className="absolute top-[12%] right-[-8rem] -z-10 h-80 w-80 rounded-full bg-[var(--brand)]/25 blur-3xl"
        />
        <section className="mk-enter mx-auto grid w-full max-w-6xl gap-12 py-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div>
            <p className="mk-eyebrow">Salle privée · 7 membres</p>
            <p className="mt-5 text-sm font-black tracking-[0.12em] text-[var(--text-secondary)] uppercase">
              Margot × Kévin
            </p>
            <h1 className="mt-4 max-w-4xl text-5xl leading-[0.9] font-black tracking-[-0.07em] text-balance sm:text-7xl lg:text-[6.5rem]">
              Tout se joue{" "}
              <span className="text-[var(--brand)]">entre nous.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--text-secondary)]">
              Une preuve, deux votes, une décision. Suis l’histoire de Margot et
              Kévin en MKB fictifs.
            </p>
          </div>
          <div className="mk-glass-subtle rounded-2xl p-5 sm:p-6">
            <p className="text-xs font-black tracking-[0.12em] text-[var(--brand-hover)] uppercase">
              Le marché est ouvert
            </p>
            <p className="mt-3 text-2xl font-black tracking-[-0.04em]">
              Entre dans la salle.
            </p>
            <Link
              className="mk-primary-action mt-6 w-full"
              href="/login?next=/direct"
            >
              Entrer dans la salle
            </Link>
            <p className="mt-4 text-xs font-bold tracking-[0.08em] text-[var(--text-muted)] uppercase">
              100 % monnaie fictive
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
