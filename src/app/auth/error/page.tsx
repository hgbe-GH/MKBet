import { StatusPage } from "@/components/layout/status-page";

export default function AuthErrorPage() {
  return (
    <StatusPage
      actionHref="/login"
      actionLabel="Recevoir un nouveau lien"
      description="Le lien d'accès n'a pas pu être validé. Aucun jeton n'a été conservé."
      eyebrow="Connexion"
      title="Accès refusé"
    />
  );
}
