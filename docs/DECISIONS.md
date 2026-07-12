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

## ADR-007 — Intégrité relationnelle dans PostgreSQL

**Décision :** utiliser en priorité les contraintes, clés composites et checks PostgreSQL, puis des triggers ciblés pour les invariants transversaux.

**Motif :** empêcher qu’une incohérence de saison, live, marché, issue ou règlement puisse contourner le futur code TypeScript.

## ADR-008 — RLS deny-by-default

**Décision :** activer la RLS sur toutes les tables privées sans politique permissive avant l’étape Auth et Permissions.

**Motif :** rendre tout accès client impossible par défaut tant que les règles de rôle ne sont pas complètement définies et testées.

## ADR-009 — Migrations explicites et forward-only

**Décision :** appliquer les migrations Supabase hors de Next.js et ne jamais modifier silencieusement un fichier déjà déployé.

**Motif :** dissocier les changements persistants du cycle éphémère de Vercel et préserver un historique reproductible entre Preview et Production.

## ADR-010 — Noyau fonctionnel pur pour les cotes

**Décision :** le moteur de cotes est un noyau fonctionnel pur. Les lectures et écritures Supabase seront ajoutées dans une couche d’application distincte.

**Motif :** garantir le déterminisme, l’explicabilité, les tests en mémoire et la compatibilité serverless, sans coupler les calculs à React, Next.js ou au cycle de vie d’une connexion distante.

## ADR-011 — Auth SSR Supabase et RLS métier

**Décision :** utiliser `@supabase/ssr`, `getClaims()` et des RPC SQL contrôlées pour l’authentification privée, les invitations et les autorisations.

**Motif :** conserver une application compatible Vercel sans session globale, faire appliquer les droits par PostgreSQL et éviter l’usage de la service role dans les parcours utilisateur.
