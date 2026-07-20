export default function DirectLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Chargement du direct"
      className="mx-auto max-w-3xl space-y-5"
    >
      <div className="h-56 rounded-xl bg-white/[0.08]" />
      <div className="h-12 rounded-lg bg-white/[0.06]" />
      <div className="h-80 rounded-xl bg-white/[0.08]" />
    </div>
  );
}
