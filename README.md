# MK Bet

MK Bet est une application web privée de paris fictifs entre amis autour de la saison post-rupture Margot × Kévin. Son ton reprend avec humour les codes d’un sportsbook, mais elle n’utilise que la monnaie fictive MKB et ne permet aucun pari en argent réel.

Cette version contient uniquement les fondations techniques et une page de pré-saison statique.

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

| Variable                        | Portée             | Utilisation                                     |
| ------------------------------- | ------------------ | ----------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`          | Publique           | URL absolue propre à l’environnement courant    |
| `NEXT_PUBLIC_SUPABASE_URL`      | Publique           | URL du futur projet Supabase                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publique           | Clé anonyme publique Supabase                   |
| `SUPABASE_SERVICE_ROLE_KEY`     | Serveur uniquement | Futures opérations administratives de confiance |

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
pnpm format       # mise en forme Prettier
pnpm format:check # contrôle Prettier sans modification
```

Les navigateurs Playwright ne sont pas installés ni lancés par l’installation standard de cette étape.

## Architecture

- `src/app` : routes et interfaces Next.js App Router ;
- `src/components` : composants de mise en page et composants UI accessibles ;
- `src/domain` : future logique métier pure ;
- `src/data` et `src/lib/supabase` : futur accès persistant à Supabase ;
- `src/config` : validation paresseuse de l’environnement avec Zod ;
- `supabase` : futures migrations et données de développement ;
- `tests` : tests unitaires et préparation des tests end-to-end.

Consulter [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) pour les décisions détaillées.

## Déploiement Vercel futur

Le dépôt pourra être connecté à Vercel avec `pnpm install --frozen-lockfile` comme commande d’installation et `pnpm build` comme commande de build. Les variables devront être configurées séparément dans Development, Preview et Production. Aucune mise en production n’a encore été réalisée.

La procédure complète se trouve dans [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## État actuel

La page de pré-saison, les écrans techniques, la route `/api/health`, les outils de validation et la documentation existent. Supabase, l’authentification, les marchés, les lives, le portefeuille et le moteur de cotes ne sont pas encore développés. Voir [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md).
