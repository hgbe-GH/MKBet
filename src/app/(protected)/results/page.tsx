import { ResultCard } from "@/components/sportsbook/result-card";
import { listDemoResults } from "@/fixtures/sportsbook/repositories";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const results = await listDemoResults();

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-black tracking-[0.14em] text-[var(--brand)] uppercase">
          Résultats
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">
          Vérifications et décisions
        </h1>
      </header>
      <section className="rounded-lg border border-[var(--border)] bg-white p-5">
        <h2 className="text-xl font-black">À vérifier</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Les boutons admin de règlement seront ajoutés avec les transactions
          PostgreSQL. Aucun résultat n’est modifiable ici.
        </p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {results.map((result) => (
          <ResultCard key={result.id} result={result} />
        ))}
      </div>
    </div>
  );
}
