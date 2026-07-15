# MK Bet

MK Bet est une application web privée de paris fictifs entre amis autour de la saison post-rupture Margot × Kévin. Son ton reprend avec humour les codes d’un sportsbook, mais elle n’utilise que la monnaie fictive MKB et ne permet aucun pari en argent réel.

Cette version contient les fondations techniques, le schéma Supabase, l’authentification privée, le moteur déterministe de cotes et un sportsbook transactionnel : marchés réels, devis courts, paris simples/combinés, débit MKB, tickets, portefeuille et classement financier.

## Prérequis

- Node.js 20.18.1 ou supérieur ;
- pnpm 11.12.0 ;
- Docker pour les parcours Supabase locaux ;
- Chromium Playwright pour les tests end-to-end (`pnpm exec playwright install chromium`).

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
pnpm test:e2e     # 39 parcours Chromium desktop/mobile avec Supabase local actif
pnpm odds:demo    # démonstration locale déterministe du moteur de cotes
pnpm db:start     # démarre Supabase local avec Docker
pnpm db:reset     # recrée la base depuis les migrations et le seed
pnpm db:types     # régénère les types TypeScript depuis la base locale
pnpm db:test:betting # valide marchés, devis, placements et idempotence
pnpm db:stop      # arrête Supabase local sans conserver son état
pnpm format       # mise en forme Prettier
pnpm format:check # contrôle Prettier sans modification
```

Chromium est une dépendance de développement locale : son binaire reste dans le cache Playwright de la machine et n’est ni committé, ni requis par le runtime Vercel. `pnpm test:e2e` prépare des sessions Auth locales éphémères dans un dossier ignoré et lance le build E2E sur le port 3100.

## Architecture

- `src/app` : routes et interfaces Next.js App Router ;
- `src/components` : composants de mise en page et composants UI accessibles ;
- `src/fixtures/sportsbook` : démonstration isolée des lives, résultats et chronologie seulement ;
- `src/domain` : types métier et logique métier pure, dont le moteur de cotes ;
- `src/application` : orchestration pure et adaptation des modèles persistants ;
- `src/auth`, `src/data` et `src/lib/supabase` : sessions SSR, autorisations et accès persistant à Supabase ;
- `src/config` : validation paresseuse de l’environnement avec Zod ;
- `supabase` : configuration locale, migrations, seed et validation SQL ;
- `tests` : tests unitaires et préparation des tests end-to-end.

Consulter [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/DATABASE.md`](docs/DATABASE.md), [`docs/ODDS.md`](docs/ODDS.md), [`docs/BETTING.md`](docs/BETTING.md) et [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).

## Déploiement Vercel futur

Le dépôt pourra être connecté à Vercel avec `pnpm install --frozen-lockfile` comme commande d’installation et `pnpm build` comme commande de build. Les variables devront être configurées séparément dans Development, Preview et Production. Aucune mise en production n’a encore été réalisée.

La procédure complète se trouve dans [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## État actuel

La page publique et l’Auth restent indépendantes du build. Les marchés, devis, paris, portefeuilles, tickets et classements utilisent Supabase ; les lives, actions, résultats et chronologie détaillée restent démonstratifs. Le règlement et le paiement des gains ne sont pas encore développés. Voir [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md).
