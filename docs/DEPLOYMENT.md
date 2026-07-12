# Déploiement Vercel

Ce document prépare un futur déploiement. Il ne signifie pas que MK Bet a déjà été connecté ou publié sur Vercel.

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
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ;
- `SUPABASE_SERVICE_ROLE_KEY`.

Chaque déploiement qui nécessite une URL publique absolue doit utiliser `NEXT_PUBLIC_SITE_URL`. En Preview, cette valeur doit correspondre à l’URL de Preview retenue par le projet plutôt qu’à une URL localhost.

Les secrets ne doivent jamais être committés. `.env.local` reste local et la clé de service ne doit être disponible que dans le runtime serveur.

## Redirections Supabase futures

Lorsque Supabase Auth sera ajouté, déclarer dans Supabase l’URL de Production et les motifs de redirection autorisés pour le développement et les Previews Vercel. Les destinations reçues du client devront être comparées à une liste d’origines autorisées avant toute redirection.

## Vérification après déploiement

1. Ouvrir la page `/` et contrôler son rendu responsive.
2. Appeler `/api/health`.
3. Vérifier la réponse HTTP 200 et le JSON `{ "status": "ok", "application": "mk-bet" }`.
4. Consulter les logs de build sans y copier de variable sensible.

## Rollback

En cas de régression, ouvrir la liste des déploiements du projet Vercel, sélectionner le dernier déploiement sain, puis utiliser l’action de promotion ou de rollback proposée par Vercel. Vérifier ensuite `/` et `/api/health`. Un rollback applicatif ne remplace pas une stratégie séparée de retour arrière pour les futures migrations PostgreSQL.
