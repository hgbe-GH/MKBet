import { updateAccount } from "@/application/auth/actions";
import { getCurrentUser } from "@/auth/get-current-user";
import { AccountForm } from "@/components/account/account-form";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/ui/page-intro";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  const displayName =
    typeof user?.user_metadata.display_name === "string"
      ? user.user_metadata.display_name
      : "Nouveau joueur";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageIntro eyebrow="Compte" title="Ton profil" />
      <section className="mk-surface-opaque space-y-6 rounded-2xl p-6">
        <p className="text-sm text-[var(--text-secondary)]">
          Email :{" "}
          <span className="font-bold">{user?.email ?? "non disponible"}</span>
        </p>
        <AccountForm
          action={updateAccount}
          avatarUrl={null}
          displayName={displayName}
        />
        <form action="/logout" method="post">
          <Button type="submit" variant="outline">
            Déconnexion
          </Button>
        </form>
      </section>
    </div>
  );
}
