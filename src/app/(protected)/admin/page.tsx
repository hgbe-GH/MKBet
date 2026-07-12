import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const sections = [
  "Saison",
  "Membres",
  "Invitations",
  "Marchés",
  "Lives",
  "Actions à vérifier",
  "Résultats",
  "Audit",
];

export default function AdminPage() {
  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-black tracking-[0.14em] text-[var(--brand)] uppercase">
          Administration
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">
          Console visuelle
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Les contrôles métier restent protégés par RLS/RPC. Cette étape ne crée
          aucune mutation admin de marchés, lives ou résultats.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <article
            className="rounded-lg border border-[var(--border)] bg-white p-5"
            key={section}
          >
            <h2 className="text-xl font-black">{section}</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Bientôt disponible.
            </p>
            <Button className="mt-4" disabled type="button">
              ACTION DÉSACTIVÉE
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
