# Sécurité

## Auth SSR

MK Bet utilise Supabase Auth avec `@supabase/ssr`. Un client Supabase est créé par requête côté serveur; aucun singleton global ne porte une session utilisateur.

Le proxy Next.js 16 rafraîchit les cookies Supabase et appelle `auth.getClaims()`. `getClaims()` valide le JWT et sert aux contrôles rapides. `getUser()` est réservé aux cas où les données utilisateur à jour sont nécessaires. `getSession()` ne doit pas servir à autoriser une route.

Les pages privées utilisent aussi `requireAuth()` dans leur layout ou dans les actions serveur. Le proxy n'est donc pas la seule barrière d'autorisation.

## Variables et secrets

Variables publiques principales :

- `NEXT_PUBLIC_SITE_URL`;
- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

`NEXT_PUBLIC_SUPABASE_ANON_KEY` reste accepté temporairement pour le développement local, mais n'est plus la source principale. `SUPABASE_SERVICE_ROLE_KEY` est strictement serveur-only et n'est pas utilisée dans les parcours utilisateur ordinaires.

## Rôles cumulables

Une ligne `season_members` représente un rôle dans une saison. Un utilisateur peut cumuler `ADMIN`, `LIVE_HOST`, `REPORTER`, `PLAYER` et `SUBJECT`. Le rôle `SUBJECT` exige une clé `MARGOT` ou `KEVIN`; les fonctions SQL empêchent un même utilisateur d'être simultanément les deux sujets actifs dans une saison.

| Ressource     | PLAYER                      | REPORTER             | LIVE_HOST             | SUBJECT                        | ADMIN                                  |
| ------------- | --------------------------- | -------------------- | --------------------- | ------------------------------ | -------------------------------------- |
| Saisons       | Lecture                     | Lecture              | Lecture               | Lecture                        | Lecture/édition                        |
| Invitations   | Acceptation                 | Acceptation          | Acceptation           | Acceptation                    | Création/révocation/liste sûre         |
| Lives         | Lecture                     | Lecture              | Création/édition hôte | Lecture                        | Création/édition                       |
| Actions       | Vue membre sans note privée | Déclaration          | Déclaration           | Déclaration/confirmation sujet | Lecture complète/administration future |
| Portefeuilles | Lecture du sien             | Lecture du sien      | Lecture du sien       | Lecture du sien                | Lecture saison                         |
| Audit         | Aucun accès                 | Aucun accès          | Aucun accès           | Aucun accès                    | Lecture saison                         |
| Storage       | Lecture membre              | Upload propre chemin | Upload propre chemin  | Upload propre chemin           | Lecture/administration                 |

## Fonctions SQL privées

Le schéma `private` n'est pas exposé directement à l'API. Ses helpers `is_season_member`, `has_season_role`, `is_season_subject`, `shares_active_season`, `is_live_host` et `owns_bet` centralisent les vérifications RLS. Les fonctions sensibles utilisent `SECURITY DEFINER`, `search_path = ''`, des noms qualifiés et `auth.uid()`.

## Invitations

Les invitations stockent uniquement `token_hash` en SHA-256. Le token clair est généré aléatoirement et retourné une seule fois par `create_season_invitation`. Les RPC de preview et d'acceptation ne retournent jamais le hash ni les emails complets d'autres personnes.

## RLS

Les 25 tables privées restent sous RLS. Les politiques métier remplacent le deny-by-default temporaire. Les mutations financières, les paris, les règlements, les snapshots de cotes et l'audit n'ont pas d'écriture directe côté client.

`member_action_feed` est la vue prévue pour le futur fil membre. Elle ne contient pas `private_note` et repose sur `security_invoker = true`.

## Limites restantes

Le placement des paris, le règlement financier, les transitions de lives, les uploads média dans l'interface et le realtime ne sont pas encore implémentés. Les policies préparent ces usages mais les mutations sensibles futures devront rester atomiques côté PostgreSQL.
