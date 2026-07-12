# Architecture

## Application Next.js

MK Bet utilise Next.js avec l’App Router et TypeScript strict. Les lectures de données seront réalisées en priorité dans des Server Components. Les mutations passeront par des Server Actions ou des Route Handlers après validation des entrées avec Zod et contrôle des droits côté serveur.

Le runtime Node.js par défaut est conservé. Le runtime Edge ne sera ajouté qu’en réponse à un besoin mesuré et documenté.

## Séparation des responsabilités

- `src/domain` contient la logique métier pure : probabilités, cotes et règles de marché ;
- `src/application` orchestre le domaine et adapte les formes persistantes sans effectuer d’accès réseau ;
- `src/data` et `src/lib/supabase` contiendront l’accès à la persistance ;
- `src/components` contiendra l’interface générique et la mise en page ;
- `src/app` composera les routes et orchestrera les cas d’usage côté serveur ;
- `src/auth` contiendra les helpers de session et d’autorisation côté serveur ;
- `src/config` validera l’environnement à la frontière du système ;
- `src/fixtures/sportsbook` contient uniquement les données de démonstration utilisées par l’interface sportsbook tant que les repositories de marchés/lives réels ne sont pas branchés.

Les composants React ne seront jamais la seule source d’un calcul de cote ou d’une règle de règlement.

## Interface sportsbook

Le shell privé est mobile-first : sidebar desktop, header compact, bottom navigation mobile, ticket visuel et lien d’évitement. Les pages `/dashboard`, `/markets`, `/lives`, `/bets`, `/results`, `/timeline`, `/leaderboard` et `/admin` présentent les surfaces sportsbook sans créer de mutation persistante.

Les cotes affichées dans cette étape proviennent de fixtures marquées “Données de démonstration”. Elles ne remplacent pas `market_templates`, `market_outcomes` ou `odds_snapshots`, et aucun placement de pari n’est possible depuis l’interface.

## Supabase

Supabase fournira PostgreSQL, Auth, Realtime et Storage. PostgreSQL sera la source de vérité persistante. Les opérations sensibles de portefeuille et de règlement seront atomiques côté base, et les tables privées utiliseront Row Level Security.

Le schéma public est défini par des migrations forward-only et contient les domaines saisons, lives, actions, marchés, paris, portefeuilles, audit et Rechutomètre. Les contraintes relationnelles restent dans PostgreSQL. Les policies RLS métier utilisent `auth.uid()` et des helpers SQL dans le schéma `private`.

Supabase Auth est intégré avec `@supabase/ssr`, un client par requête, `proxy.ts` pour rafraîchir les cookies et `getClaims()` pour vérifier les JWT. La clé de service reste confinée aux modules serveur et n’est pas utilisée dans les parcours utilisateur ordinaires. Le build ne crée aucun client Supabase, n’exécute aucune migration et ne dépend d’aucune variable Supabase.

## Compatibilité Vercel

L’application ne dépend d’aucun disque local persistant, serveur permanent, timer, boucle résidente ou état important en mémoire. Les fichiers déployés sont du code et des assets statiques ; toutes les données applicatives persistantes seront externes dans Supabase.

Les URL publiques absolues utiliseront `NEXT_PUBLIC_SITE_URL`, configurée pour chaque environnement, et non une adresse localhost codée dans la logique métier.

## Stratégie Realtime prévue

Les changements utiles aux lives, marchés et chronologies seront publiés par PostgreSQL/Supabase Realtime. Les clients s’abonneront uniquement aux canaux nécessaires, autorisés par RLS. Une reconnexion déclenchera une relecture de l’état canonique côté serveur afin de ne pas traiter Realtime comme une source de vérité.

## Moteur de cotes

Le moteur est un noyau TypeScript pur et testable dans `src/domain/odds`. Il reçoit explicitement les dates UTC, modèles, signaux, marges, bornes, raisons et versions. Il couvre les marchés binaires, multi-options, périodes, dates exactes, prochaine action, over/under et les combinés corrélés.

`src/application/odds` fournit un dispatcher typé, les adaptateurs des types PostgreSQL et la construction de drafts de snapshots. Cette couche n’importe aucun client Supabase et n’effectue aucune lecture ou écriture. Les repositories persistants restent séparés dans `src/data/supabase`.

Pour l’ouverture initiale des marchés binaires, PostgreSQL duplique volontairement les quatre primitives mathématiques minimales nécessaires à l’autorité transactionnelle. Le moteur TypeScript reste la référence explicable et des tests croisés garantissent leur cohérence.

## Paris transactionnels

Le parcours suit `sélection locale → Server Action → create_bet_quote → confirmation → place_bet`. Les Server Actions valident uniquement des identifiants, une mise et une clé d’idempotence. Les RPC `SECURITY DEFINER` relisent les valeurs autoritaires, vérifient Auth/rôles/saison et réalisent les mutations dans une transaction PostgreSQL unique.

`src/data/supabase/markets`, `betting`, `wallets` et `leaderboard` assurent les lectures RLS. Les pages `/markets`, `/bets`, `/wallet`, `/leaderboard` et les surfaces financières du dashboard ne chargent plus de fixtures. Le compte à rebours du devis est seulement visuel ; PostgreSQL reste l’autorité sur l’expiration.

## Migrations et types

Les migrations sont appliquées explicitement avec Supabase CLI hors du runtime Next.js. `seed.sql` est idempotent. Les types `Database`, `Row`, `Insert` et `Update` sont générés depuis PostgreSQL local, tandis que `src/domain/database` expose seulement les formes métier utiles et découplées du SQL.
