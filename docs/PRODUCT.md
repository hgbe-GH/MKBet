# Produit MK Bet

## Promesse

MK Bet est une salle de paris fictifs privée consacrée à une seule histoire : Margot × Kévin. Le groupe parie en MKB sur leur prochain bisou et sur un éventuel retour officiel en couple, puis tranche collectivement les faits observés.

Aucun euro, paiement, retrait ou échange de valeur n’existe. Chaque compte reçoit 1 000 MKB sans valeur financière.

## Parcours

1. Un ami crée son compte avec son e-mail et un mot de passe, puis rejoint immédiatement la salle sans confirmation d’adresse. En cas d’oubli, il utilise la récupération par e-mail et son callback Auth dédié.
2. Il choisit une cote Oui ou Non et confirme son ticket. Un combiné contient deux ou trois marchés distincts et son devis PostgreSQL reste l’unique autorité sur la corrélation, la cote et le retour.
3. N’importe quel membre peut déclarer un bisou ou un retour officiel, avec jusqu’à cinq photos privées facultatives.
4. L’auteur ne vote pas. Deux autres membres doivent valider ou invalider.
5. Deux validations confirment le fait et règlent le marché lié ; deux invalidations rejettent le fait et rouvrent le marché.

Les votes sont définitifs. Les cotes restent figées sur chaque jambe de pari et les gains MKB sont calculés côté PostgreSQL, jamais par le navigateur.

## Navigation

- **Direct** : faits à vérifier, confirmés ou invalidés ;
- **Marchés** : les deux questions, leurs cotes réelles et un calendrier protégé par semaine UTC ;
- **Déclarer** : description, heure réelle, marché associé et preuves ;
- **Mon ticket** : devis, confirmation et historique des paris ;
- **Classement** : soldes et performance amicale ;
- **Compte** : nom d’affichage et déconnexion.

Les concepts historiques de saisons multiples, lives et console d’administration restent dans le schéma pour la compatibilité forward-only, mais ne structurent plus l’expérience.

## Calendrier des marchés

Le calendrier privé groupe les marchés accessibles par semaine UTC et propose des filtres de catégorie et de statut. Chaque marché distingue son ouverture, la fermeture des mises et l’échéance du fait : la fermeture bloque un nouveau ticket, tandis que l’échéance décrit le terme du fait parié. Lorsqu’aucune échéance n’est définie, la fermeture est la seule date opérationnelle affichée.

## Ton et garde-fous

L’interface emprunte le vocabulaire générique d’un sportsbook avec une identité bordeaux originale. Le ton est dramatique et humoristique, sans copier Betclic. Les textes doivent rester bienveillants, les preuves strictement privées et les personnes concernées capables de demander le retrait d’un contenu.
