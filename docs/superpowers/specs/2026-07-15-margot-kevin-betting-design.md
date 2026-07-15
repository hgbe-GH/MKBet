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

### Écrans et comportements attendus

| Écran | But | Actions disponibles |
| --- | --- | --- |
| `Direct` | Prioriser ce qui doit être prouvé et voté. | Lire les rapports, ouvrir leurs preuves, voter, voir les marchés suspendus ou la décision finale. |
| `Marchés` | Placer des pronostics MKB sur les marchés ouverts. | Filtrer, ajouter une issue au ticket, demander un devis puis confirmer le pari. |
| `Déclarer` | Enregistrer un fait avant toute décision financière. | Choisir le type, l’heure réelle, une note, les preuves et, si nécessaire, le marché et l’issue concernés. |
| `Mon ticket` | Suivre les tickets personnels et leur état. | Lire les cotes figées, les jambes, les gains/pertes/remboursements et les motifs de décision. |
| `Classement` | Rendre le jeu lisible sans exposer les détails privés. | Lire le pseudonyme, le solde MKB, les tickets joués et les gains agrégés. |
| `Compte` | Gérer uniquement son identité d’affichage et sa session. | Modifier le pseudo/l’avatar, se déconnecter. |

La vue `Direct` utilise trois états clairement distincts : `À vérifier`, `Confirmé` et `Invalidé`. Les rapports à vérifier sont triés en premier. Une carte affiche la date réelle, l’auteur, les preuves, le marché éventuellement suspendu, le décompte des votes et la seule action pertinente pour le lecteur.

Sur mobile, la barre basse ne contient que `Direct`, `Marchés`, `Déclarer`, `Ticket` et `Classement`; le compte reste dans l’en-tête. La page `Déclarer` est toujours accessible mais ne crée aucune donnée avant une confirmation explicite du formulaire.

### Groupe unique et comptes

Une seule salle persistante, nommée **Margot × Kévin**, est utilisée. Elle s’appuie sur la structure de saison existante pour conserver les contraintes financières et RLS déjà testées.

- La migration crée cette salle de façon idempotente et inscrit les profils existants.
- Le trigger de création de profil inscrit chaque nouveau compte à cette salle avec le rôle `PLAYER` et un portefeuille initial de **1 000 MKB**.
- Les utilisateurs authentifiés peuvent lire les marchés, tickets publics utiles au classement, les rapports `PENDING`, `CONFIRMED` et `REJECTED`, ainsi que les preuves associées tant que le rapport reste visible dans le fil.
- Aucune personne non connectée ne peut lire une preuve, un événement ou un portefeuille.

Les photos ne sont publiées que par une personne autorisée à les partager. Elles restent privées même si les inscriptions sont ouvertes.

Les droits sont volontairement simples : il n’existe pas de rôle de modération dans l’interface. L’auteur peut soumettre, tout autre compte connecté peut voter une seule fois, et personne ne modifie directement le statut, les votes, les transactions ou l’audit.

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

### Événements acceptés

La première version se limite aux faits nécessaires aux éléments déjà fournis et aux marchés existants :

- `FRIENDLY_MEETING` — réunion amicale ;
- `AFFECTIONATE_GESTURE` — geste affectueux ;
- `KISS` — baiser ;
- `DIPLOMATIC_INCIDENT` — incident diplomatique ;
- `OFFICIAL_RELATIONSHIP` — retour officiel explicite.

Chaque rapport présente le type sélectionné au lieu de déduire un fait depuis une photo. Une photo est une preuve, pas une classification automatique. Le formulaire empêche une date future, exige une date UTC explicite et limite la note à 500 caractères.

### Vote et anti-abus

- Un rapport reçoit au maximum un vote immuable par compte ; il n’est ni remplacé ni supprimé.
- L’auteur ne peut pas voter. La base applique cette interdiction, pas seulement le client.
- Les deux premiers votes identiques qui atteignent le seuil ferment définitivement le rapport.
- Un rapport fermé ne reçoit plus de vote, ne se modifie plus et ne peut pas être réglé une seconde fois.
- Les votes affichent leur résultat et leur auteur dans le groupe connecté afin que la décision soit intelligible et contestable socialement, sans exposer d’e-mail ni de jeton.
- Si une preuve est manifestement inappropriée, le rapport peut être rejeté par deux comptes : elle n’apparaît alors plus dans les vues normales, tout en restant conservée de façon privée et auditée pour éviter une modification silencieuse de l’historique.

### Effet sur les marchés et les tickets

Un rapport peut être purement informatif. Dans ce cas, son vote enrichit le fil mais ne suspend ni ne règle de marché.

Lorsqu’un marché et une issue sont choisis, la liaison est vérifiée côté PostgreSQL : le marché doit appartenir à la salle unique, être `OPEN`, l’issue doit appartenir à ce marché et la sélection doit être cohérente avec le type d’événement. Cette règle interdit de déclarer un baiser pour régler arbitrairement un marché sans rapport.

Après deux validations :

1. l’issue est figée ;
2. les jambes de chaque ticket sont déterminées ;
3. un ticket simple gagnant est crédité à sa cote figée, un ticket perdant ne reçoit rien ;
4. pour un combiné, une jambe perdante rend le ticket perdant, les tickets dont une jambe reste ouverte attendent, et un combiné dont toutes les jambes sont annulées rembourse la mise ;
5. chaque crédit, remboursement et règlement dispose d’une clé d’idempotence et d’une transaction immuable.

Après deux refus, le marché retrouve son état `OPEN` à la dernière version de cote disponible. Les tickets posés avant la suspension restent valides et inchangés ; aucun rapport rejeté ne peut déduire ou créditer du MKB.

## Données et sécurité

Une migration forward-only ajoute les objets minimaux suivants :

- enums `event_report_status` (`PENDING`, `CONFIRMED`, `REJECTED`) et `event_report_type` (les cinq faits listés ci-dessus) ;
- `event_reports` : auteur, fait déclaré, date réelle, note, statut, marché et issue optionnels, identifiant d’idempotence ;
- `event_report_votes` : un vote unique par rapport et par utilisateur, avec contrainte empêchant l’auto-vote ;
- `event_market_outcome_rules` : la liste versionnée des couples type d’événement / template de marché / issue autorisés ;
- relation entre un rapport et les `media_assets` privés existants ;
- RPC `submit_event_report` et `vote_event_report`, qui appliquent les permissions, les transitions et l’audit dans PostgreSQL ;
- primitive de règlement idempotente pour une issue de marché et ses tickets.

Les rapports utilisent un identifiant UUID fourni par le serveur RPC, mais le client transmet une clé d’idempotence aléatoire. Une double soumission renvoie exactement le même rapport et ne crée ni deuxième photo référencée, ni deuxième suspension. Le vote est également idempotent grâce à l’unicité `(report_id, user_id)`.

Les migrations restent forward-only. Elles ne réécrivent pas les tickets, cotes, portefeuilles ou journaux existants. Le moteur déterministe TypeScript est conservé ; aucun calcul de cote n’est fait dans React ou dans une Server Action.

Les photos suivent le flux existant : validation JPEG/PNG/WebP, maximum 10 Mo, rotation et suppression EXIF, conversion WebP 1600 px, bucket `season-media` privé et diffusion exclusivement par le Route Handler authentifié. L’upload rattache la preuve au rapport créé ; en cas d’échec de la base, le blob est supprimé.

RLS est modifiée de manière ciblée : tout utilisateur `authenticated` membre automatique de la salle peut créer un rapport, voter un rapport d’autrui et lire les éléments nécessaires. Une preuve reliée à un rapport visible est lisible par les mêmes comptes, y compris durant le vote `PENDING`; une preuve d’un rapport rejeté quitte le fil normal. Les écritures financières, de règlement et d’audit restent exclusivement accessibles via RPC sécurisées.

Les règles suivantes sont non négociables :

- aucune clé de service n’est envoyée au navigateur ;
- aucune URL Storage ou signée n’est rendue dans le HTML ;
- la route média retourne le même `404` pour une absence, un refus RLS ou un identifiant invalide ;
- les pièces jointes rejetées ou en attente ne sont jamais cachées seulement par CSS : leur accès Storage et leur lecture SQL sont protégés par RLS ;
- tous les RPC `SECURITY DEFINER` ont `search_path = ''`, révoquent `PUBLIC` et valident `auth.uid()`.

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

## Organisation de livraison

Le chantier est découpé en quatre tranches livrables. Chaque tranche garde l’application déployable et testée.

1. **Fondation de salle unique** — création/backfill de la salle Margot × Kévin, rattachement automatique des nouveaux comptes, portefeuille initial, navigation réduite et redirection de compatibilité vers `Direct`.
2. **Rapports et preuves** — nouveaux schémas Zod, upload privé relié à un rapport, liste `Direct`, RLS et idempotence des signalements.
3. **Vote et effet de marché** — votes immuables, seuil 2-pour/2-contre, suspension/réouverture, audit et interface de décision.
4. **Règlement complet** — détermination atomique des jambes/tickets, gains ou remboursements MKB, lecture de tickets et E2E multi-comptes.

Après chaque tranche : formatage, lint, TypeScript, Vitest, reset/lint/scénarios SQL Supabase, E2E Chromium pertinent, build sans Supabase actif, installation frozen et scan de secrets. Les migrations et le moteur de cotes reçoivent un contrôle de diff explicite.

## Vérification attendue

- Tests unitaires des schémas, des règles de vote, des transitions et de l’idempotence.
- Tests SQL/RLS : inscription automatique, interdiction d’auto-vote, second vote identique, seuils, suspension, réouverture et règlement financier sans double crédit.
- E2E Chromium : inscription, crédit MKB, pari, rapport avec photo, confirmation par deux comptes, règlement du ticket, rapport rejeté et accès non authentifié refusé aux médias.
- `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, reset/lint/tests SQL Supabase, E2E, build hors Supabase, installation frozen et scan de secrets.

### Critères d’acceptation

- Un nouveau compte confirmé arrive directement dans `Direct`, avec un portefeuille de 1 000 MKB, sans invitation ni choix de saison.
- Un utilisateur connecté déclare un `KISS` avec une photo ; le rapport et sa preuve sont privés mais lisibles par les autres comptes connectés.
- L’auteur ne peut pas voter ; deux autres utilisateurs valident et déclenchent exactement un règlement si un marché était relié.
- Deux refus ferment un rapport, masquent sa preuve des vues normales, rouvrent le marché et ne modifient aucune transaction antérieure.
- Une requête non authentifiée vers une preuve reçoit `404`; l’HTML et les logs n’exposent ni URL Storage, ni jeton, ni secret.
- Deux requêtes simultanées de soumission ou de vote ne créent pas de doublon, de double suspension ni de double crédit.
