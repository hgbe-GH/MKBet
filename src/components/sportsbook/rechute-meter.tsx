import type { RechuteSnapshotUi } from "@/fixtures/sportsbook/types";

function formatDelta(delta: number) {
  if (delta > 0) {
    return `+${delta}`;
  }
  return String(delta);
}

export function RechuteMeter({ snapshot }: { snapshot: RechuteSnapshotUi }) {
  return (
    <section
      aria-labelledby="rechute-meter-title"
      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-[0.12em] text-[var(--brand)] uppercase">
            Rechutomètre
          </p>
          <h2
            className="mt-1 text-3xl font-black tracking-[-0.04em]"
            id="rechute-meter-title"
          >
            {snapshot.total}/100
          </h2>
        </div>
        <p className="rounded-full bg-red-50 px-3 py-1 text-sm font-black text-[var(--brand)]">
          {formatDelta(snapshot.delta)} pts
        </p>
      </div>
      <p className="mt-3 font-bold text-[var(--text-primary)]">
        {snapshot.label}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {snapshot.explanation}
      </p>
      <div className="mt-5 grid gap-3">
        {snapshot.segments.map((segment) => (
          <div key={segment.label}>
            <div className="mb-1 flex justify-between text-sm font-bold">
              <span>{segment.label}</span>
              <span>
                {segment.value}/100 · {formatDelta(segment.delta)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-100">
              <div
                aria-label={`${segment.label} ${segment.value} sur 100`}
                className="h-full rounded-full bg-[var(--brand)]"
                role="img"
                style={{ width: `${segment.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
