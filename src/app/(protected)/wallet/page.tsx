import { requireSportsbookSeason } from "@/application/sportsbook/require-season";
import { EmptyState } from "@/components/states/empty-state";
import { getCurrentUserWallet } from "@/data/supabase/wallets/wallet-repository";

export const dynamic = "force-dynamic";

const transactionLabels = {
  INITIAL_CREDIT: "Capital initial",
  BET_STAKE: "Mise engagée",
  BET_WIN: "Gain de pari",
  BET_REFUND: "Mise remboursée",
  ADMIN_CREDIT: "Crédit administratif",
  ADMIN_DEBIT: "Débit administratif",
  SURVIVAL_BONUS: "Bonus de survie",
  CORRECTION: "Correction",
} as const;

export default async function WalletPage() {
  const season = await requireSportsbookSeason();
  const history = await getCurrentUserWallet(season.id);
  if (!history) {
    return (
      <EmptyState
        title="Portefeuille introuvable"
        description="Accepte une invitation joueur pour recevoir ton capital MKB."
      />
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-black tracking-[0.14em] text-[var(--brand)] uppercase">
          Portefeuille
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">
          Capital de dignité
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Monnaie fictive MKB, sans valeur financière ni conversion possible.
        </p>
      </header>
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Solde", history.wallet.balance_mkb],
          ["Capital initial", history.startingBalanceMkb],
          ["Total misé", history.wallet.total_staked_mkb],
          ["Total retourné", history.wallet.total_returned_mkb],
        ].map(([label, value]) => (
          <div
            className="rounded-lg border border-[var(--border)] bg-white p-4"
            key={label}
          >
            <dt className="text-sm font-bold text-[var(--text-muted)]">
              {label}
            </dt>
            <dd className="mt-1 text-2xl font-black">{value} MKB</dd>
          </div>
        ))}
      </dl>
      <section className="rounded-lg border border-[var(--border)] bg-white p-5">
        <h2 className="text-xl font-black">Journal immuable</h2>
        {history.transactions.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Aucune transaction enregistrée.
          </p>
        ) : (
          <ol className="mt-4 divide-y divide-[var(--border)]">
            {history.transactions.map((transaction) => (
              <li
                className="flex items-center justify-between gap-4 py-3"
                key={transaction.id}
              >
                <div>
                  <p className="font-bold">
                    {transactionLabels[transaction.transaction_type]}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(transaction.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={
                      transaction.amount_mkb < 0
                        ? "font-black text-[var(--negative)]"
                        : "font-black text-[var(--positive)]"
                    }
                  >
                    {transaction.amount_mkb > 0 ? "+" : ""}
                    {transaction.amount_mkb} MKB
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Solde {transaction.balance_after_mkb}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
