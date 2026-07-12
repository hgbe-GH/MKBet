import { updateAccount } from "@/application/auth/actions";
import { getCurrentUser } from "@/auth/get-current-user";
import { AccountForm } from "@/components/account/account-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  const displayName =
    typeof user?.user_metadata.display_name === "string"
      ? user.user_metadata.display_name
      : "Nouveau joueur";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-black tracking-[0.14em] text-red-800 uppercase">
          Compte
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.035em]">
          Paramètres du compte
        </h1>
      </div>
      <section className="space-y-6 rounded-md border border-stone-200 bg-white p-6">
        <p className="text-sm text-stone-600">
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
