export function LoadingSkeleton({ label = "Chargement" }: { label?: string }) {
  return (
    <div aria-label={label} className="grid gap-3" role="status">
      <div className="h-28 animate-pulse rounded-lg bg-stone-200" />
      <div className="h-28 animate-pulse rounded-lg bg-stone-200" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
