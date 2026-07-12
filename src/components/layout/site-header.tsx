export function SiteHeader() {
  return (
    <header className="border-b border-red-950 bg-red-950 text-white">
      <div className="mx-auto flex min-h-18 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <a
          className="rounded-sm text-xl font-black tracking-[-0.04em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-red-950"
          href="#main-content"
          aria-label="MK Bet — aller au contenu principal"
        >
          MK <span className="text-red-300">BET</span>
        </a>
        <span className="text-[0.65rem] font-bold tracking-[0.2em] text-red-200 uppercase">
          Cercle privé
        </span>
      </div>
    </header>
  );
}
