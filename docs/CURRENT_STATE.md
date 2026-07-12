# État actuel

Dernière mise à jour : 12 juillet 2026.

## Ce qui existe

- Application Next.js App Router avec React, TypeScript strict et Tailwind CSS.
- Page d’accueil de pré-saison responsive et accessible.
- Pages de chargement, erreur, erreur globale et contenu introuvable.
- Route publique `GET /api/health` sans information sensible.
- Validation paresseuse des variables d’environnement avec Zod.
- Authentification privée Supabase SSR avec magic link, callback, logout et helpers de session.
- Fondations Supabase sans clé réelle committée.
- Huit migrations PostgreSQL couvrant 25 tables, 24 enums, contraintes, index, triggers, RPC Auth/invitations et RLS métier.
- Création automatique/rattrapage des profils, invitations hashées, rôles cumulables et sélection de saison.
- Premières pages protégées : `/seasons`, `/seasons/new`, `/dashboard`, `/settings/account` et `/invite/[token]`.
- Seed idempotent avec 19 types d’actions, 7 templates et 15 règles d’impact.
- Types Supabase générés et interfaces de domaine ciblées.
- Moteur déterministe de probabilités et de cotes indépendant de React, Next.js et Supabase.
- Pricing binaire, multi-options, périodes, date exacte, prochaine action, over/under et combinés corrélés.
- Adaptateurs purs des modèles SQL, drafts de snapshots et service abstrait de repricing sans accès distant.
- Fixtures locales conformes au seed et démonstration reproductible avec `pnpm odds:demo`.
- ESLint, Prettier, Vitest, Testing Library et configuration Playwright.
- Documentation produit, architecture, décisions, roadmap et déploiement futur.

## Ce qui n’est pas développé

- Pages et opérations persistantes pour marchés, tickets et portefeuilles MKB.
- Placement transactionnel, écriture réelle des snapshots et règlement financier.
- Lives fonctionnels, déclaration d’actions, validation et règlement transactionnel.
- Supabase Realtime, chronologie, classement et administration.
- Déploiements Vercel Preview et Production.

## Commandes disponibles

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:watch`
- `pnpm test:e2e`
- `pnpm odds:demo`
- `pnpm db:start`
- `pnpm db:reset`
- `pnpm db:types`
- `pnpm db:stop`
- `pnpm format`
- `pnpm format:check`

## Prochaines tâches

La prochaine étape prévue est l’identité visuelle puis les marchés. Le moteur de cotes restera un noyau pur ; sa future persistance passera par une couche distincte.

## Problèmes connus

- Les navigateurs Playwright ne sont pas installés dans cette étape ; la configuration et un smoke test futur sont présents, mais le parcours end-to-end n’a pas été exécuté.
- Aucune variable Supabase réelle n’est configurée. Le build reste volontairement indépendant de cette configuration.
- L’interface Chrome de contrôle du workspace n’était pas disponible pendant cette tâche. Le rendu a été vérifié par les tests de composants et par le HTML du serveur de production, mais pas par une inspection visuelle automatisée du navigateur.

## Dernières validations

Exécutées le 12 juillet 2026 après l’ajout de l’authentification, des invitations et de la RLS :

- `pnpm format` : succès ;
- `pnpm lint` : succès ;
- `pnpm typecheck` : succès ;
- `pnpm test` : 72 tests réussis dans 13 fichiers, incluant Auth, env, UI, schéma, RPC Supabase et moteur de cotes ;
- `supabase db reset` : succès avec huit migrations et seed ;
- `supabase db lint` : succès sans erreur de schéma ;
- `supabase/tests/auth_rls_validation.sql` : 1 script SQL réussi en rollback avec 7 identités fictives, invitation et RLS ;
- politiques RLS : 74 policies applicatives et Storage ;
- `pnpm build` : succès sans base active requise au build ;
- `pnpm install --frozen-lockfile` : succès ;
- recherche de secrets Supabase/JWT : aucun secret détecté ;
- migrations Supabase existantes : aucune modification rétroactive ;
- build : aucune migration ni accès Supabase obligatoire à la compilation.

## Validation locale du schéma

Supabase CLI 2.109.1 et Docker ont réellement été exécutés le 12 juillet 2026 :

- démarrage du stack local ;
- reset complet et application des cinq migrations ;
- exécution automatique du seed puis réexécution sur la même base ;
- validation SQL des 25 tables, de la RLS, des contraintes et des décomptes de référence ;
- génération officielle de `src/types/database.ts` ;
- arrêt propre des services sans conservation de l’état local.
