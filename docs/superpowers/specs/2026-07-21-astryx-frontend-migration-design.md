# MK Bet — Migration complète du front vers Astryx

## Statut et objectif

Cette spécification remplace le langage visuel B3 « Halo nocturne » par un front entièrement fondé sur [Astryx](https://github.com/facebook/astryx), avec le thème **Neutral sombre**. Elle couvre toutes les surfaces publiques, d’authentification, privées et administratives de MK Bet.

L’objectif est de rendre l’application plus claire, plus professionnelle et plus facile à utiliser pour son groupe fermé de sept personnes. Cette migration ne change aucune règle métier : Supabase, les RPC, la RLS, le stockage privé, les règles financières, les migrations et le moteur de cotes restent les autorités existantes.

## Décisions verrouillées

- utiliser `@astryxdesign/core` et `@astryxdesign/theme-neutral` en version exacte `0.1.7` ;
- ajouter la dépendance pair `@stylexjs/stylex` en version exacte `0.19.0` ;
- utiliser le thème Neutral en mode sombre unique ;
- remplacer le système visuel B3 au lieu de maintenir deux systèmes concurrents ;
- conserver Tailwind CSS uniquement pour la composition responsive et les espacements non couverts par Astryx ;
- ne pas copier, modifier ou « swizzler » les composants Astryx pendant la migration initiale ;
- conserver les Server Components, Server Actions, repositories et contrats métier existants ;
- ne modifier ni les migrations Supabase historiques, ni `src/domain/odds` ;
- ne pas introduire de bibliothèque de motion, de charts ou de second kit de composants.

Astryx étant publié en bêta, les versions ne doivent pas utiliser de plage semver. Toute montée de version ultérieure fera l’objet d’une validation dédiée.

## Architecture du système d’interface

### Fondation

La feuille globale respecte l’ordre de couches recommandé par Astryx avec Next.js et Tailwind : reset, thème, base Astryx, thème Astryx, composants, puis utilitaires Tailwind. Les tokens Neutral deviennent la source de vérité pour les fonds, surfaces, textes, bordures, états et focus.

Un provider client minimal est monté près de la racine et ne reçoit que les responsabilités nécessaires :

- `Theme` avec `neutralTheme` ;
- `LinkProvider` adapté à `next/link` ;
- les providers déjà nécessaires au ticket local ou aux notifications.

Ce provider reste une feuille client. Les layouts, pages et lectures Supabase demeurent des Server Components lorsque leur comportement ne nécessite pas le navigateur.

### Répartition des responsabilités

- **Astryx** : contrôles, surfaces, navigation, typographie, focus, feedback et composants interactifs génériques ;
- **Tailwind** : grille, flex, largeur, ordre responsive, espacements structurels et utilitaires ponctuels ;
- **composants MK Bet** : composition métier, libellés français et adaptation de modèles sérialisables ;
- **repositories et application** : accès aux données, validation et orchestration existants ;
- **domaine** : règles de cote et invariants métier inchangés.

Un composant MK Bet ne doit pas reproduire en CSS une primitive déjà fournie par Astryx. Un wrapper est accepté uniquement lorsqu’il exprime un contrat métier stable, par exemple une sélection de cote ou un résumé de ticket.

### Primitives Astryx retenues

La migration s’appuie prioritairement sur les composants réellement présents dans Astryx 0.1.7 :

- structure : `Layout`, `TopNav`, `SideNav`, `MobileNav`, `NavMenu`, `NavItem`, `Breadcrumbs`, `Toolbar` ;
- contenu : `Card`, `Text`, `List`, `MetadataList`, `Table`, `Badge`, `Avatar`, `AvatarGroup`, `Timestamp` ;
- saisie : `TextInput`, `TextArea`, `DateInput`, `DateTimeInput`, `CheckboxInput`, `RadioList`, `Selector`, `FormLayout` ;
- action : `Button`, `IconButton`, `ButtonGroup`, `SegmentedControl`, `TabList`, `DropdownMenu` ;
- feedback : `Toast`, `Dialog`, `AlertDialog`, `Popover`, `Tooltip`, `ProgressBar`, `Skeleton`, `EmptyState` ;
- sélection métier : `SelectableCard` lorsque son comportement correspond au besoin.

Les icônes Astryx sont préférées lorsqu’elles couvrent le besoin. `lucide-react` reste temporairement disponible uniquement pour les icônes sans équivalent, puis sera supprimé si l’inventaire final ne révèle plus aucun consommateur.

## Information architecture

### Navigation principale

La navigation privée est limitée à cinq destinations compréhensibles :

1. **Aujourd’hui** — synthèse personnelle et actions prioritaires ;
2. **Marchés** — consultation des marchés et sélection de cotes ;
3. **Déclarer** — déclaration d’un événement et ajout de preuves ;
4. **Mes paris** — ticket en cours, paris ouverts et résultats ;
5. **Classement** — rang et portefeuille fictif.

Sur desktop, ces destinations utilisent `SideNav`. Sur mobile, elles utilisent `MobileNav`. L’état actif combine `aria-current`, libellé, icône et traitement de surface ; il ne dépend jamais uniquement de la couleur.

Le compte, la saison courante, la déconnexion et l’accès administratif se trouvent dans le header ou le menu de profil. L’entrée Administration est visible uniquement pour les rôles déjà autorisés. Les pages secondaires comme Lives, Chronologie et Résultats restent accessibles depuis les écrans où elles ont du sens, sans encombrer la navigation primaire.

### Tableau de bord « Aujourd’hui »

`/direct` devient le cockpit quotidien et remplace l’accumulation de cartes équivalentes. L’ordre est fixe :

1. contexte de saison, solde MKB et rang personnel ;
2. actions prioritaires, notamment validations ou déclarations en attente ;
3. au maximum deux marchés actifs avec accès à la liste complète ;
4. validations en attente avec preuve privée lorsque l’utilisateur y a accès ;
5. activité récente de la saison.

Une information déjà visible dans le header n’est pas répétée dans plusieurs cartes. En l’absence d’action, `EmptyState` propose une destination utile au lieu d’afficher un panneau décoratif.

## Conception des parcours

### Accueil public et authentification

L’accueil public reste sobre et ne révèle aucune donnée privée. Il présente la marque, Margot × Kévin, le caractère fictif de la monnaie et un appel à se connecter.

Les routes `/login`, `/forgot-password`, `/auth/update-password` et `/auth/error` partagent une enveloppe Astryx commune. Les formulaires utilisent `FormLayout`, `TextInput`, `Button`, `SegmentedControl` et les composants de feedback Astryx. Les labels restent visibles, les erreurs sont associées aux champs et les réponses de récupération ou d’inscription demeurent non énumérantes.

Le remplacement visuel ne modifie pas la connexion par e-mail et mot de passe, la confirmation, la récupération, les redirections internes sûres ou l’initialisation idempotente de la salle.

### Marchés et ticket

La liste des marchés privilégie la lecture du titre, du statut, de l’échéance et des issues. Les filtres utilisent `SegmentedControl`, `TextInput` ou `Selector` selon la densité. Une cote reste un vrai bouton accessible avec `aria-pressed`, le libellé complet et la version de cote attendue.

Le composant métier `OddsSelection` compose les primitives Astryx sans recalculer la cote. Il représente explicitement les états normal, sélectionné, suspendu, fermé et modifié. Un changement de cote affiche ancienne et nouvelle valeurs et nécessite toujours une confirmation conforme au flux transactionnel existant.

Le ticket conserve ses deux étapes réelles, son expiration, la mise entière minimale et la protection contre les doubles clics. Sur desktop, il est placé dans un panneau secondaire stable. Sur mobile, il s’ouvre dans un `Dialog` Astryx déclenché par un résumé persistant placé au-dessus de la navigation, sans perdre la sélection.

### Déclaration, preuves et validations

Le parcours Déclarer reste un formulaire continu, découpé visuellement par `FormLayout` et des titres explicites : type d’événement, moment réel, personnes concernées, description et preuves. L’heure réelle reste distincte de l’heure de déclaration.

L’ajout de preuves conserve le stockage privé, la conversion WebP et les limites existantes. Les prévisualisations locales et leur progression sont affichées sans rendre d’URL Storage publique ou signée dans le HTML.

Les rapports à valider donnent la priorité à la preuve, au fait allégué et à l’état des confirmations. Les actions Valider et Invalider sont distinctes, confirmées lorsque nécessaire et accompagnées d’un retour `Toast`. La confidentialité métier détermine toujours qui peut voir le rapport ou le média.

### Paris, résultats et classement

Mes paris utilise `TabList` pour distinguer ouverts et réglés. Chaque pari expose d’abord son état, sa mise, sa cote figée et son retour. Les jambes viennent ensuite dans une liste compacte. Aucun résultat visuel ne modifie les données historiques.

Le classement utilise une composition responsive : mise en avant sobre des trois premiers puis liste des autres membres. Une `Table` n’est utilisée que si elle reste lisible ; sur petit écran, les lignes deviennent une liste structurée. Les autres joueurs ne voient aucune transaction privée qui n’est pas déjà autorisée par la RLS.

### Lives, chronologie et administration

Les lives réels utilisent les mêmes états Supabase et aucun contenu fictif. Liste, détail, participants, marchés liés et Rechutomètre sont présentés par des composants Astryx. Les transitions opérationnelles non implémentées restent absentes, et non simulées par des boutons décoratifs.

L’administration est organisée par ressources : saison, membres, marchés, lives, médias et audit. `SideNav`, `Table`, `DropdownMenu`, `Dialog` et `AlertDialog` fournissent les interactions génériques. Les actions destructives ou irréversibles demandent une confirmation explicite. La visibilité des commandes ne remplace jamais les vérifications serveur et RLS.

## États, erreurs et mouvement

Chaque page possède quatre états explicites : chargement, vide, erreur et contenu. Les squelettes reprennent la géométrie finale. Les erreurs proposent une action concrète et ne révèlent ni requête Supabase, ni adresse complète, ni jeton, ni nom de secret.

Les notifications éphémères utilisent `Toast`, mais une erreur de formulaire reste également visible près du contrôle concerné. Les confirmations sensibles utilisent `AlertDialog`. Les contenus essentiels ne disparaissent pas automatiquement.

Le mouvement reste fonctionnel : ouverture de navigation, apparition d’un toast, changement de sélection et ouverture du ticket. Les durées et courbes Astryx sont conservées. Les animations décoratives B3, halos, grain et glassmorphism personnalisé sont supprimés. `prefers-reduced-motion` est respecté sans exception.

## Suppression de l’ancien système B3

La migration se termine par la suppression des primitives exclusivement visuelles devenues inutiles, notamment `GlassSurface`, les variantes de halo, les notices maison et les filtres qui dupliquent Astryx. Les tokens CSS B3, ombres, flous et animations associés sont retirés lorsque leur dernier consommateur est migré.

Les composants métier utiles restent, mais leur rendu interne est reconstruit avec Astryx. Aucun écran final ne doit dépendre simultanément du thème Astryx et d’une couche graphique B3 parallèle.

Les dépendances historiques de présentation (`@radix-ui/react-slot`, `class-variance-authority`, `tailwind-merge`, `lucide-react`) sont supprimées uniquement après preuve qu’elles n’ont plus de consommateur. Cette suppression n’est pas un objectif autonome et ne doit pas casser une fonctionnalité.

## Accessibilité, confidentialité et performance

- navigation complète au clavier, ordre de tabulation naturel et focus Astryx visible ;
- cible tactile minimale de 44 px pour les actions principales ;
- landmarks, titres uniques, labels persistants et `aria-live` pour les mutations ;
- aucune information transmise uniquement par une couleur, une icône ou un mouvement ;
- contraste WCAG AA contrôlé sur le thème Neutral sombre ;
- aucune donnée privée ajoutée aux titres de document, métadonnées publiques ou HTML anonyme ;
- aucune URL Storage publique ou signée rendue dans le document ;
- les photos personnelles restent derrière le Route Handler authentifié et la RLS ;
- pas de calcul métier dans les composants React ;
- pas de client Supabase administratif dans le navigateur ;
- pas de chargement de police, image ou asset décoratif externe ;
- maintien des Server Components afin de limiter le JavaScript client.

## Stratégie de migration et retour arrière

La migration est réalisée dans une branche ou un worktree isolé, par lots cohérents mais avec une bascule finale unique :

1. dépendances verrouillées, couches CSS, thème et providers ;
2. primitives partagées, shell et navigation ;
3. accueil et authentification ;
4. Aujourd’hui, marchés et ticket ;
5. déclaration, preuves et validations ;
6. paris, classement, lives, chronologie et administration ;
7. suppression B3, audit responsive et validation complète.

Chaque lot conserve l’application compilable et les contrats métier existants. La branche principale n’est promue qu’après validation globale. En cas de régression Astryx bloquante, le retour arrière est applicatif par revert du commit de migration ; aucune migration de base n’est nécessaire.

## Tests et critères d’acceptation

### Tests de composants

- provider Astryx et adaptation de `next/link` ;
- navigation active desktop et mobile selon le chemin et le rôle ;
- formulaires d’authentification, états de chargement et erreurs accessibles ;
- sélection de cote, conflit de marché, évolution de cote et ticket ;
- formulaires de déclaration et preuve privée ;
- états loading, empty, error et not configured ;
- absence de secret, token, e-mail complet ou URL Storage dans les rendus concernés.

### Tests de pages et parcours

- accueil puis connexion ou inscription ;
- dashboard Aujourd’hui avec et sans action prioritaire ;
- Marchés → sélection → devis → pari fictif ;
- déclaration d’événement avec preuve → validation par un autre membre ;
- consultation de Mes paris, Classement, Lives et Administration selon le rôle ;
- redirections Auth/RLS inchangées ;
- navigation clavier, mobile 320 px, absence d’overflow et reduced motion.

Les tests Playwright existants sont adaptés aux nouveaux rôles accessibles et aux sélecteurs sémantiques. Les captures visuelles sont régénérées seulement après stabilisation des données E2E isolées. Un contrôle axe est exécuté sur les surfaces critiques.

### Validation technique

La livraison exige, dans cet ordre adapté au projet : format, lint, typecheck, Vitest, contrôles SQL existants si la base locale est disponible, Playwright desktop et mobile, build avec Supabase arrêté, installation frozen et scan de secrets. Le diff confirme l’absence de modification de `supabase/migrations` et de `src/domain/odds`.

## Documentation et livraison

La mise en œuvre mettra à jour `README.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/PRODUCT.md`, `docs/ROADMAP.md` et `docs/CURRENT_STATE.md`. La documentation identifiera Astryx 0.1.7 comme dépendance bêta verrouillée, expliquera la frontière Astryx/Tailwind et indiquera la procédure de montée de version.

Le déploiement Vercel ne nécessite aucune nouvelle variable d’environnement. La Production n’est promue qu’après validation locale et vérification du login, du dashboard, d’un marché, d’un pari fictif et d’un média privé sur le domaine déployé.

## Hors périmètre

- nouvelle règle de pari, nouveau marché ou argent réel ;
- modification des RPC, de la RLS ou des migrations ;
- Realtime, notifications push ou chat ;
- mode clair ou sélecteur de thème ;
- personnalisation profonde ou fork d’Astryx ;
- copie de l’identité, du logo ou de la mise en page de Betclic ;
- exposition publique de preuves, profils ou médias personnels.
