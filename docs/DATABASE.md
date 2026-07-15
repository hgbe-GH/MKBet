# Base de données MK Bet

## Principes

PostgreSQL/Supabase est la source de vérité de MK Bet. Le schéma public contient 28 tables privées, protégées par Row Level Security métier. Les identifiants métier utilisent des UUID produits par `gen_random_uuid()`, les horaires sont des `timestamptz`, les montants MKB sont des entiers et les probabilités/cotes utilisent `numeric`.

Les migrations sont forward-only et ne sont jamais exécutées par Next.js, Vercel ou une requête utilisateur. `supabase/seed.sql` ne contient que des données de référence réexécutables.

## Entités et responsabilités

- `profiles`, `seasons`, `season_members`, `season_invitations` décrivent les identités, saisons privées, rôles cumulables et invitations hachées.
- `live_sessions` et `live_attendees` décrivent les événements programmés ou instantanés et leur présence.
- `action_types`, `action_type_confirmation_rules`, `actions`, `action_reports`, `action_confirmations` et `media_assets` portent les faits déclarés, preuves, décisions et références vers Supabase Storage.
- `market_templates`, `markets`, `market_outcomes`, `odds_snapshots` et `market_action_rules` portent les marchés et l’historique explicable des cotes.
- `accumulator_correlation_rules`, `bet_quotes` et `bet_quote_legs` portent les corrélations et devis courts.
- `wallets`, `bets`, `bet_legs`, `settlements` et `wallet_transactions` portent les mises fictives et leur règlement futur.
- `notifications`, `audit_logs` et `rechute_snapshots` portent les projections utilisateur, la traçabilité et le Rechutomètre.

Les clés étrangères composites empêchent qu’un live, une action, un média ou une issue soit associé à une saison ou un marché incompatible. Des triggers ciblés complètent les règles qui traversent plusieurs tables.

## Relations simplifiées

```mermaid
erDiagram
  PROFILES ||--o{ SEASON_MEMBERS : participates
  SEASONS ||--o{ SEASON_MEMBERS : contains
  SEASONS ||--o{ SEASON_INVITATIONS : offers
  SEASONS ||--o{ LIVE_SESSIONS : schedules
  LIVE_SESSIONS ||--o{ LIVE_ATTENDEES : records
  SEASONS ||--o{ ACTIONS : observes
  LIVE_SESSIONS o|--o{ ACTIONS : contextualizes
  ACTION_TYPES ||--o{ ACTIONS : classifies
  ACTION_TYPES ||--o{ ACTION_TYPE_CONFIRMATION_RULES : accepts
  ACTIONS ||--o{ ACTION_REPORTS : receives
  ACTIONS ||--o{ ACTION_CONFIRMATIONS : resolves
  ACTIONS ||--o{ MEDIA_ASSETS : references
  SEASONS ||--o{ MARKETS : publishes
  LIVE_SESSIONS o|--o{ MARKETS : specializes
  MARKET_TEMPLATES o|--o{ MARKETS : instantiates
  MARKETS ||--o{ MARKET_OUTCOMES : offers
  MARKET_OUTCOMES ||--o{ ODDS_SNAPSHOTS : prices
  SEASONS ||--o{ BET_QUOTES : offers
  BET_QUOTES ||--|{ BET_QUOTE_LEGS : freezes
  MARKET_OUTCOMES ||--o{ BET_QUOTE_LEGS : quotes
  PROFILES ||--o{ WALLETS : owns
  SEASONS ||--o{ WALLETS : funds
  WALLETS ||--o{ BETS : backs
  BET_QUOTES ||--o| BETS : becomes
  BETS ||--|{ BET_LEGS : contains
  MARKET_OUTCOMES ||--o{ BET_LEGS : freezes
  MARKETS ||--o{ SETTLEMENTS : resolves
  SETTLEMENTS o|--o{ WALLET_TRANSACTIONS : explains
  ACTIONS o|--o{ RECHUTE_SNAPSHOTS : influences
```

## Cycles métier

### Saison

Une saison commence en `DRAFT`, devient `ACTIVE`, peut être `PAUSED`, puis se termine en `COMPLETED` ou `ARCHIVED`. Les membres peuvent cumuler plusieurs rôles. Un rôle `SUBJECT` exige exactement une `subject_key`, et une saison ne peut avoir qu’un sujet actif par clé.

### Live

Un live passe de la proposition/planification à l’ouverture des paris, puis aux états armé et live. Il peut être suspendu, terminé, vérifié, réglé, archivé ou annulé. Les heures planifiées restent distinctes des heures réelles.

`create_live_session` est l’unique point de création applicatif : la RPC vérifie l’utilisateur, la saison, les rôles et le planning, puis insère le live, l’attendee `HOST`, les `REPORTER`/`VIEWER`, la demande idempotente privée et l’audit dans une transaction. Les types `PROGRAMMED` et `TIME_WINDOW` commencent `SCHEDULED`; `INSTANT` commence `PROPOSED`. Un planning `INSTANT` est seulement indicatif et reste une paire début/fin complète lorsqu’il est présent.

### Action, déclaration et confirmation

Une **action** est le fait consolidé. `occurred_at` représente l’heure annoncée du fait, `declared_at` l’heure de saisie et `official_occurred_at` l’heure finalement retenue.

Un **report** est le témoignage distinct d’un reporter. Une **confirmation** est la décision d’un membre ou sujet autorisé. `action_types.confirmation_policy` définit la voie principale et `action_type_confirmation_rules` ses alternatives. Une correction crée une nouvelle action liée par `supersedes_action_id`.

### Marché et cote

Un template initialise un marché, ses paramètres de probabilité et sa règle de règlement. Un marché ouvre, peut être suspendu, ferme, reçoit un résultat, puis est réglé, annulé ou remboursé.

`market_outcomes.displayed_odds` est la cote courante. Chaque recalcul crée un `odds_snapshot`. Lors d’un pari, `bet_legs.odds_at_bet`, `fair_probability_at_bet` et `odds_version_at_bet` figent la proposition acceptée : un recalcul futur ne modifie jamais un ticket existant.

Le moteur TypeScript construit désormais des drafts compatibles avec ces deux tables, mais ne les insère pas. Les identifiants, l’instant de calcul et la prochaine version sont fournis explicitement. La future couche de persistance sera responsable de l’écriture atomique et de la concurrence optimiste ; Vercel n’exécute jamais de migration au démarrage.

### Pari, portefeuille et règlement

Un ticket simple possède une jambe; un combiné en possède deux ou trois. `create_bet_quote` fige une proposition pendant 60 secondes. `place_bet` verrouille le devis, le portefeuille, les marchés et les issues, puis crée atomiquement le ticket, ses jambes, le débit et l’audit. `bets.quote_id` est obligatoire et unique : aucun pari ne peut exister sans devis.

Un règlement produit une nouvelle ligne `settlements`. Une correction utilise `settlement_type = 'CORRECTION'` et référence le règlement précédent avec `supersedes_settlement_id`; l’historique n’est jamais écrasé.

`wallet_transactions` est un journal immuable : aucun `UPDATE` ni `DELETE` n’est accepté. Chaque correction est une nouvelle transaction idempotente. `audit_logs` suit la même stratégie append-only pour les opérations importantes.

Le journal financier interdit toujours `UPDATE` et `DELETE`. Une mise ajoute une transaction `BET_STAKE` négative dont `balance_after_mkb` correspond exactement au portefeuille verrouillé.

## RLS et sécurité

La RLS utilise `auth.uid()`, les membres actifs, leurs rôles, la confidentialité des actions et la saison concernée. Les helpers `private.*` évitent les récursions de policies. Les fonctions transactionnelles sensibles valident le rôle serveur et ne font pas confiance aux montants, cotes ou identifiants transmis par le client.

La fonction `write_audit_log` est interne, `SECURITY DEFINER`, avec un `search_path` vide et sans droit d’exécution pour `public`, `anon` ou `authenticated`.

`private.live_creation_requests` conserve l’unicité `(user_id, idempotency_key)` des créations de lives. `private.is_live_host` compare désormais l’utilisateur à `live_sessions.host_user_id`; les privilèges d’administration restent contrôlés séparément par les policies et la RPC.

Les invitations de saison sont acceptées par RPC. Le token clair n’est pas stocké; seul un hash SHA-256 est conservé. La vue `member_action_feed` masque `private_note` et sert de surface de lecture pour les membres ordinaires.

## Développement et migrations

```bash
pnpm db:start
pnpm db:reset
pnpm db:types
pnpm db:stop
```

`db:reset` repart de zéro, applique toutes les migrations versionnées et exécute le seed. Les types de `src/types/database.ts` sont générés depuis la base locale et devront être régénérés après chaque évolution du schéma.

Pour Production, appliquer d’abord les migrations sur une base Supabase Preview ou staging, exécuter les contrôles fonctionnels, puis appliquer les mêmes fichiers versionnés à Production avant de promouvoir une version applicative qui en dépend. Un rollback applicatif Vercel n’annule jamais une migration PostgreSQL.
