# NBA Pulse

PWA NBA multilingue, pensée d’abord pour Android. Elle s’installe depuis un navigateur compatible et fonctionne sans compte. Le serveur récupère les données de matchs et garde les clés IA hors du navigateur.

## Fonctionnalités présentes dans cette version

- Configuration initiale : 1 à 5 équipes favorites, mode spoiler et choix parmi six langues.
- Accueil sur la journée NBA précédente, navigation entre les journées, matchs classés par favoris puis critères éditoriaux de repli.
- Fiches match avec score protégé par le mode spoiler, box score, clips réellement associés au match lorsqu’ils sont fournis et informations de cote si elles existent dans le flux.
- Classements par conférence, avec verrou de révélation en mode sans spoiler.
- Résumés tactiques générés côté serveur et mis en cache par match et langue lorsqu’une clé xAI et une recherche sourcée sont disponibles. Sinon, l’application conserve une lecture statistique.
- Interface RTL pour l’arabe et textes traduits en français, anglais, espagnol, turc, arabe et chinois simplifié.

## Architecture

- React, TypeScript, TanStack Start et Vite.
- Interface PWA responsive, manifeste et écran d’installation Android.
- Fonctions serveur TanStack pour les calendriers, feuilles de match, classements et récits IA.
- Flux ESPN utilisé actuellement comme source technique de données. Il n’est pas présenté comme une API commerciale garantie.
- PostgreSQL/Neon configurable pour conserver le cache IA en production ; PGlite sert de repli local.

## Lancer en local

```bash
npm ci
cp .env.example .env
npm run dev
```

Ouvre `http://localhost:8080`. `XAI_API_KEY` est facultative pour lancer l’application ; sans elle, le résumé IA sourcé n’est pas généré. `DATABASE_URL` est recommandé pour un cache durable.

## Déploiement serveur

Le projet contient une sortie Nitro pour Vercel. Il n’est pas hébergeable tel quel sur GitHub Pages : les appels aux données et à l’IA passent par des fonctions serveur.

1. Importer le dépôt dans Vercel et conserver les commandes de build présentes dans le projet.
2. Ajouter `DATABASE_URL` avec une base PostgreSQL/Neon persistante.
3. Ajouter `XAI_API_KEY` comme variable secrète si les résumés IA sont souhaités.
4. Déployer en HTTPS, puis vérifier les pages, le manifeste et les appels serveur.

Sans `DATABASE_URL`, le cache PGlite est éphémère et peut être recréé par les instances serverless. Les migrations SQL s’exécutent pendant `npm run build` lorsque la base est configurée.

## Vérification effectuée

`npm run build` a été exécuté le 27 octobre 2026 et a terminé avec succès. Les tests automatisés n’ont pas été exécutés dans cette livraison.

## Limites de publication

Cette livraison est une PWA web installable, pas une application Android native et ne contient pas de fichier `.aab` signé. Un AAB exige un domaine HTTPS stable et une enveloppe Android de type Trusted Web Activity, avec identifiant d’application, association Digital Asset Links et signature Play configurés.

Le flux ESPN utilisé ici est public et non contractuel. Avant une distribution publique ou commerciale, il faut obtenir une autorisation écrite ou remplacer ce flux par un fournisseur proposant une licence adaptée. Les logos sont chargés depuis le CDN du fournisseur ; leurs droits restent à valider. Les clips proviennent des liens réellement retournés par ce flux et ne sont pas garantis YouTube.

Voir [`docs/RELEASE-READINESS.md`](docs/RELEASE-READINESS.md) pour les éléments requis avant publication.
