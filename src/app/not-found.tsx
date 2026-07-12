import { StatusPage } from "@/components/layout/status-page";

export default function NotFound() {
  return (
    <StatusPage
      actionHref="/"
      actionLabel="RETOUR À L’ACCUEIL"
      description="Cette cote a disparu du tableau. Revenez à la salle principale."
      eyebrow="Erreur 404"
      title="Marché introuvable"
    />
  );
}
