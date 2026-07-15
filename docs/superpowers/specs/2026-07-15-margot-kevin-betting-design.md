# MK Bet — Réduction au jeu Margot × Kévin

## Objectif

Transformer MK Bet en une seule application privée de pronostics fictifs sur Margot et Kévin. Le produit ne garde que les marchés, les tickets MKB, le fil d’événements prouvés par photo et le vote collectif qui confirme ou invalide ces événements.

Tous les comptes qui terminent la connexion par magic link peuvent participer. Aucun argent réel, paiement, URL publique de média ou accès non authentifié n’est autorisé.

## Périmètre fonctionnel

### Navigation et interface

La page protégée principale suit la direction visuelle **B — Fil en direct** : les faits en attente de vérification sont prioritaires, avec les marchés accessibles sans changer de contexte.

La navigation ne conserve que :

- `Direct` : fil des événements, preuves et votes ;
- `Marchés` : cotes ouvertes et sélections ;
- `Déclarer` : formulaire de signalement ;
- `Mon ticket` : paris et leur état ;
- `Classement` : solde MKB et gains fictifs ;
- `Compte` : profil et déconnexion.

Les pages et liens de saisons, invitations, lives, administration, médias séparés, résultats de démonstration et chronologie de démonstration sont retirés du parcours et de la navigation. Ils ne doivent plus constituer une voie d’accès utilisateur.

### Groupe unique et comptes

Une seule salle persistante, nommée **Margot × Kévin**, est utilisée. Elle s’appuie sur la structure de saison existante pour conserver les contraintes financières et RLS déjà testées.

- La migration crée cette salle de façon idempotente et inscrit les profils existants.
- Le trigger de création de profil inscrit chaque nouveau compte à cette salle avec le rôle `PLAYER` et un portefeuille initial de **1 000 MKB**.
- Les utilisateurs authentifiés peuvent lire les marchés, tickets publics utiles au classement, événements confirmés et preuves privées de cette salle.
- Aucune personne non connectée ne peut lire une preuve, un événement ou un portefeuille.

Les photos ne sont publiées que par une personne autorisée à les partager. Elles restent privées même si les inscriptions sont ouvertes.

### Marchés et tickets

Les marchés pertinents sont initialisés pour la salle unique à partir des templates déjà versionnés ; aucune console d’administration ni création libre de marché n’est montrée. Les cotes, devis de 60 secondes, mises MKB, jambes figées et protections contre le double débit sont conservés.

Un signalement peut référencer au plus un marché ouvert et, lorsqu’il le fait, une issue explicite de ce marché. Ce choix est visible avant le vote ; il évite d’inférer une décision financière depuis une photo ou un texte.

## Cycle de preuve et décision

1. Un compte connecté soumet un événement : type, date réelle UTC, texte bref, marché/issue optionnels et zéro ou plusieurs photos.
2. Le rapport est `PENDING`. Si un marché est référencé, il passe immédiatement à `SUSPENDED`; aucun nouveau ticket ne peut alors être placé dessus.
3. Chaque compte peut voter une fois `CONFIRM` ou `REJECT`, à l’exception de l’auteur du rapport.
4. Deux votes `CONFIRM` distincts rendent le rapport `CONFIRMED`. Si une issue était liée, l’issue est réglée atomiquement ; les jambes sont évaluées et chaque ticket est payé, perdu ou remboursé exactement une fois.
5. Deux votes `REJECT` rendent le rapport `REJECTED`. Le marché suspendu est rouvert avec sa dernière version de cotes ; aucun ticket antérieur n’est modifié.
6. Sans décision, le rapport reste visible comme `EN ATTENTE` et le marché reste suspendu. Aucun minuteur implicite ni décision automatique n’existe.

Les votes, la suspension, le règlement, les crédits MKB et les changements de statut produisent des écritures d’audit. Les données historiques restent immuables ; une correction ultérieure est toujours une nouvelle opération auditable.

## Données et sécurité

Une migration forward-only ajoute les objets minimaux suivants :

- `event_reports` : auteur, fait déclaré, date réelle, note, statut, marché et issue optionnels, identifiant d’idempotence ;
- `event_report_votes` : un vote unique par rapport et par utilisateur, avec contrainte empêchant l’auto-vote ;
- relation entre un rapport et les `media_assets` privés existants ;
- RPC `submit_event_report` et `vote_event_report`, qui appliquent les permissions, les transitions et l’audit dans PostgreSQL ;
- primitive de règlement idempotente pour une issue de marché et ses tickets.

Les photos suivent le flux existant : validation JPEG/PNG/WebP, maximum 10 Mo, rotation et suppression EXIF, conversion WebP 1600 px, bucket `season-media` privé et diffusion exclusivement par le Route Handler authentifié. L’upload rattache la preuve au rapport créé ; en cas d’échec de la base, le blob est supprimé.

RLS est modifiée de manière ciblée : tout utilisateur `authenticated` membre automatique de la salle peut créer un rapport, voter un rapport d’autrui et lire les éléments nécessaires. Les écritures financières, de règlement et d’audit restent exclusivement accessibles via RPC sécurisées.

## Décisions de produit

- Le seuil de décision est fixe : **2 validations** pour confirmer, **2 refus** pour invalider.
- L’auteur ne peut pas voter son propre rapport.
- Le rapport cible explicitement un marché et une issue, ou aucun marché. Les votes ne choisissent pas d’issue à sa place.
- Une invalidation annule seulement le rapport : elle ne retire ni ne modifie les tickets déjà placés.
- Les preuves sont visibles à tout compte connecté, mais ne sont jamais publiques, signées ou rendues dans le HTML.
- Aucun rôle administrateur n’est requis dans l’interface utilisateur. Les anciennes données et rôles ne sont pas supprimés rétroactivement.

## Hors périmètre

- Saisons multiples, invitations et sélecteur de saison ;
- lives, check-ins et actions live ;
- catalogue de médias indépendant ;
- Realtime, notifications push et chat ;
- déclarations de résultats manuelles hors rapport voté ;
- argent réel, paiement, cash-out, pari hors MKB ;
- moteur de cotes modifié ou nouvelles catégories de marché non justifiées par les templates existants.

## Vérification attendue

- Tests unitaires des schémas, des règles de vote, des transitions et de l’idempotence.
- Tests SQL/RLS : inscription automatique, interdiction d’auto-vote, second vote identique, seuils, suspension, réouverture et règlement financier sans double crédit.
- E2E Chromium : inscription, crédit MKB, pari, rapport avec photo, confirmation par deux comptes, règlement du ticket, rapport rejeté et accès non authentifié refusé aux médias.
- `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, reset/lint/tests SQL Supabase, E2E, build hors Supabase, installation frozen et scan de secrets.
