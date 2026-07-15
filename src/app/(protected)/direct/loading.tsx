export default function DirectLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Chargement du direct"
      className="mx-auto max-w-3xl space-y-5"
    >
      <div className="h-56 animate-pulse rounded-xl bg-[var(--surface-muted)] motion-reduce:animate-none" />
      <div className="h-12 animate-pulse rounded-lg bg-[var(--surface-muted)] motion-reduce:animate-none" />
      <div className="h-80 animate-pulse rounded-xl bg-[var(--surface-muted)] motion-reduce:animate-none" />
    </div>
  );
}
