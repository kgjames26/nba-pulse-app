# NBA Pulse — readiness avant diffusion publique

État du projet au 27 octobre 2026. Cette liste décrit ce qui est présent dans le dépôt et les démarches encore nécessaires ; elle ne vaut pas validation juridique ni homologation Google Play.

## Déjà présent

- PWA responsive avec manifeste et parcours d’installation.
- Préférences locales sans compte : favoris, langue et spoilers.
- Sources de données isolées dans `src/lib/nba/espn.server.ts`.
- Appels IA côté serveur ; aucune clé xAI n’est envoyée au navigateur.
- Cache des récits IA par match et par langue, avec PostgreSQL/Neon configurable.
- Messages de repli quand le flux, les cotes ou les récits sourcés sont absents.
- Six locales, prise en charge de la direction RTL arabe.

## Bloqueurs avant Google Play

1. **Droits sur les données NBA.** Le dépôt interroge les endpoints publics ESPN sans contrat de service ni SLA identifié. Obtenir une autorisation écrite compatible avec une application distribuée, ou remplacer le fournisseur par un flux sous licence. Ne pas supposer que l’accès public vaut droit de republication.
2. **Logos et identité.** Les logos viennent d’un CDN tiers. Obtenir les autorisations nécessaires ou les retirer avant publication si leur usage n’est pas couvert.
3. **Vidéo.** Le flux ne garantit ni cinq extraits, ni YouTube, ni les droits de lecture dans chaque pays. L’interface doit continuer à n’afficher que les clips réels retournés. Pour interroger YouTube Data API, créer un projet Google, obtenir une clé, respecter les conditions et politiques YouTube et suivre les quotas affichés dans Google Cloud. La documentation indique une allocation par défaut de 10 000 unités/jour, avec un coût spécifique pour la recherche ; elle peut changer.
4. **Packaging Android.** La sortie actuelle est une PWA. Pour Play Store, créer une Trusted Web Activity avec domaine HTTPS stable, `assetlinks.json`, identifiant Android unique, icône/visuels de fiche et signature d’upload. Générer et vérifier ensuite le `.aab` avec Bubblewrap/Android SDK. Aucun AAB signé n’est inclus.
5. **Déclarations Play et confidentialité.** Vérifier la fiche Sécurité des données, la politique de confidentialité publique, les coordonnées de contact, la classification du contenu, les accès réseau, le comportement hors ligne et les exigences de compte développeur applicables au moment de la soumission.
6. **Données en production.** Configurer PostgreSQL/Neon durable via `DATABASE_URL`. Sans cela, les données de cache PGlite ne sont pas partagées entre instances serverless. Configurer `XAI_API_KEY` seulement si les résumés IA sont activés.
7. **Qualité de publication.** Effectuer les tests de bout en bout sur appareils Android réels : RTL, spoilers dans chaque écran, rotation/redimensionnement, perte réseau, dates NBA, liens vidéo, accessibilité, démarrage à froid et installation. La compilation seule ne valide pas ces parcours.

## Fournisseurs et clés

| Fonction | Implémentation actuelle | Condition avant production |
|---|---|---|
| Calendrier, scores, box scores, classements, absences, cotes, clips | Flux public ESPN, via serveur | Autorisation et conditions écrites adaptées à l’usage envisagé, ou migration vers un fournisseur licencié ; disponibilité et schéma à surveiller |
| Résumés et duels IA | API xAI côté serveur (`XAI_API_KEY`) | Clé privée, budget/quotas du compte, contrôle de coût et supervision des erreurs |
| Cache IA | PostgreSQL (`DATABASE_URL`) ou PGlite local | PostgreSQL durable recommandé en serverless |
| YouTube | Pas de dépendance obligatoire ; aucun lien inventé | Un projet Google Cloud et une clé YouTube Data API sont requis uniquement si une recherche YouTube est ajoutée ; les vidéos restent soumises aux droits de leurs titulaires |

Les prix des fournisseurs sportifs ne sont pas fixés dans ce dépôt : ils dépendent du contrat, des marchés et des droits demandés. Il faut obtenir un devis écrit directement auprès du fournisseur avant de budgéter une sortie commerciale.

## Politique de spoilers

Les préférences sont stockées localement. La présentation masque les scores et bloque les classements actualisés tant que l’utilisateur n’a pas choisi de les révéler. Avant publication, vérifier aussi chaque future notification, balise de partage, titre de page, aperçu et vignette : aucun de ces canaux ne doit divulguer un résultat.
