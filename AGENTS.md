# Règles permanentes de MK Bet

## Méthode de travail

- Lire `AGENTS.md` et les documents de `/docs` avant toute modification importante.
- Inspecter l’existant avant de coder.
- Effectuer les changements par petites étapes cohérentes.
- Ne jamais supprimer une modification utilisateur sans nécessité.
- Mettre à jour `docs/CURRENT_STATE.md` à la fin de chaque tâche.
- Exécuter les validations disponibles avant de conclure.
- Expliquer clairement tout contrôle impossible à exécuter.

## TypeScript et architecture

- TypeScript strict est obligatoire.
- Ne jamais utiliser `any` sans justification écrite.
- Préférer `unknown` avec validation explicite.
- Valider les entrées externes avec Zod.
- Séparer les composants visuels, la logique métier et l’accès aux données.
- Ne jamais calculer les cotes uniquement dans un composant React.
- Placer la logique métier pure dans `src/domain`.
- Placer l’accès à Supabase dans `src/data` ou `src/lib/supabase`.
- Conserver les composants génériques dans `src/components`.
- Éviter les fichiers excessivement volumineux.
- Utiliser des noms de fonctions et fichiers techniques en anglais.
- Utiliser le français pour les textes visibles dans l’interface.

## Base de données et sécurité

- Supabase est la source de vérité persistante.
- Toute opération de portefeuille ou de règlement doit être atomique côté PostgreSQL.
- Toutes les tables privées devront utiliser Row Level Security.
- Les cotes sont figées au moment du placement d’un pari.
- L’heure réelle d’une action `occurred_at` est distincte de son heure de déclaration `declared_at`.
- Toute opération administrative importante doit créer une entrée dans le journal d’audit.
- Ne jamais faire confiance aux montants, cotes ou rôles envoyés par le client.
- Ne jamais afficher ou écrire un secret dans les logs.

## Vercel

- Le projet doit rester déployable sur Vercel sans serveur dédié.
- Ne jamais utiliser le disque local comme stockage persistant.
- Ne jamais supposer qu’une instance de fonction reste active entre deux requêtes.
- Ne jamais mettre en place de timer ou de boucle permanente dans une fonction Vercel.
- Toute tâche différée devra utiliser un mécanisme compatible avec une architecture serverless.
- Vérifier `pnpm build` avant toute livraison.
- Documenter chaque nouvelle variable d’environnement.

## Interface

- Concevoir l’interface mobile-first.
- Garantir une navigation utilisable au clavier.
- Conserver un focus visible.
- Assurer un contraste suffisant.
- Prévoir les états de chargement, erreur, vide et désactivé.
- Ne copier ni le logo, ni les assets, ni la mise en page exacte de Betclic.
- Créer une identité originale inspirée des codes génériques des applications de paris sportifs.

## Tests

- Ajouter ou mettre à jour les tests lors de chaque modification métier.
- Tester la logique métier indépendamment de React.
- Exécuter au minimum lint, typecheck, tests unitaires et build.
- Ajouter ultérieurement des tests Playwright pour les parcours critiques.
