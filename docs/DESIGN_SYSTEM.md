# Design system sportsbook MK Bet

## Direction

L’interface reprend les conventions génériques d’un sportsbook privé : densité lisible, cotes rectangulaires, surfaces blanches, fond gris très clair et rouge profond MK Bet. Elle ne copie ni logo, ni asset, ni composition Betclic.

## Tokens

Les tokens sont centralisés dans `src/styles/globals.css` :

- marque : `brand`, `brand-hover`, `brand-active`, `brand-muted` ;
- surfaces : `surface`, `surface-raised`, `surface-subtle`, `border` ;
- texte : `text-primary`, `text-secondary`, `text-muted` ;
- états : `positive`, `negative`, `warning`, `live`, `selected-odds`, `suspended`.

L’application reste en thème clair. Aucun asset externe, police distante ou librairie de chart n’est nécessaire pour cette étape.

## Composants

Le shell privé utilise une sidebar desktop, un header compact, une navigation mobile fixe et un ticket visuel. Les pages restent mobile-first et réservent les interactions client aux filtres, tabs, boutons de cotes et ticket.

Les boutons de cotes sont de vrais boutons, avec `aria-pressed`, libellé accessible complet, état suspendu désactivé et mouvement indiqué par texte + icône, pas uniquement par couleur.

Les marchés binaires utilisent deux colonnes égales dès que l’espace le permet. Le graphique SVG affiche une grille et des points même lorsqu’un seul snapshot existe. Le ticket mobile est un panneau contrôlé, limité à la hauteur disponible, scrollable, refermable par son bouton ou par `Escape`, avec restitution du focus.

## États

Les états vides, erreur, chargement et configuration manquante sont des composants réutilisables. Les actions métier non développées restent désactivées avec une mention explicite “Bientôt disponible” ou “Placement disponible à l’étape suivante”.

## Accessibilité

Les pages privées conservent des landmarks, un lien d’évitement “Aller au contenu principal” dont la cible reçoit le focus, des titres hiérarchisés, un focus visible, des cibles tactiles proches de 44 px et une navigation active qui ne dépend pas seulement de la couleur. Les zones horizontales, dont le classement mobile, sont focalisables. Les animations d’entrée, pulse, spinner et skeleton respectent `prefers-reduced-motion`.

## Validation visuelle

Les projets Playwright `chromium-desktop` (1440 × 1000) et `chromium-mobile` (Pixel 7) contrôlent navigation, overflow, clavier et axe. Une matrice complémentaire couvre 360 × 800, 390 × 844, 768 × 1024, 1024 × 900 et 1440 × 1000.

Cinq références visuelles reproductibles sont conservées : login desktop, dashboard desktop, marchés desktop, marchés mobile et ticket mobile ouvert. Les captures d’audit plus larges restent temporaires et ignorées par Git.
