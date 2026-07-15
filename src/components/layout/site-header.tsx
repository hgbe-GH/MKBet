export function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-black/20 text-white backdrop-blur-xl">
      <div className="mx-auto flex min-h-18 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <a
          className="inline-flex min-h-11 items-center rounded-sm text-xl font-black tracking-[-0.07em]"
          href="#main-content"
          aria-label="MK Bet, aller au contenu principal"
        >
          MK<span className="text-[var(--brand)]">BET</span>
        </a>
        <span className="text-[0.65rem] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
          Margot × Kévin
        </span>
      </div>
    </header>
  );
}
