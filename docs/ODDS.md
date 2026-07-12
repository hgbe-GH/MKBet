# Moteur de probabilités et de cotes

## Rôle et limites

Le moteur de MK Bet est un noyau fonctionnel pur : il ne lit ni l’heure système, ni l’environnement, ni Supabase. Toutes les dates, versions et raisons de calcul sont fournies explicitement. Ses résultats sont déterministes et sérialisables afin de pouvoir être conservés plus tard dans `odds_snapshots.input_snapshot`.

Il s’agit d’un jeu privé. Les valeurs sont configurables et ne constituent ni une prédiction scientifique, ni une analyse objective des personnes concernées.

## Modèle temporel

Pour un événement, `q` est le plafond probabiliste de la phase et `halfLifeDays` sa vitesse caractéristique. La probabilité cumulative après `t` jours vaut :

```text
F(t) = q × (1 - 2^(-t / halfLifeDays))
```

Ainsi, à une demi-vie, `F(halfLifeDays) = q / 2`. Les calculs utilisent des jours décimaux UTC : douze heures valent `0,5` jour. Les nombres JavaScript suivent IEEE-754 ; le moteur évite les arrondis intermédiaires et arrondit uniquement la cote affichée à deux décimales.

Lorsque rien ne s’est encore produit au jour `c`, la probabilité restante avant `d` est :

```text
(F(d) - F(c)) / (1 - F(c))
```

Une période utilise la différence de cumulatives, conditionnée à `asOf`. Les périodes doivent être ordonnées et disjointes. Une issue explicite « après cette période ou jamais » reçoit la masse résiduelle afin que la distribution totalise un.

Une date exacte est définie par deux instants absolus couvrant exactement vingt-quatre heures à partir de minuit UTC. La tolérance de règlement est indépendante du pricing initial : coefficient `1` le jour exact, `0,60` à un jour, `0,30` à deux jours et `0` au-delà.

## Modificateurs et contexte

Les `Q_SHIFT` actifs s’additionnent au plafond. Les `SPEED_MULTIPLIER` actifs se multiplient et divisent la demi-vie. Ils sont appliqués par priorité croissante puis identifiant stable, avec bornage final du modèle.

Le contexte live sépare les familles :

- `PHYSICAL` utilise uniquement le multiplicateur physique ;
- `SENTIMENTAL` utilise uniquement le multiplicateur sentimental ;
- `MIXED` utilise leur moyenne géométrique.

Une accélération physique ne rend donc jamais automatiquement le retour officiel en couple aussi rapide.

## Pricing des marchés

Pour une probabilité équitable `p` et une marge `m`, la cote brute vaut `1 / (p × m)`. La marge par défaut est `1,08`; la cote affichée est ensuite bornée entre `1,05` et `50,00`, puis arrondie. Le résultat conserve séparément la probabilité équitable, la cote brute, la cote affichée et sa probabilité implicite. Le bornage peut modifier légèrement l’overround final.

Les marchés multi-options normalisent des poids finis et positifs vers une somme de un. Une somme nulle ou des codes dupliqués sont refusés. Le marché « prochaine action » utilise ce mécanisme avec disponibilités, dépendances explicites et une issue `NONE` obligatoire.

Les over/under utilisent une approximation de Poisson à partir de `lambda`. Le MVP accepte uniquement les lignes en demi-point; une ligne entière est refusée avec `INTEGER_LINE_UNSUPPORTED`, car aucune logique `PUSH` ou remboursement n’est encore introduite.

Les combinés acceptent deux ou trois jambes. Les probabilités indépendantes sont multipliées, puis une règle explicite applique un coefficient de corrélation (`1` indépendant, supérieur à `1` plus probable, inférieur à `1` moins probable). La probabilité finale est bornée entre `0,001` et `0,95`, et la marge n’est appliquée qu’une fois. Une dépendance forte sans règle est refusée.

## Version, snapshots et paris existants

Le calcul reçoit `calculatedAt`, `asOf`, la raison et `nextOddsVersion` explicitement. Le futur service persistant fournira exactement `currentVersion + 1`. L’explication contient modèle initial et effectif, modificateurs, bornages, normalisations, probabilités et cotes.

`market_outcomes` représentera la cote courante. Les `bet_legs.odds_at_bet`, probabilités et versions déjà figées ne seront jamais réécrites lors d’un repricing.

## Exemples vérifiés

Cette section est produite par les mêmes fonctions que `pnpm odds:demo`; un test échoue si elle diverge.

<!-- odds-demo:start -->
<!-- prettier-ignore -->
| Événement | P(J+7) | Oui / Non J+7 | P(J+30) | Oui / Non J+30 | P(J+90) | Oui / Non J+90 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| KISS | 25.77 % | 3.59 / 1.25 | 68.07 % | 1.36 / 2.90 | 86.98 % | 1.06 / 7.11 |
| SLEEP_SAME_BED | 19.85 % | 4.67 / 1.16 | 57.54 % | 1.61 / 2.18 | 81.38 % | 1.14 / 4.97 |
| SEX | 16.09 % | 5.75 / 1.10 | 49.02 % | 1.89 / 1.82 | 74.00 % | 1.25 / 3.56 |
| BLOWJOB | 8.96 % | 10.33 / 1.05 | 30.00 % | 3.09 / 1.32 | 52.50 % | 1.76 / 1.95 |
| CUNNILINGUS | 8.96 % | 10.33 / 1.05 | 30.00 % | 3.09 / 1.32 | 52.50 % | 1.76 / 1.95 |
| SEX_FRIENDS | 7.08 % | 13.07 / 1.05 | 25.13 % | 3.68 / 1.24 | 48.97 % | 1.89 / 1.81 |
| OFFICIAL_COUPLE | 3.13 % | 29.56 / 1.05 | 12.11 % | 7.65 / 1.05 | 28.24 % | 3.28 / 1.29 |

Combiné « Bisou + nuit ensemble + rapport avant J+30 » : produit naïf des cotes **4.14**, cote corrélée **3.33** avec le coefficient **1.45**.
<!-- odds-demo:end -->

Les valeurs persistantes de production viendront plus tard de `market_templates` et `market_action_rules`. Les fixtures actuelles ne servent qu’aux tests et à la démonstration locale.
