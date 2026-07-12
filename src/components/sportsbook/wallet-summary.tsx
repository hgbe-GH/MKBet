export function WalletSummary({ balanceMkb }: { balanceMkb: number }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-xs font-black tracking-[0.12em] text-[var(--brand)] uppercase">
        Capital MKB
      </p>
      <p className="mt-2 text-3xl font-black tabular-nums">{balanceMkb} MKB</p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Solde fictif, sans valeur financière ni conversion possible.
      </p>
    </section>
  );
}
