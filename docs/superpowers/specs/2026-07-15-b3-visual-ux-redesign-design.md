# MK Bet — Refonte visuelle B3 « Halo nocturne »

## Statut et objectif

Cette spécification définit la refonte UX/UI de MK Bet après validation de la direction **B3 — Halo nocturne**. Elle modernise toutes les surfaces réellement utilisées sans changer les règles métier, les RPC, les migrations, les politiques RLS, le moteur de cotes ou le périmètre Margot × Kévin.

L’objectif est de donner à la salle privée l’énergie d’un sportsbook nocturne et social, tout en conservant une lecture immédiate pour sept proches : voir ce qui attend un vote, comprendre les cotes, déclarer un fait et suivre son ticket sans apprentissage.

## Thèses de conception

### Thèse visuelle

Une salle de marché nocturne en graphite, traversée de halos framboise et de verre fumé. Le produit doit paraître vivant et précis, sans reproduire l’identité, le logo ou la composition de Betclic.

### Thèse d’interaction

Les effets signalent une action ou un changement d’état : reflet au survol, profondeur à la sélection, halo bref après un vote et glissement du ticket. Aucun élément ne pulse en permanence hors indicateur réellement actif. Les animations utilisent seulement `transform` et `opacity`, durent 160 à 320 ms et sont supprimées avec `prefers-reduced-motion`.

### Thèse de contenu

Chaque écran commence par l’information nécessaire pour agir. Le Direct montre les preuves et votes, Marchés montre les cotes, Déclarer montre la progression du formulaire, Ticket montre la mise et l’état financier, Classement montre la position. Les explications techniques restent secondaires et repliées ou raccourcies.

## Système visuel

### Couleurs

- fond principal `#08080B`, jamais noir pur ;
- fond secondaire `#111116` ;
- texte principal `#FAF7F5` ;
- texte secondaire `#B8AFB3` ;
- accent unique framboise `#FF3453` ;
- accent renforcé `#FF5A72` pour focus et variations actives ;
- positif `#42C77A`, négatif `#FF5D67`, avertissement `#F4B860` ;
- bord de verre `rgba(255,255,255,0.14)`.

Le violet n’est pas une deuxième couleur d’action. Il apparaît uniquement dans un halo d’arrière-plan à faible opacité. Les statuts restent accompagnés d’un libellé ou d’une icône ; la couleur ne porte jamais seule le sens.

### Surfaces et profondeur

Le fond combine deux gradients radiaux et un grain CSS/SVG très léger. Le glassmorphism est réservé au header compact, aux événements, aux cotes, au ticket, aux filtres et aux états système. Une surface de verre utilise :

- un fond blanc entre 5 et 12 % ;
- un flou de 18 à 24 px ;
- une bordure externe translucide ;
- un reflet interne supérieur d’un pixel ;
- une ombre teintée et diffuse cohérente avec la lumière haute droite.

Les longs textes et tableaux ne sont jamais placés sur un verre très transparent. Ils utilisent une surface graphite opaque afin de garantir le contraste et limiter le coût graphique.

### Typographie

Le système utilise une fonte sans-serif locale ou système sans requête externe au runtime. La hiérarchie privilégie des titres très gras, compacts et équilibrés ; les nombres utilisent des chiffres tabulaires. Le mot ou chiffre actif peut recevoir l’accent framboise, mais aucun titre n’utilise de dégradé de texte.

Échelle cible :

- titre de page : `clamp(2.35rem, 6vw, 4.75rem)`, interligne 0,92–0,98 ;
- titre de section : 1,4–1,8 rem ;
- texte courant : 0,95–1 rem, interligne 1,55 ;
- métadonnées : 0,75–0,82 rem ;
- cotes et soldes : graisse 800–900, chiffres tabulaires.

## Shell et navigation

### Desktop

Le shell conserve trois zones lisibles : navigation étroite, espace principal et ticket contextuel. La sidebar descend à environ 13 rem et abandonne le grand encart explicatif. Le logo, le nom de la salle et six liens suffisent. La voie active combine fond de verre, reflet, icône et marque verticale framboise.

Le header devient une ligne compacte dans l’espace principal : statut de la salle, solde, accès au compte. La déconnexion quitte le header principal et reste dans Compte, afin de réduire le bruit.

Le ticket reste fixe à droite sur les grands écrans. Vide, il explique en une phrase comment commencer. Rempli, il devient la principale surface transactionnelle et affiche sélection, mise, devis, expiration et confirmation dans cet ordre.

### Mobile

Le contenu utilise toute la largeur utile, avec un padding de 16 px. Le header présente logo, solde et compte. La navigation basse flottante contient exactement cinq entrées : Direct, Marchés, Déclarer, Ticket, Classement. Déclarer reçoit un traitement central plus visible sans devenir un bouton circulaire surdimensionné.

Le ticket mobile reste un panneau remontant depuis le bas. Son résumé compact ne masque jamais la navigation ni le bouton principal d’un formulaire. Les safe areas iOS et une largeur minimale de 320 px sont conservées.

## Architecture UX des écrans

### Accueil public et connexion

L’accueil devient une affiche nocturne simple : marque, « Margot × Kévin », promesse courte, mention monnaie fictive et CTA de connexion. Aucun chiffre privé ni photo personnelle n’est rendu publiquement.

La connexion reprend la même ambiance dans une composition en deux plans : contexte de la salle à gauche sur desktop, formulaire en verre à droite. Sur mobile, seul le formulaire et une courte phrase restent visibles. Après envoi, le succès remplace le formulaire par un état clair indiquant de consulter sa boîte mail. L’erreur d’authentification utilise le même shell visuel et ne révèle ni adresse, ni jeton, ni détail Supabase.

### Direct

Le haut de page rassemble : nom de la salle, compteur de faits à vérifier et bouton Déclarer. Les filtres deviennent trois segments compacts avec compteurs.

Un rapport est structuré ainsi :

1. statut et progression du vote ;
2. preuve principale avec ratio stable ;
3. type, auteur, heure réelle et note ;
4. marché suspendu éventuel ;
5. actions Valider et Invalider ;
6. détail nominatif des votes, secondaire mais accessible.

Sur desktop, une preuve unique peut se placer à gauche du texte. Plusieurs preuves utilisent une grille ou un rail horizontal. Sur mobile, la preuve précède le texte. Les rapports confirmés et invalidés réduisent leur emphase ; seuls les rapports en attente reçoivent un halo actif.

### Marchés et détail

Avec seulement deux marchés initiaux, les filtres lourds disparaissent de la vue par défaut. Une barre compacte permet de rechercher et d’afficher les statuts uniquement si nécessaire.

Chaque marché affiche titre, état, échéance et deux grandes cotes. La cote est la zone cliquable principale. Une sélection crée un enfoncement visuel, un reflet et un retour `aria-pressed`. Un marché suspendu réduit le contraste, affiche un cadenas et explique la cause sans masquer les anciennes cotes.

La fiche marché place le choix des cotes avant l’historique. Le graphique SVG est conservé mais reçoit une ligne lumineuse, des points contrastés et une liste textuelle toujours disponible. La règle de règlement utilise une surface opaque et un langage plus direct.

### Déclarer

Le formulaire devient un parcours vertical en quatre blocs numérotés : événement, moment, marché éventuel, preuves. Aucun assistant multi-page n’est introduit ; les données restent visibles avant la confirmation.

Le dépôt de photos affiche une zone claire, le nombre de fichiers, les miniatures locales et les limites. Le bouton final récapitule l’effet : « Envoyer au vote ». Pendant l’envoi, une progression textuelle remplace le libellé et l’action ne peut pas être déclenchée deux fois. Les erreurs restent près du bloc concerné, avec un résumé `aria-live` en fin de formulaire.

### Mon ticket et mes paris

Le ticket de composition distingue trois étapes visibles : sélection, vérification du devis, placement. Le compte à rebours du devis est perceptible mais ne clignote pas. Un changement de cote compare ancienne et nouvelle valeur dans un encart d’avertissement puis exige une nouvelle confirmation.

La page Mes paris regroupe les tickets par Ouverts et Réglés. Chaque ticket expose d’abord statut, mise, cote figée et retour potentiel/réel. Les jambes sont une liste sobre. Un ticket gagné reçoit un accent positif ; perdu ou remboursé reste lisible sans animation festive excessive.

### Classement

Le podium des trois premiers remplace la simple table en tête de page, avec pseudo, rang et capital. Les autres membres restent dans une liste compacte. Sur mobile, aucune table horizontale n’est imposée. Les agrégats sensibles restent conformes au contrat existant : aucun détail de transaction d’un autre joueur.

### Compte et états système

Compte affiche avatar, pseudonyme, email et déconnexion dans une seule colonne. L’email reste secondaire et n’apparaît dans aucun titre ou métadonnée publique de page.

Chargement utilise des squelettes aux formes des composants finaux. Vide propose une action utile. Erreur explique l’action possible sans détail technique. Les écrans 404, erreur globale et auth/error partagent une même composition compacte.

## Composants et frontières techniques

La refonte conserve App Router, Server Components, Server Actions, le contexte local du ticket et les repositories Supabase existants. Les composants de données ne changent pas leurs contrats sauf ajout de données de présentation déjà disponibles.

Composants transverses proposés :

- `GlassSurface` pour les variantes `subtle`, `interactive` et `opaque` ;
- `PageIntro` pour titre, contexte et action principale ;
- `SegmentedFilter` pour les filtres de Direct, Marchés et Tickets ;
- `Metric` pour solde, rang et compteurs ;
- `PrivateMediaGrid` pour les preuves ;
- `InlineNotice` pour succès, avertissement et erreur ;
- `AppIcon` ou wrappers cohérents autour des icônes existantes.

Les surfaces restent composables ; elles n’acceptent pas une accumulation de booléens de style. Aucun composant métier ne lit directement Supabase. Aucun état transactionnel n’est simulé dans le visuel.

## Accessibilité et performance

- contraste WCAG AA sur chaque surface, vérifié sur le fond réel après flou ;
- focus visible de 2 à 3 px, framboise avec contour sombre ;
- cibles tactiles d’au moins 44 px ;
- landmarks, titres et `aria-current` conservés ;
- `aria-live` sur votes, ticket, upload et erreurs ;
- navigation et placement de pari utilisables au clavier ;
- aucune information portée uniquement par la couleur ou le mouvement ;
- `prefers-reduced-motion` neutralise halos animés, entrées et translations ;
- grain statique, gradients CSS et aucun asset externe ;
- `backdrop-filter` limité aux petites surfaces et fallback opaque si non supporté ;
- aucun secret, email, URL Storage ou photo privée dans le HTML public.

## Stratégie de livraison

La refonte sera découpée en lots vérifiables :

1. tokens CSS, primitives de verre et états interactifs ;
2. shell desktop/mobile et navigation ;
3. Direct et rapports ;
4. Marchés, cotes et ticket ;
5. Déclarer, Mes paris, Classement et Compte ;
6. accueil, connexion et états système ;
7. audit responsive, accessibilité, captures visuelles et promotion Production.

Chaque lot conserve les tests métier existants et ajoute des tests structurels ciblés. La validation finale comprend format, lint, typecheck, Vitest, Playwright desktop/mobile, axe, build hors Supabase actif, installation frozen, scan de secrets et comparaison visuelle. Les migrations et `src/domain/odds` doivent rester inchangés.

## Hors périmètre

- nouvelle règle de pari, nouveau marché ou nouvelle monnaie ;
- Realtime, notifications push ou chat ;
- nouvelle migration Supabase ;
- exposition publique des photos ;
- librairie d’animation lourde ou bibliothèque de graphiques ;
- mode clair et sélecteur de thème dans cette tranche ;
- copie de composants, logo ou assets Betclic.
