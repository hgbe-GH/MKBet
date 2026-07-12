export function NotConfiguredState() {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-6">
      <h2 className="text-xl font-black">Configuration privée indisponible</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        Les pages privées nécessitent une configuration Supabase locale. La page
        publique et la route de santé restent disponibles sans secret.
      </p>
    </section>
  );
}
