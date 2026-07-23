# État actuel

Dernière mise à jour : 23 juillet 2026.

## Produit réel

- Les contrats et Server Actions Auth couvrent désormais connexion, inscription, demande de réinitialisation et changement de mot de passe avec normalisation Zod, redirections internes, initialisation idempotente de la salle et erreurs françaises génériques.
- Une inscription qui crée immédiatement une session initialise le profil et l’accès à la salle avant de rediriger vers la destination interne sûre ; une réponse sans session ou en erreur ferme la session locale et reste générique, sans afficher d’étape de confirmation dans le formulaire.
- L’adresse e-mail sert d’identifiant. Le portail public `/login` réunit connexion et création de compte par mot de passe de 10 à 128 caractères dans un shell responsive ; l’inscription ouvre un accès immédiat lorsque Supabase retourne une session, et aucun magic link de connexion n’est proposé dans l’interface.
- Le parcours de récupération `/forgot-password` → callback Auth → `/auth/update-password` vérifie l’AMR `recovery` côté serveur. Après modification, il contrôle la fermeture locale de la session puis redirige vers la confirmation publique sûre `/login?notice=password-updated` ; un cleanup retourné en erreur ou levé reste générique et n’annonce jamais de succès.
- La finition B3 nocturne centralise les durées de mouvement, limite les translations de survol aux pointeurs fins et neutralise les animations avec réduction de mouvement. Le verre interactif reste transparent et flouté sur les petites surfaces compatibles ; les fallbacks, la réduction de transparence et les grands panneaux de lecture utilisent des surfaces graphite opaques.
- Le shell privé utilise désormais les slots Astryx 0.1.7 (`AppShell`, `TopNav`, `SideNav` et `MobileNav`) avec cinq destinations principales partagées entre desktop et mobile. L’administration reste dans une zone secondaire visible uniquement pour `ADMIN` et `LIVE_HOST`, tandis que le compte, les rôles, la saison et la déconnexion sont regroupés dans le menu de compte.
- Les en-têtes des pages privées et leurs états asynchrones partagés composent désormais les primitives Astryx (`Heading`, `Text`, `Stack`, `Skeleton` et `EmptyState`) avec des contrats TypeScript stricts. Les anciens composants B3 dupliqués ont été retirés, sans changement des textes, actions ou lectures métier.
- L’accueil, les surfaces publiques, les formulaires d’authentification, les invitations et le formulaire de création de saison composent désormais les primitives Astryx. Le sélecteur connexion/inscription utilise un contrôle segmenté accessible piloté par l’URL ; les actions serveur, validations Zod, redirections internes sûres et appels Supabase restent inchangés.
- Les formulaires d’authentification exposent explicitement les états `idling`, `pending`, `success` et `error`, conservent les champs natifs attendus par les Server Actions et annoncent les attentes et erreurs aux technologies d’assistance.
- Une salle permanente Margot × Kévin remplace les saisons sélectionnables.
- Toute session créée par inscription ou connexion rejoint automatiquement la salle avec le rôle `PLAYER`, un portefeuille unique et 1 000 MKB crédités exactement une fois.
- Deux marchés Supabase sont proposés : premier bisou post-rupture et retour officiel en couple.
- Les devis, placements, débits, cotes figées, tickets et classement sont autoritaires et transactionnels côté PostgreSQL.
- Tout membre peut signaler un bisou ou un couple officiel avec l’heure réelle, une description, un marché lié et jusqu’à cinq preuves privées.
- L’auteur ne peut pas voter. Chaque autre compte dispose d’un vote définitif. Deux validations confirment ; deux invalidations rejettent.
- Une confirmation règle atomiquement le marché et les paris liés, puis crédite les gains MKB sans double paiement. Une invalidation rouvre le marché.
- Le fil `/direct`, les filtres, `/report`, `/markets`, `/bets`, `/leaderboard` et `/settings/account` lisent l’état réel sous RLS.
- Le calendrier protégé `/markets/calendar` lit les marchés existants sous RLS, groupe leurs dates opérationnelles par semaine UTC et distingue ouverture, fermeture des mises et échéance du fait. La fermeture bloque un nouveau ticket ; l’échéance décrit le terme du fait parié. Ses filtres accessibles conservent la semaine, les liens précédent/suivant conservent les filtres, et les horaires affichent explicitement UTC. La page Marchés y donne accès sans ajouter d’onglet mobile. Le ticket expose les libellés Simple/Combiné : un combiné contient exactement deux ou trois marchés distincts, exige une corrélation exacte et conserve l’ordre des jambes. Le devis PostgreSQL actif est l’unique autorité sur la cote et le retour affichés ; chaque surface de ticket génère ses propres identifiants de mise accessibles.
- Les preuves sont converties en WebP 1 600 px sans métadonnées, stockées dans `season-media` et diffusées uniquement par une route authentifiée avec cache privé désactivé.
- Les anciennes routes dashboard, saisons, lives, résultats, chronologie et administration redirigent vers `/direct`.

## Base et sécurité

Quinze migrations forward-only sont présentes. Les quatre migrations datées du 15 juillet ajoutent la salle unique, les rapports, la résolution atomique et leurs policies RLS. La longueur minimale du mot de passe local est configurée à 10 dans `supabase/config.toml` et ne constitue pas une migration. Les migrations historiques et `src/domain/odds` restent inchangés.

Les RPC sensibles utilisent `SECURITY DEFINER`, `search_path = ''`, `auth.uid()` et des objets qualifiés. Le client ne transmet jamais de rôle, solde, cote finale, gain ou statut de règlement. Les transactions de portefeuille et journaux d’audit restent immuables.

## Validation locale

- Vitest couvre la frontière Zod, les repositories, Server Actions, composants et règles existantes.
- Le scénario `db:test:single-room` vérifie inscription/crédit idempotents, auto-vote refusé, votes immuables, confirmation, règlement/gain unique, invalidation et réouverture.
- Playwright couvre le pari réel, l’upload d’une preuve, le vote de deux membres, le règlement visible, le refus anonyme du média, l’invalidation et les vues desktop/mobile.
- Playwright couvre aussi l’inscription par mot de passe avec accès direct à `/direct`, la déconnexion/reconnexion, les erreurs non énumérantes, la récupération Mailpit via callback PKCE, la confirmation publique du changement de mot de passe et le nettoyage de la session recovery. Le parcours vérifie ensuite que l’ancien mot de passe échoue et que le nouveau réussit. Les identités Supabase locales créées par ces parcours et par les fixtures globales sont supprimées après chaque exécution.
- Axe contrôle les pages privées principales et la navigation clavier ; la matrice responsive couvre les largeurs mobiles, tablette et desktop.

- `pnpm test` : 277 tests réussis dans 47 fichiers.
- `pnpm test:e2e` : 31 parcours réussis et 3 skips de projet attendus sur 34 cas desktop/mobile.
- `db:reset`, génération des types sans différence après formatage, lint PostgreSQL et les cinq scénarios SQL RLS, betting, lives, médias et salle unique : 5 sur 5 réussis.
- `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm build` avec Supabase arrêté et sans variables Supabase, puis `pnpm install --frozen-lockfile` : succès.
- Lors de la validation documentaire du 23 juillet 2026, `db:reset`, `db:test:single-room`, `db:test:betting`, format, lint, typecheck, Vitest, build et installation frozen ont de nouveau réussi. Aucun script `db:lint` n’est défini. Le lancement E2E a atteint le navigateur après le redémarrage de Supabase local, mais s’est terminé sans cas individuel signalé (`status: failed`, `failedTests: []`) ; ce contrôle reste à réexécuter dans un environnement isolé.
- Pour la migration Astryx publique et Auth : `pnpm lint`, `pnpm typecheck`, `pnpm test` et `pnpm build` réussissent ; Prettier valide tous les fichiers modifiés. Le contrôle de format global signale uniquement `pnpm-workspace.yaml`, déjà non conforme et non modifié par ce lot.

## Production

La branche de refonte a été fusionnée dans `main`, puis poussée sur GitHub le 20 juillet 2026. Supabase Auth Production impose désormais un minimum de 10 caractères et autorise le callback exact `https://mk-bet.vercel.app/auth/callback`. Le déploiement Vercel correspondant est actif : `/`, `/login` et `/api/health` répondent en HTTP 200, l’interface de connexion par mot de passe est servie et une requête anonyme vers `/direct` revient vers la connexion.

Chaque Preview testée doit définir `NEXT_PUBLIC_SITE_URL` à son origine exacte et ajouter dans Supabase le pattern `https://<preview-host>/auth/callback**`, limité à ce host et à ce chemin afin de couvrir le callback de récupération. Vercel conserve uniquement `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ; aucune clé `service_role` n’est nécessaire. Aucune migration n’est exécutée par Vercel. La récupération par e-mail reste à vérifier manuellement avec une adresse membre après cette promotion.

## Limites assumées

- pas d’argent réel, paiement, retrait ou cash-out ;
- pas encore de Realtime ou de notification push ;
- pas de modification d’un vote ;
- pas de console de modération dédiée aux signalements dans cette version ;
- les anciens sous-domaines lives/saisons restent seulement pour la compatibilité de schéma.
