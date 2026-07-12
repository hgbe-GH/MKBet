# Architecture

## Application Next.js

MK Bet utilise Next.js avec l’App Router et TypeScript strict. Les lectures de données seront réalisées en priorité dans des Server Components. Les mutations passeront par des Server Actions ou des Route Handlers après validation des entrées avec Zod et contrôle des droits côté serveur.

Le runtime Node.js par défaut est conservé. Le runtime Edge ne sera ajouté qu’en réponse à un besoin mesuré et documenté.

## Séparation des responsabilités

- `src/domain` contiendra la logique métier pure : probabilités, cotes, règles de marché et règlement ;
- `src/data` et `src/lib/supabase` contiendront l’accès à la persistance ;
- `src/components` contiendra l’interface générique et la mise en page ;
- `src/app` composera les routes et orchestrera les cas d’usage côté serveur ;
- `src/config` validera l’environnement à la frontière du système.

Les composants React ne seront jamais la seule source d’un calcul de cote ou d’une règle de règlement.

## Supabase

Supabase fournira PostgreSQL, Auth, Realtime et Storage. PostgreSQL sera la source de vérité persistante. Les opérations sensibles de portefeuille et de règlement seront atomiques côté base, et les tables privées utiliseront Row Level Security.

La clé de service restera confinée aux modules serveur. Le build initial ne crée aucun client Supabase et ne dépend d’aucune variable Supabase ; les validateurs ne s’exécutent que lorsqu’une future fonctionnalité en a besoin.

## Compatibilité Vercel

L’application ne dépend d’aucun disque local persistant, serveur permanent, timer, boucle résidente ou état important en mémoire. Les fichiers déployés sont du code et des assets statiques ; toutes les données applicatives persistantes seront externes dans Supabase.

Les URL publiques absolues utiliseront `NEXT_PUBLIC_SITE_URL`, configurée pour chaque environnement, et non une adresse localhost codée dans la logique métier.

## Stratégie Realtime prévue

Les changements utiles aux lives, marchés et chronologies seront publiés par PostgreSQL/Supabase Realtime. Les clients s’abonneront uniquement aux canaux nécessaires, autorisés par RLS. Une reconnexion déclenchera une relecture de l’état canonique côté serveur afin de ne pas traiter Realtime comme une source de vérité.

## Stratégie du moteur de cotes prévue

Le moteur sera un module TypeScript pur et testable dans `src/domain`. Il transformera des probabilités validées et l’état d’un marché en cotes selon des règles explicites. Les entrées client ne seront jamais considérées comme autoritaires, les cotes seront recalculées côté serveur, puis la cote acceptée sera figée avec le pari dans une transaction PostgreSQL.

Aucun algorithme de cote ni schéma métier n’est implémenté dans cette étape.
