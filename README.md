# FACTEUR - Application de Calcul de Prix Offre Climatisation

Cette application permet de créer et gérer des devis pour des offres de climatisation. Elle est construite avec React, TypeScript et Material UI.

## Fonctionnalités

- Création et gestion de devis
- Calcul automatique des prix selon les taux de change et de marge
- Gestion des articles et des clients
- Exportation des devis en PDF
- Interface utilisateur moderne et réactive

## Prérequis

- Node.js (version 14.x ou supérieure)
- npm (version 6.x ou supérieure)

## Installation

1. Clonez ce dépôt ou téléchargez les fichiers sources
2. Ouvrez un terminal et naviguez vers le dossier du projet
3. Installez les dépendances:

```bash
npm install
```

## Démarrage de l'application

Pour lancer l'application en mode développement:

```bash
npm start
```

L'application sera accessible à l'adresse [http://localhost:3000](http://localhost:3000).

## Construction pour la production

Pour construire l'application pour la production:

```bash
npm run build
```

Les fichiers de production seront générés dans le dossier `build`.

## Structure du projet

- `src/components`: Composants réutilisables
- `src/contexts`: Contextes React pour la gestion d'état
- `src/models`: Interfaces TypeScript et types
- `src/pages`: Composants de pages
- `src/services`: Services pour les données et les API
- `src/utils`: Fonctions utilitaires
- `src/hooks`: Hooks React personnalisés
- `src/styles`: Styles globaux et variables

## Gestion de l'état

L'application utilise React Context API avec useReducer pour gérer l'état global. Cela permet:

- Un état prévisible grâce à un flux de données unidirectionnel
- Une séparation claire entre l'UI et la logique métier
- Une préparation pour une future intégration avec un backend

## Futurs développements

- Intégration avec un backend pour le stockage persistant des données
- Authentification des utilisateurs
- Améliorations de l'interface utilisateur
- Génération de rapports