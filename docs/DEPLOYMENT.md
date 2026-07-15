# Déploiement Vercel

MK Bet est publié sur [mk-bet.vercel.app](https://mk-bet.vercel.app). Le projet Vercel `mk-bet` est relié à `main` et au dépôt GitHub. Son installation utilise `pnpm install --frozen-lockfile` et son build `pnpm build`.

## Import du dépôt

1. Pousser le dépôt Git vers l’hébergeur choisi.
2. Dans Vercel, importer ce dépôt et sélectionner sa branche principale.
3. Vérifier que le framework détecté est **Next.js**.
4. Utiliser `pnpm install --frozen-lockfile` comme commande d’installation.
5. Utiliser `pnpm build` comme commande de build.
6. Ne pas ajouter de `vercel.json` tant qu’aucune configuration spécifique ne le justifie.

## Environnements et variables

Configurer séparément les variables suivantes dans **Development**, **Preview** et **Production** :

- `NEXT_PUBLIC_SITE_URL` ;
- `NEXT_PUBLIC_SUPABASE_URL` ;
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

`NEXT_PUBLIC_SUPABASE_ANON_KEY` reste accepté temporairement en local mais ne doit pas être la référence des nouveaux environnements. `SUPABASE_SERVICE_ROLE_KEY` ne doit être ajoutée dans Vercel que lorsqu’une future fonctionnalité serveur l’exige réellement.

Chaque déploiement qui nécessite une URL publique absolue doit utiliser `NEXT_PUBLIC_SITE_URL`. En Preview, le callback Auth peut utiliser l’origine validée de la requête pour fonctionner avec les URLs générées par Vercel.

Les secrets ne doivent jamais être committés. `.env.local` reste local et la clé de service ne doit être disponible que dans le runtime serveur.

## Redirections Supabase

Déclarer dans Supabase Auth les URLs de redirection autorisées pour :

- local : `http://localhost:3000/auth/callback` et `http://127.0.0.1:3000/auth/callback` ;
- Preview : les domaines Preview utilisés par le projet, sans coder de domaine inventé ;
- Production : `https://mk-bet.vercel.app/auth/callback`.

Les paramètres `next` reçus du client sont limités à des chemins internes.

La configuration Auth Production actuellement appliquée utilise `https://mk-bet.vercel.app` comme `site_url` et autorise son callback. Les URLs Preview ne sont ajoutées que lorsqu’un domaine Preview concret doit accepter des magic links.

## Migrations Supabase

Vercel ne lance jamais les migrations. `pnpm build`, `pnpm start`, les fonctions Vercel et les requêtes utilisateur ne doivent appeler aucune commande Supabase CLI ni modifier le schéma.

Avant de déployer une version qui dépend d’une nouvelle migration :

1. reconstruire et tester la base locale depuis zéro ;
2. appliquer les migrations à une base Supabase Preview ou staging ;
3. exécuter le seed de référence et les validations adaptées ;
4. appliquer les mêmes migrations versionnées à Production ;
5. seulement ensuite promouvoir la version applicative dépendante.

Le build Vercel réussit sans connexion active à PostgreSQL. `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` sont configurées séparément sur Vercel pour Development, Preview et Production; `NEXT_PUBLIC_SITE_URL` est configurée pour Production.

## Vérification après déploiement

1. Ouvrir la page `/` et contrôler son rendu responsive.
2. Appeler `/api/health`.
3. Vérifier la réponse HTTP 200 et le JSON `{ "status": "ok", "application": "mk-bet" }`.
4. Après configuration Supabase, vérifier que `/login`, `/dashboard` et `/markets` chargent sans exposer de jeton dans le HTML.
5. Consulter les logs de build sans y copier de variable sensible.

Les pages sportsbook privées peuvent être buildées sans base active : leurs Server Components ne contactent Supabase qu’à la requête authentifiée. Marchés, devis, tickets, portefeuille et classement nécessitent les migrations appliquées avant la promotion applicative. Vercel ne lance jamais ces migrations.

## Playwright et Chromium

Chromium sert exclusivement au développement et aux tests end-to-end locaux. Le binaire installé par `pnpm exec playwright install chromium` reste dans le cache Playwright de la machine ; il n’est pas committé et n’est pas nécessaire au build ou au runtime Vercel.

La suite E2E utilise Supabase local, Mailpit et un build isolé `.next-e2e` sur le port 3100. Les cookies et états Auth sont générés à chaque exécution dans `tests/e2e/.auth`, dossier ignoré. Aucun navigateur n’est lancé par `pnpm build`, aucune variable Vercel supplémentaire n’est requise et les snapshots ne dépendent d’aucune URL distante.

Le parcours normal n’utilise pas `SUPABASE_SERVICE_ROLE_KEY`. Les Server Actions utilisent la session SSR de l’utilisateur et les RPC contrôlent `auth.uid()` ainsi que les rôles. Aucun timer serveur n’assure l’expiration des devis : PostgreSQL valide `expires_at` lors du placement.

## Rollback

En cas de régression, ouvrir la liste des déploiements du projet Vercel, sélectionner le dernier déploiement sain, puis utiliser l’action de promotion ou de rollback proposée par Vercel. Vérifier ensuite `/` et `/api/health`. Un rollback applicatif ne remplace pas une stratégie séparée de retour arrière pour les futures migrations PostgreSQL.

Les migrations suivent une stratégie forward-only : une correction de schéma nécessite une nouvelle migration compatible. Restaurer des données ou annuler une migration destructive exige une procédure PostgreSQL préparée et testée séparément.
