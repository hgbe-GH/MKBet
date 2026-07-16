export function LoadingSkeleton({ label = "Chargement" }: { label?: string }) {
  return (
    <div aria-label={label} className="grid gap-3" role="status">
      <div className="h-36 rounded-2xl bg-white/[0.08]" />
      <div className="h-52 rounded-2xl bg-white/[0.06]" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
