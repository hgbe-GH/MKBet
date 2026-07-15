# État actuel

Dernière mise à jour : 15 juillet 2026.

## Réel

- Authentification Supabase SSR, profils, saisons, invitations et rôles RLS.
- Marchés binaires créés par un administrateur depuis les sept templates, avec cotes calculées côté PostgreSQL, issues, snapshots et audit.
- Suspension, réouverture et fermeture administratives des marchés.
- Lecture Supabase des marchés, issues, historique de cotes et règles de règlement.
- Devis de pari autoritaires valables 60 secondes, simples ou combinés de deux à trois jambes.
- Cinq règles exactes de corrélation persistées et cohérentes avec le moteur TypeScript.
- Placement atomique : ticket, jambes, cotes figées, débit MKB, transaction immuable, consommation du devis et audit.
- Protection contre double clic/répétition réseau par verrous et clés d’idempotence.
- Gestion de l’expiration et de `ODDS_CHANGED` sans placement automatique.
- Pages réelles `/markets`, `/markets/[marketId]`, `/bets`, `/wallet`, `/leaderboard`, surfaces financières du dashboard et `/admin/markets`.
- Création atomique des lives par `create_live_session` : saison, rôle, hôte, participants, planning, idempotence et audit sont validés par PostgreSQL.
- Pages réelles `/lives`, `/lives/[liveId]`, `/admin/lives` et `/admin/lives/new`, avec hôte `LIVE_HOST` imposé pour un créateur hôte et sélection administrateur contrôlée.
- Classement limité au nom/avatar et agrégats de portefeuille, sans transactions détaillées d’un autre joueur.

## Démonstration restante

- Actions et signaux.
- Résultats visuels.
- Chronologie détaillée.
- Rechutomètre lorsqu’aucun snapshot réel n’existe.

Ces surfaces affichent un badge ou un texte explicite. Aucune fixture de marché ou de pari n’est rendue dans les pages de production.

## Pas encore développé

- Règlement des marchés et corrections.
- Crédit des gains, remboursements et cash-out.
- Déclaration/confirmation des actions et repricing après action.
- Lancement, arrêt, check-in et transitions complètes des lives.
- Supabase Realtime et notifications push.
- Déploiement Vercel Preview ou Production.

## Base et migrations

La migration forward-only `20260712120000_transactional_betting.sql` ajoute l’enum `bet_quote_status`, les tables `accumulator_correlation_rules`, `bet_quotes`, `bet_quote_legs`, les contraintes de devis obligatoire, les primitives mathématiques privées, les RPC de marchés/devis/placement/classement et leurs policies RLS.

La migration forward-only `20260712130000_live_creation.sql` ajoute la demande d’idempotence privée des lives, resserre `private.is_live_host` sur `host_user_id` et expose `create_live_session`. Cette RPC écrit une session `SCHEDULED` ou `PROPOSED`, ses attendees et un audit en une seule transaction.

Les migrations historiques et le moteur TypeScript de cotes n’ont pas été modifiés. `src/types/database.ts` a été régénéré depuis PostgreSQL local.

## Validation locale

Le scénario SQL local crée un administrateur et un joueur, ouvre des marchés, vérifie les cotes, crée un devis simple, place un pari réel, répète le placement avec la même clé, vérifie l’unique débit, crée un combiné corrélé, provoque un changement de cote et confirme `ODDS_CHANGED` sans débit. Les verrous de devis/portefeuille/marchés et les contraintes uniques empêchent le double débit et le solde négatif.

Le scénario lives crée un admin, deux `LIVE_HOST`, un joueur et un reporter. Il vérifie la création programmée avec participants, l’audit unique après répétition, la création `INSTANT` autonome, ainsi que les refus pour hôte inéligible, participant inter-saison, joueur et tentative de modification du live d’un autre hôte.

## Dernières validations

- `pnpm format`, `pnpm lint` et `pnpm typecheck` : succès.
- `pnpm test` : 107 tests réussis dans 25 fichiers.
- `pnpm db:reset` : succès avec les dix migrations et le seed.
- Seconde exécution de `seed.sql` : décomptes inchangés, dont 5 corrélations.
- `supabase db lint` : aucune erreur ni aucun avertissement.
- `pnpm db:test:rls` : 7 blocs SQL RLS historiques réussis.
- `pnpm db:test:betting` : 11 blocs SQL transactionnels réussis, couvrant aussi un scénario d’intégration complet.
- `pnpm db:test:lives` : création, RLS, audit et idempotence des lives réussis.
- `pnpm odds:demo` : résultats déterministes inchangés.
- `pnpm build` : succès après arrêt de Supabase, sans variable Supabase ni accès base au build.
- `pnpm install --frozen-lockfile` : succès.
- Serveur de production local : `/` répond et `/api/health` retourne exactement `{"status":"ok","application":"mk-bet"}`.
- Scan de secrets : aucun secret suivi ; seule la variable vide attendue de `.env.example` correspond au motif.
- Migrations historiques et répertoires `src/domain/odds`, `src/application/odds` : aucun diff.

## Validation Chromium et audit visuel

- Playwright 1.61.1 avec Chrome for Testing 149.0.7827.55 (`chromium` v1228) installé dans le cache local ; lancement headless réel validé.
- Deux projets exécutables : `chromium-desktop` en 1440 × 1000 et `chromium-mobile` avec le profil Pixel 7.
- 43 tests E2E dans 12 fichiers, avec sessions SSR locales ADMIN, PLAYER, LIVE_HOST et lecteur de saison créées par Auth/Mailpit, saisons/invitations/marchés préparés via les RPC existantes et états Auth ignorés par Git.
- Pages inspectées sur desktop : accueil, login, dashboard, marchés, détail marché, ticket à deux sélections, mes paris, portefeuille, classement et administration.
- Pages inspectées sur mobile : login, dashboard, marchés, ticket fermé/ouvert, détail marché, mes paris, portefeuille et classement.
- Matrice responsive contrôlée : 360 × 800, 390 × 844, 768 × 1024, 1024 × 900 et 1440 × 1000, sans débordement horizontal majeur.
- Axe exécuté sur accueil, login, dashboard, marchés, détail marché, ticket ouvert et classement : aucune violation sérieuse ou critique restante.
- Cinq snapshots visuels stables : login desktop, dashboard desktop, marchés desktop/mobile et ticket mobile ouvert.
- Le dashboard et les écrans marchés/ticket de l’audit visuel utilisent une session PLAYER et une saison propres, distinctes des parcours transactionnels. Les cotes visibles de cette saison sont stabilisées par le harness E2E ; deux captures consécutives identiques ont été vérifiées avant régénération des références.
- Le parcours lives crée une session programmée avec un ADMIN, la relit avec un membre distinct, puis crée une session `INSTANT` avec un `LIVE_HOST`; il passe sur desktop et mobile.
- `pnpm test:e2e` : 43/43 parcours Chromium réussis.

Corrections réalisées : frontière React des icônes de navigation, enregistrement des Server Actions Auth, contraste du texte atténué, focus du lien d’évitement, classement horizontal focalisable, ticket mobile scrollable et refermable par `Escape`, cibles tactiles, grille des cotes binaires, graphique à snapshot unique, invalidation définitive d’un devis après modification, statut visible des tickets et confirmation redirigée après création admin, isolation des snapshots visuels et identifiants de marchés administratifs compatibles avec les répétitions Playwright.

Limites : les tests utilisent uniquement Supabase/Chromium locaux et ne valident aucun domaine Vercel distant. Les lives fonctionnels, règlements, paiements de gains, repricing automatique, Realtime et déploiements restent hors périmètre.
