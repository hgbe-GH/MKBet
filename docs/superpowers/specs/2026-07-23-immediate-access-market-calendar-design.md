# MK Bet — Accès immédiat et calendrier des marchés

## Objectif

Un compte créé avec e-mail et mot de passe devient immédiatement utilisable : aucune confirmation d’adresse n’est requise. L’interface rend également les combinés et les dates de marché réellement compréhensibles, sans modifier les règles financières, le moteur de cotes, les RPC de devis ou les migrations existantes.

## Accès immédiat

- Supabase Auth désactive `Confirm email` en Production et dans la configuration locale.
- `signUpWithPasswordAction` conserve la validation Zod, les messages non énumérants et l’URL de récupération, mais ne construit plus d’URL de callback d’inscription ni n’affiche d’instruction de confirmation.
- Lorsque `signUp` renvoie une session, l’action appelle `initializeAuthenticatedAccess` puis redirige vers le chemin interne `next` ou `/direct`.
- Si Supabase retourne un utilisateur sans session malgré la configuration attendue, l’action ferme toute session locale éventuelle et retourne une erreur générique de configuration ; elle ne crée pas de profil ou de portefeuille sans session authentifiée.
- La récupération de mot de passe garde son callback et son contrôle AMR `recovery` : seul le parcours de confirmation d’inscription disparaît.
- Les tests locaux et E2E créent les utilisateurs directement confirmés, comme avant ; les scénarios UI attendent désormais l’accès immédiat.

## Combinés

Le backend actuel reste autoritaire : deux ou trois marchés distincts, une règle de corrélation exacte, cotes figées au devis et au placement, refus des contradictions ou des combinaisons sans règle.

L’interface du ticket explique ces propriétés avant la validation :

- compteur lisible « Simple », « Combiné 2 sélections » ou « Combiné 3 sélections » ;
- jambes affichées dans l’ordre de sélection avec marché, issue, cote et version ;
- cote combinée et retour potentiel explicitement distingués de la multiplication naïve ;
- panneau d’explication lorsque le devis applique une corrélation ;
- état de refus clair pour le même marché, une contradiction, plus de trois jambes ou une combinaison non tarifable ;
- aucune estimation client de probabilité ou de coefficient : le devis PostgreSQL reste la source de vérité.

## Calendrier et échéances

Une vue `/markets/calendar` protégée expose les marchés déjà accessibles à l’utilisateur. Elle utilise uniquement `opens_at`, `closes_at`, `deadline_at`, le statut et les données de marché existantes.

- navigation par semaine UTC, avec semaine courante par défaut ;
- filtres par catégorie et statut reprenant le parseur Zod de marchés ;
- une carte par marché, groupée par journée, avec ouverture, fermeture des mises et échéance de résultat ;
- une fermeture passée affiche « Mises fermées » et désactive l’accès de sélection ;
- l’échéance est distincte de la fermeture : elle décrit le terme du fait parié, pas le moment où un ticket peut être soumis ;
- un marché sans `deadline_at` affiche la fermeture comme unique date opérationnelle ;
- le calendrier est une lecture responsive, avec liste verticale mobile plutôt qu’une grille temporelle horizontale.

## Sécurité et périmètre

- Pas de nouveau rôle, de nouvel accès public, de nouveau client Supabase navigateur ni d’URL Storage.
- Pas de modification de `supabase/migrations`, `src/domain/odds`, des RPC de devis/placement, des politiques RLS, des transactions ou du portefeuille.
- Les permissions de lecture existantes filtrent les marchés. Les liens et le calendrier ne sont jamais une autorisation.
- Le format date est déterministe : instants ISO UTC en données, rendu localisé `fr-FR` dans l’interface.

## Tests et validation

- tests d’action : inscription avec session initialise l’accès et redirige ; session absente retourne une erreur générique ; la récupération ne change pas ;
- tests UI : l’inscription n’annonce plus un e-mail de confirmation ; ticket simple/combiné/refus/corrélation ;
- tests calendrier : semaine UTC, filtres sûrs, ordre des dates, distinction fermeture/échéance et marché fermé ;
- Playwright : inscription → `/direct` sans boîte mail, combiné autorisé/refusé, navigation calendrier ;
- validation complète : format, lint, typecheck, Vitest, SQL/RLS existants, E2E, build Supabase arrêté, frozen install et scan de secrets.

## Hors périmètre

- paiement, argent réel, nouveau moteur de combinaison ou modification de corrélation ;
- changement de configuration de récupération par e-mail ;
- nouveau modèle de date ou migration de schéma ;
- notifications de calendrier, synchronisation externe ou Realtime.
