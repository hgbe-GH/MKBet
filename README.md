# MK Bet

MK Bet est une application web privée de paris fictifs entre amis autour de la saison post-rupture Margot × Kévin. Son ton reprend avec humour les codes d’un sportsbook, mais elle n’utilise que la monnaie fictive MKB et ne permet aucun pari en argent réel.

Cette version contient les fondations techniques, le schéma Supabase, l’authentification privée, les invitations de saison, une page de pré-saison statique et un moteur déterministe de probabilités et de cotes.

## Prérequis

- Node.js 20.18.1 ou supérieur ;
- pnpm 11.12.0.

## Installation

```bash
pnpm install --frozen-lockfile
```

Copier ensuite le modèle d’environnement pour le développement local :

```bash
cp .env.example .env.local
```

Les valeurs Supabase peuvent rester vides tant qu’aucune fonctionnalité Supabase n’est appelée.

## Lancement local

```bash
pnpm dev
```

L’application est alors disponible sur `http://localhost:3000`. La route de santé se trouve sur `http://localhost:3000/api/health`.

## Variables d’environnement

| Variable                               | Portée             | Utilisation                                                          |
| -------------------------------------- | ------------------ | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | Publique           | URL absolue propre à l’environnement courant                         |
| `NEXT_PUBLIC_SUPABASE_URL`             | Publique           | URL du projet Supabase                                               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publique           | Clé publishable publique Supabase                                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`        | Publique           | Compatibilité locale temporaire dépréciée                            |
| `SUPABASE_SERVICE_ROLE_KEY`            | Serveur uniquement | À ajouter seulement lorsqu’une fonctionnalité serveur future l’exige |

Ne jamais committer `.env.local`. La clé de service Supabase ne doit jamais être importée dans un Client Component ni exposée dans les logs.

## Commandes

```bash
pnpm dev          # serveur de développement
pnpm build        # build de production Next.js
pnpm start        # exécution du build de production
pnpm lint         # analyse ESLint
pnpm typecheck    # vérification TypeScript stricte
pnpm test         # tests unitaires Vitest
pnpm test:watch   # tests unitaires en mode interactif
pnpm test:e2e     # futurs parcours Playwright
pnpm odds:demo    # démonstration locale déterministe du moteur de cotes
pnpm db:start     # démarre Supabase local avec Docker
pnpm db:reset     # recrée la base depuis les migrations et le seed
pnpm db:types     # régénère les types TypeScript depuis la base locale
pnpm db:stop      # arrête Supabase local sans conserver son état
pnpm format       # mise en forme Prettier
pnpm format:check # contrôle Prettier sans modification
```

Les navigateurs Playwright ne sont pas installés ni lancés par l’installation standard de cette étape.

## Architecture

- `src/app` : routes et interfaces Next.js App Router ;
- `src/components` : composants de mise en page et composants UI accessibles ;
- `src/domain` : types métier et logique métier pure, dont le moteur de cotes ;
- `src/application` : orchestration pure et adaptation des modèles persistants ;
- `src/auth`, `src/data` et `src/lib/supabase` : sessions SSR, autorisations et accès persistant à Supabase ;
- `src/config` : validation paresseuse de l’environnement avec Zod ;
- `supabase` : configuration locale, migrations, seed et validation SQL ;
- `tests` : tests unitaires et préparation des tests end-to-end.

Consulter [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) pour les décisions détaillées, [`docs/DATABASE.md`](docs/DATABASE.md) pour le schéma relationnel et [`docs/ODDS.md`](docs/ODDS.md) pour le modèle de cotes.

## Déploiement Vercel futur

Le dépôt pourra être connecté à Vercel avec `pnpm install --frozen-lockfile` comme commande d’installation et `pnpm build` comme commande de build. Les variables devront être configurées séparément dans Development, Preview et Production. Aucune mise en production n’a encore été réalisée.

La procédure complète se trouve dans [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## État actuel

La page de pré-saison, la route `/api/health`, l’authentification privée, les invitations, la sélection de saison, les premières pages protégées, le schéma Supabase versionné, les types de base, le moteur de cotes pur et les outils de validation existent. Les opérations transactionnelles de paris et de règlements ne sont pas encore développées. Voir [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md).
