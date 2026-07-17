# MK Bet

MK Bet est une application web privée de paris fictifs entre amis autour de la saison post-rupture Margot × Kévin. Son ton reprend avec humour les codes d’un sportsbook, mais elle n’utilise que la monnaie fictive MKB et ne permet aucun pari en argent réel.

Cette version recentre tout le produit sur une salle permanente Margot × Kévin. L’adresse e-mail sert d’identifiant : l’utilisateur crée un mot de passe d’au moins dix caractères, confirme son adresse, puis peut se connecter ou utiliser « Mot de passe oublié ». Le magic link n’est plus proposé dans l’interface.

Chaque compte confirmé rejoint automatiquement la salle, reçoit 1 000 MKB fictifs exactement une fois et peut parier sur deux questions : le prochain bisou et le retour officiel en couple. Chaque membre peut aussi déclarer un fait avec des preuves privées. Deux votes concordants le confirment ou l’invalident ; une confirmation règle atomiquement le marché et les tickets liés.

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

| Variable                               | Portée   | Utilisation                                  |
| -------------------------------------- | -------- | -------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | Publique | URL absolue propre à l’environnement courant |
| `NEXT_PUBLIC_SUPABASE_URL`             | Publique | URL du projet Supabase                       |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publique | Clé publishable publique Supabase            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`        | Publique | Compatibilité locale temporaire dépréciée    |

Ne jamais committer `.env.local`. Aucune clé `service_role` n’est nécessaire dans Vercel : les Server Actions utilisent la session SSR et les RPC PostgreSQL autorisent les opérations avec `auth.uid()` et RLS.

## Commandes

```bash
pnpm dev          # serveur de développement
pnpm build        # build de production Next.js
pnpm start        # exécution du build de production
pnpm lint         # analyse ESLint
pnpm typecheck    # vérification TypeScript stricte
pnpm test         # tests unitaires Vitest
pnpm test:watch   # tests unitaires en mode interactif
pnpm test:e2e     # parcours Chromium desktop/mobile avec Supabase local actif
pnpm odds:demo    # démonstration locale déterministe du moteur de cotes
pnpm db:start     # démarre Supabase local avec Docker
pnpm db:reset     # recrée la base depuis les migrations et le seed
pnpm db:types     # régénère les types TypeScript depuis la base locale
pnpm db:test:betting # valide marchés, devis, placements et idempotence
pnpm db:test:lives   # valide création de lives, RLS, audit et idempotence
pnpm db:test:media   # valide médias privés, Storage, RLS et audit
pnpm db:test:single-room # valide salle unique, votes et règlement atomique
pnpm db:stop      # arrête Supabase local sans conserver son état
pnpm format       # mise en forme Prettier
pnpm format:check # contrôle Prettier sans modification
```

Chromium est une dépendance de développement locale : son binaire reste dans le cache Playwright de la machine et n’est ni committé, ni requis par le runtime Vercel. `pnpm test:e2e` prépare des sessions Auth locales éphémères dans un dossier ignoré et lance le build E2E sur le port 3100.

## Architecture

- `src/app` : routes et interfaces Next.js App Router ;
- `src/components` : composants de mise en page et composants UI accessibles ;
- `src/domain/events` : règles et types des signalements collaboratifs ;
- `src/domain` : types métier et logique métier pure, dont le moteur de cotes ;
- `src/application` : orchestration pure et adaptation des modèles persistants ;
- `src/auth`, `src/data` et `src/lib/supabase` : sessions SSR, autorisations et accès persistant à Supabase ;
- `src/config` : validation paresseuse de l’environnement avec Zod ;
- `supabase` : configuration locale, migrations, seed et validation SQL ;
- `tests` : tests unitaires et préparation des tests end-to-end.

Consulter [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/DATABASE.md`](docs/DATABASE.md), [`docs/ODDS.md`](docs/ODDS.md), [`docs/BETTING.md`](docs/BETTING.md) et [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).

## Déploiement

La production publique est déployée sur [mk-bet.vercel.app](https://mk-bet.vercel.app). Vercel utilise `pnpm install --frozen-lockfile` puis `pnpm build`. Les migrations Supabase restent une opération explicite exécutée avant toute version applicative qui en dépend.

La procédure complète se trouve dans [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## État actuel

La page publique, l’Auth SSR par e-mail et mot de passe, la confirmation, la récupération, la salle unique, les deux marchés, le ticket, le classement et le fil de validation sont implémentés. Les preuves sont converties en WebP sans métadonnées, stockées dans un bucket privé et servies par une route authentifiée sans URL Storage. Le règlement MKB lié aux faits confirmés est réel, idempotent et audité. Voir [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md).
