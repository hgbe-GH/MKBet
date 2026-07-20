# MK Bet — Authentification par mot de passe et finition B3

## Statut et objectif

Cette spécification complète la refonte B3 « Halo nocturne » avec un parcours d’accès classique par e-mail et mot de passe. Elle remplace le magic link dans l’interface, conserve Supabase Auth comme autorité et approfondit le langage graphique sur toutes les surfaces publiques et privées déjà incluses dans la refonte.

L’objectif est double : permettre à chacun des sept membres de créer et retrouver son compte sans dépendre d’un lien de connexion, puis livrer une expérience visuelle cohérente, moderne et fluide sans modifier les règles de pari, les migrations métier, les politiques RLS ou le moteur de cotes.

## Décisions produit

- l’adresse e-mail est l’identifiant de connexion ;
- l’inscription est ouverte depuis le site ;
- le pseudonyme est demandé à l’inscription et reste modifiable depuis le compte ;
- le mot de passe contient au moins dix caractères et doit être confirmé à l’inscription et lors de sa réinitialisation ;
- l’adresse e-mail doit être confirmée avant l’accès aux pages privées ;
- le magic link n’est plus proposé dans l’interface ;
- « Mot de passe oublié » remplace le magic link comme parcours de secours ;
- tout compte confirmé rejoint la salle permanente Margot × Kévin et reçoit exactement une fois le crédit initial déjà prévu ;
- les messages publics ne révèlent jamais si une adresse existe, est confirmée ou utilise un autre mode d’accès.

## Architecture d’authentification

### Frontières

Supabase Auth reste responsable des identités, mots de passe, confirmations, sessions et e-mails de récupération. Next.js porte les formulaires, les Server Actions, la validation Zod, les redirections et l’initialisation idempotente de la salle. PostgreSQL reste responsable des profils, membres, rôles et portefeuilles.

Aucun composant client ne reçoit de client administratif, de clé secrète ou de logique d’attribution de rôle. Les composants d’authentification appellent uniquement des Server Actions typées et affichent des états sérialisables sans détail Supabase.

### Routes

- `/login` : portail public unifié avec les modes Connexion et Créer un compte ;
- `/forgot-password` : demande de récupération avec réponse générique ;
- `/auth/callback` : échange du code de confirmation ou de récupération, initialisation du profil et de la salle lorsque nécessaire, puis redirection interne sûre ;
- `/auth/update-password` : choix du nouveau mot de passe sous session de récupération ;
- `/auth/error` : erreur générique et action de reprise ;
- `/logout` : suppression serveur de la session puis retour à `/login`.

Le mode d’inscription de `/login` est adressable par `?mode=register` afin de rester partageable et testable. Toute valeur inconnue revient au mode Connexion. Le paramètre `next` reste limité à un chemin interne.

### Server Actions

Les actions exposées sont :

- `signInWithPassword` : valide e-mail et mot de passe, connecte, garantit le profil et l’accès à la salle, puis redirige vers `next` ;
- `signUpWithPassword` : valide pseudonyme, e-mail, mot de passe et confirmation, crée le compte avec l’URL de callback, puis retourne un état « confirmation requise » ;
- `requestPasswordReset` : envoie un e-mail de récupération et retourne toujours un message générique ;
- `updatePassword` : vérifie la session de récupération, valide les deux champs puis met à jour le mot de passe ;
- `signOut` : invalide la session et redirige.

Les erreurs attendues sont converties en codes stables. Les erreurs Supabase brutes, adresses complètes, mots de passe, codes PKCE et jetons ne sont ni affichés ni journalisés.

### Confirmation et récupération

Le callback distingue uniquement l’intention sûre transmise par l’application. Après une confirmation d’inscription réussie, il appelle les RPC idempotentes existantes `ensure_current_profile` puis `ensure_single_room_access`. Une récupération redirige vers `/auth/update-password` sans réinitialiser les données métier.

Une session créée par connexion classique appelle aussi l’initialisation idempotente afin de réparer automatiquement un profil incomplet sans créditer deux fois le portefeuille.

## Validation des entrées

Les schémas Zod normalisent l’e-mail en minuscules et le pseudonyme en espaces simples. Les contraintes sont :

- e-mail valide, 320 caractères maximum ;
- pseudonyme de 2 à 80 caractères, sans balise HTML ;
- mot de passe de 10 à 128 caractères ;
- confirmation strictement identique ;
- chemin de redirection interne assaini.

La validation côté navigateur améliore le retour immédiat, mais la Server Action répète toujours la validation et reste autoritaire.

## Portail d’accès B3

### Composition

Sur desktop, la page utilise une composition asymétrique en deux plans. Le plan éditorial présente MK Bet, Margot × Kévin, la monnaie fictive et trois repères courts. Le plan fonctionnel contient le formulaire dans un verre plus dense. Une ligne lumineuse oblique relie visuellement les deux zones sans devenir un séparateur rigide.

Sur mobile, le contexte éditorial est réduit à la marque et une phrase. Le formulaire occupe la largeur utile, avec une hiérarchie verticale et aucun décor derrière les champs.

Connexion et inscription partagent la même enveloppe. Deux segments accessibles changent le contenu avec une transition de hauteur maîtrisée et un fondu court. Le mode reste représenté dans l’URL et fonctionne sans animation.

### Champs et actions

Chaque champ utilise un label permanent, un texte d’aide lorsque nécessaire et un état de validation adjacent. Les champs de mot de passe proposent une action accessible Afficher/Masquer sans déplacer la mise en page. Le focus combine bord clair, halo framboise discret et contraste sombre.

Le bouton principal conserve sa largeur et son libellé pendant le chargement ; un indicateur remplace l’icône, pas tout le texte. Les doubles soumissions sont bloquées. Les liens secondaires restent visibles : créer un compte, se connecter, mot de passe oublié et retour à l’accueil.

### États

- inscription envoyée : le formulaire est remplacé par une confirmation claire et l’adresse est masquée ;
- récupération envoyée : même réponse, que le compte existe ou non ;
- mot de passe mis à jour : confirmation puis action de retour à la connexion ;
- identifiants invalides : message générique près du bouton et résumé `aria-live` ;
- configuration absente : état dédié uniquement en développement, sans clé ni nom de variable sensible ;
- session expirée : reprise vers la connexion avec `next` conservé.

## Approfondissement graphique B3

### Profondeur et lumière

Les surfaces sont organisées en quatre niveaux explicites : fond, surface opaque, verre de lecture et verre interactif. Chaque niveau possède une transparence, une bordure et une ombre constantes. Les halos restent attachés aux zones d’action et non au viewport entier. Leur intensité diminue sur mobile et avec contraste renforcé.

Le grain reste statique et généré en CSS. Aucun asset distant, vidéo de fond ou image décorative lourde n’est ajouté. Les photos privées ne sont jamais utilisées comme décoration publique.

### Mouvement

Le système de mouvement utilise trois durées :

- 140–180 ms pour focus, survol et pression ;
- 220–280 ms pour changement de segment, notice et ticket ;
- 320–420 ms pour entrée de page ou panneau mobile.

Les courbes privilégient une sortie rapide et une arrivée douce. Seules `opacity` et `transform` animent les éléments importants. Les changements de hauteur utilisent une enveloppe bornée sans boucle de mesure permanente. `prefers-reduced-motion` supprime translation, parallaxe et halo animé tout en conservant les changements d’état instantanés.

### Micro-interactions

- les cotes sélectionnées gagnent une profondeur interne et une marque, pas seulement une couleur ;
- le vote confirmé produit un reflet bref puis rend l’état final explicite ;
- le ticket glisse depuis son ancrage et conserve le contexte de la sélection ;
- les segments déplacent un indicateur sous-jacent court ;
- les boutons répondent par une translation maximale d’un pixel et une variation d’ombre ;
- les succès importants affichent un trait lumineux unique, sans confettis ni animation continue ;
- les squelettes restent mats et non scintillants en boucle.

### Cohérence des parcours

Le même vocabulaire s’applique au portail public, au shell, au Direct, aux marchés, au ticket, au signalement, aux paris, au classement et au compte. Les pages de données utilisent davantage de surfaces opaques ; les actions courtes utilisent le verre interactif. Les titres, marges, rayons, icônes et états ne sont pas redéfinis localement.

## Accessibilité, performance et sécurité visuelle

- contraste WCAG AA vérifié sur le fond réellement composé ;
- labels persistants, erreurs associées par `aria-describedby` et résumés `aria-live` ;
- ordre de tabulation naturel et focus visible sur chaque contrôle ;
- cibles tactiles de 44 px minimum ;
- aucune information portée uniquement par couleur, flou ou mouvement ;
- aucune validation sensible exécutée uniquement côté client ;
- `backdrop-filter` limité aux petites surfaces, avec fallback graphite opaque ;
- absence de bibliothèque d’animation lourde ;
- absence d’adresse, jeton, URL Storage ou preuve privée dans le HTML public ;
- pas de mise en page dépendante du survol sur mobile.

## Tests et validation

### Vitest et Testing Library

- schémas connexion, inscription, récupération et changement de mot de passe ;
- normalisation, bornes et confirmation identique ;
- paramètres `mode` et `next` sûrs ;
- mapping non énumérant des erreurs ;
- paramètres transmis aux méthodes Supabase ;
- initialisation idempotente après connexion ;
- formulaires, bascule des modes, affichage du mot de passe, états de succès et chargement ;
- structure accessible du portail et absence de secret dans le rendu.

### Playwright

- création d’un compte local, confirmation e-mail, première connexion et accès à `/direct` ;
- déconnexion puis reconnexion par mot de passe ;
- mauvais mot de passe sans fuite d’existence ;
- récupération puis nouveau mot de passe ;
- redirection vers la page initialement demandée ;
- clavier, mobile, absence d’overflow et `prefers-reduced-motion` ;
- parcours métier existants inchangés.

### Livraison

La validation finale exécute format, lint, typecheck, Vitest, reset et scénarios SQL Supabase, Playwright desktop/mobile, axe, build avec Supabase arrêté, installation frozen et scan de secrets. Les migrations historiques et `src/domain/odds` doivent rester inchangés. La Production n’est promue qu’après les migrations déjà présentes, la configuration des URLs de confirmation/récupération et un test manuel de création de compte.

## Hors périmètre

- identifiant public distinct de l’e-mail ;
- connexion sociale, passkey ou authentification multifacteur ;
- rôle choisi par l’utilisateur ;
- modification des règles financières ou des marchés ;
- argent réel, paiement ou retrait ;
- exposition publique des membres ou preuves ;
- bibliothèque de motion, vidéo ou asset décoratif externe.
