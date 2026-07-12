# État actuel

Dernière mise à jour : 12 juillet 2026.

## Ce qui existe

- Application Next.js App Router avec React, TypeScript strict et Tailwind CSS.
- Page d’accueil de pré-saison responsive et accessible.
- Pages de chargement, erreur, erreur globale et contenu introuvable.
- Route publique `GET /api/health` sans information sensible.
- Validation paresseuse des variables d’environnement avec Zod.
- Fondations Supabase sans connexion ni clé réelle.
- ESLint, Prettier, Vitest, Testing Library et configuration Playwright.
- Documentation produit, architecture, décisions, roadmap et déploiement futur.

## Ce qui n’est pas développé

- Schéma PostgreSQL et migrations métier.
- Authentification, invitations et autorisations RLS.
- Marchés, cotes, ticket de pari et portefeuille MKB.
- Lives, actions déclarées, validation et règlement.
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
- `pnpm format`
- `pnpm format:check`

## Prochaines tâches

La prochaine étape prévue est la conception du schéma Supabase. Elle devra commencer par une spécification des tables, contraintes, transactions, politiques RLS et données de développement avant toute migration.

## Problèmes connus

- Les navigateurs Playwright ne sont pas installés dans cette étape ; la configuration et un smoke test futur sont présents, mais le parcours end-to-end n’a pas été exécuté.
- Aucune variable Supabase réelle n’est configurée. Le build reste volontairement indépendant de cette configuration.
- L’interface Chrome de contrôle du workspace n’était pas disponible pendant cette tâche. Le rendu a été vérifié par les tests de composants et par le HTML du serveur de production, mais pas par une inspection visuelle automatisée du navigateur.

## Dernières validations

Exécutées le 12 juillet 2026 après l’initialisation :

- `pnpm format` : succès ;
- `pnpm lint` : succès ;
- `pnpm typecheck` : succès ;
- `pnpm test` : 8 tests réussis ;
- `pnpm build` : succès, avec `/`, `/_not-found`, `/api/health` et `/icon.svg` dans la table des routes ;
- `pnpm install --frozen-lockfile` : succès ;
- serveur de production : `/` répond et `/api/health` renvoie HTTP 200 avec le contrat attendu ;
- recherche de secrets Supabase/JWT : aucun secret détecté.
