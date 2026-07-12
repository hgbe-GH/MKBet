# Décisions d’architecture

## ADR-001 — Next.js avec App Router

**Décision :** utiliser Next.js, React et TypeScript strict avec l’App Router.

**Motif :** disposer de Server Components, Route Handlers et Server Actions dans un cadre directement compatible avec Vercel.

## ADR-002 — Supabase comme plateforme de données

**Décision :** utiliser Supabase pour PostgreSQL, Auth, Realtime et Storage.

**Motif :** centraliser la persistance et les services de données sans maintenir de serveur permanent.

## ADR-003 — Déploiement sur Vercel

**Décision :** maintenir une architecture serverless compatible avec Vercel.

**Motif :** déployer Next.js sans disque persistant, processus résident ni état applicatif critique en mémoire.

## ADR-004 — Moteur de cotes indépendant de React

**Décision :** placer les calculs de probabilités et de cotes dans des modules purs de `src/domain`.

**Motif :** permettre leur test isolé, leur exécution côté serveur et empêcher le client de devenir une source autoritaire.

## ADR-005 — Absence de serveur persistant

**Décision :** ne créer aucun serveur dédié, timer local ou boucle permanente.

**Motif :** respecter le modèle d’exécution éphémère de Vercel et utiliser des mécanismes externes adaptés aux futures tâches différées.

## ADR-006 — Monnaie exclusivement fictive

**Décision :** toutes les mises et tous les règlements utilisent uniquement la monnaie fictive MKB.

**Motif :** MK Bet est un jeu privé humoristique et ne doit proposer aucun pari en argent réel.
