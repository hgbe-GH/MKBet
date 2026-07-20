export default function Loading() {
  return (
    <main
      aria-live="polite"
      className="grid min-h-dvh place-items-center bg-[var(--background)] px-5 text-white"
    >
      <div className="w-full max-w-xs text-center" role="status">
        <span
          aria-hidden="true"
          className="mx-auto block h-2 w-12 rounded-full bg-[var(--brand)] shadow-[0_0_18px_rgba(255,52,83,0.3)]"
        />
        <p className="mt-5 text-sm font-bold tracking-[0.12em] text-[var(--text-secondary)]">
          OUVERTURE DE LA SALLE…
        </p>
        <div aria-hidden="true" className="mt-6 grid gap-2">
          <span className="h-10 rounded-lg bg-white/[0.08]" />
          <span className="h-16 rounded-xl bg-white/[0.05]" />
        </div>
      </div>
    </main>
  );
}
