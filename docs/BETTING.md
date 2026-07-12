# Paris transactionnels MK Bet

## Sélection, devis et pari

Une sélection locale contient uniquement un identifiant d’issue. Le navigateur transmet ensuite à la Server Action la saison, une mise entière, une à trois issues et une clé d’idempotence. Il ne transmet jamais de cote, probabilité, version, gain, solde ou identifiant utilisateur.

`create_bet_quote` relit les marchés et leurs issues dans PostgreSQL. Le devis obtenu fige pendant **60 secondes** les probabilités, cotes et versions autoritaires. Il ne débite rien. Toute modification de mise ou de sélection invalide immédiatement le devis côté interface, tandis que son expiration reste contrôlée côté base.

`place_bet` verrouille le devis, le portefeuille, les marchés et les issues dans une seule transaction. Il compare les valeurs actuelles au devis, crée le ticket et ses jambes, débite les MKB, ajoute une transaction négative `BET_STAKE`, consomme le devis et écrit l’audit. La cote est figée dans `bet_legs` et ne sera jamais réécrite.

## Changement de cote et idempotence

Si le statut, l’horaire, la probabilité, la cote ou la version a changé, `place_bet` retourne `ODDS_CHANGED` sans ticket ni débit. L’utilisateur doit demander un nouveau devis et confirmer à nouveau ; aucun placement automatique n’est effectué.

Les devis sont uniques par `(user_id, idempotency_key)`. Les placements sont uniques par utilisateur et clé, et un devis ne peut alimenter qu’un pari. Les verrous PostgreSQL et les contraintes uniques protègent les doubles clics et répétitions réseau. Un réemploi incohérent d’une clé retourne `IDEMPOTENCY_CONFLICT`.

## Simples, combinés et rendement potentiel

Un pari simple reprend la cote courante de l’issue. Un combiné contient deux ou trois marchés distincts et exige une règle exacte dans `accumulator_correlation_rules`. PostgreSQL multiplie les probabilités équitables, applique le coefficient de corrélation, borne le résultat entre `0,001` et `0,95`, puis applique une seule fois la marge maximale des marchés. Aucune combinaison arbitraire n’est tarifée comme indépendante.

Le retour potentiel inclut la mise :

```text
potential_return_mkb = floor(stake_mkb × total_odds)
```

## Portefeuille et audit

Le portefeuille ne peut pas devenir négatif. `wallet_transactions` est immuable et chaque mise produit exactement une transaction négative avec le solde final. Les créations et changements de marché, devis, paris et débits sont audités sans session, token ou donnée privée inutile.

MK Bet utilise exclusivement la monnaie fictive MKB, sans argent réel ni conversion.

## Erreurs métier

Les RPC utilisent des codes stables tels que `INVALID_STAKE`, `INSUFFICIENT_BALANCE`, `MISSING_CORRELATION_RULE`, `QUOTE_EXPIRED`, `ODDS_CHANGED` et `IDEMPOTENCY_CONFLICT`. La couche applicative les transforme en messages français et ne rend jamais un message PostgreSQL brut.

## Limites actuelles

Le règlement, le crédit des gains, les remboursements, le cash-out, les corrections financières et le repricing après action ne sont pas encore développés. Les tickets créés restent donc généralement `OPEN`.
