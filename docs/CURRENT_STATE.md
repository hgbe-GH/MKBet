# État actuel

Dernière mise à jour : 16 juillet 2026.

## Produit réel

- Les contrats et Server Actions Auth couvrent désormais connexion, inscription, demande de réinitialisation et changement de mot de passe avec normalisation Zod, redirections internes, initialisation idempotente de la salle et erreurs françaises génériques.
- Une salle permanente Margot × Kévin remplace les saisons sélectionnables.
- Tout compte confirmé rejoint automatiquement la salle avec le rôle `PLAYER`, un portefeuille unique et 1 000 MKB crédités exactement une fois.
- Deux marchés Supabase sont proposés : premier bisou post-rupture et retour officiel en couple.
- Les devis, placements, débits, cotes figées, tickets et classement sont autoritaires et transactionnels côté PostgreSQL.
- Tout membre peut signaler un bisou ou un couple officiel avec l’heure réelle, une description, un marché lié et jusqu’à cinq preuves privées.
- L’auteur ne peut pas voter. Chaque autre compte dispose d’un vote définitif. Deux validations confirment ; deux invalidations rejettent.
- Une confirmation règle atomiquement le marché et les paris liés, puis crédite les gains MKB sans double paiement. Une invalidation rouvre le marché.
- Le fil `/direct`, les filtres, `/report`, `/markets`, `/bets`, `/leaderboard` et `/settings/account` lisent l’état réel sous RLS.
- Les preuves sont converties en WebP 1 600 px sans métadonnées, stockées dans `season-media` et diffusées uniquement par une route authentifiée avec cache privé désactivé.
- Les anciennes routes dashboard, saisons, lives, résultats, chronologie et administration redirigent vers `/direct`.

## Base et sécurité

Quinze migrations forward-only sont présentes. Les quatre migrations datées du 15 juillet ajoutent la salle unique, les rapports, la résolution atomique et leurs policies RLS. Les migrations historiques et `src/domain/odds` restent inchangés.

Les RPC sensibles utilisent `SECURITY DEFINER`, `search_path = ''`, `auth.uid()` et des objets qualifiés. Le client ne transmet jamais de rôle, solde, cote finale, gain ou statut de règlement. Les transactions de portefeuille et journaux d’audit restent immuables.

## Validation locale

- Vitest couvre la frontière Zod, les repositories, Server Actions, composants et règles existantes.
- Le scénario `db:test:single-room` vérifie inscription/crédit idempotents, auto-vote refusé, votes immuables, confirmation, règlement/gain unique, invalidation et réouverture.
- Playwright couvre le pari réel, l’upload d’une preuve, le vote de deux membres, le règlement visible, le refus anonyme du média, l’invalidation et les vues desktop/mobile.
- Axe contrôle les pages privées principales et la navigation clavier ; la matrice responsive couvre les largeurs mobiles, tablette et desktop.

- `pnpm test` : 181 tests réussis dans 39 fichiers.
- `pnpm test:e2e` : 27 parcours réussis et 3 skips de projet attendus sur 30 cas desktop/mobile.
- Répétition ciblée `--repeat-each=2` : 4 parcours métier desktop et 2 contrôles mobiles réussis, avec les skips croisés attendus.
- `db:reset`, génération des types, lint PostgreSQL et les cinq scénarios SQL RLS, betting, lives, médias et salle unique : succès.

## Production

La refonte est disponible sur [mk-bet.vercel.app](https://mk-bet.vercel.app) et liée au projet Supabase Production. Les quinze migrations locales et distantes sont alignées ; les quatre migrations de salle unique ont été appliquées avant le déploiement Vercel. `/`, `/login` et `/api/health` répondent en Production, et une requête anonyme vers `/direct` est redirigée vers `/login?next=/direct`. Aucune migration n’est exécutée par Vercel.

La validation authentifiée complète a été exécutée localement avec de vraies sessions Supabase. Le magic link Production a aussi été validé manuellement le 15 juillet 2026 : le callback crée la session puis `/direct`, `/markets`, `/report`, `/bets` et `/leaderboard` répondent sous session authentifiée. Les échecs du callback sont journalisés uniquement avec une étape stable, sans adresse, jeton ni détail Supabase.

## Limites assumées

- pas d’argent réel, paiement, retrait ou cash-out ;
- pas encore de Realtime ou de notification push ;
- pas de modification d’un vote ;
- pas de console de modération dédiée aux signalements dans cette version ;
- les anciens sous-domaines lives/saisons restent seulement pour la compatibilité de schéma.
