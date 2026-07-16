import { StatusPage } from "@/components/layout/status-page";

export default function AuthErrorPage() {
  return (
    <StatusPage
      actionHref="/login"
      actionLabel="Revenir à la connexion"
      description="La demande d’authentification n’a pas pu être validée. Recommence depuis la connexion."
      eyebrow="Connexion"
      title="Accès refusé"
    />
  );
}
