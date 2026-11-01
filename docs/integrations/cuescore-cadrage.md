# CueScore --- Intégration de l'API publique gratuite

> **Document de cadrage destiné à un agent de code.**\
> Objectif : connecter une application externe à CueScore pour afficher
> les scores d'un tournoi en cours, sans utiliser les fonctionnalités
> API payantes/Network si l'API publique suffit.

## 1. Objectif fonctionnel

Développer un connecteur côté serveur qui récupère les informations
publiques d'un tournoi CueScore et les expose à l'application sous une
forme stable.

Fonctionnalités visées :

-   Charger un tournoi à partir de son identifiant CueScore.
-   Récupérer les informations du tournoi et la liste de ses matchs.
-   Afficher les joueurs/équipes, les tables, les statuts et les scores
    disponibles.
-   Détecter les changements de score en interrogeant périodiquement
    l'API.
-   Signaler clairement l'heure de la dernière récupération et l'état de
    fraîcheur des données.
-   Ne jamais inventer un score ou déduire un état de match absent de la
    source.

**Définition du « live » :** en l'absence de flux Push/WebSocket public
confirmé, utiliser le *polling* (requêtes HTTP répétées). L'affichage
sera du quasi-temps réel, avec un délai dépendant de CueScore, de son
cache et de la fréquence autorisée.

## 2. Source et accès

-   API publique : `https://api.cuescore.com/`
-   Documentation officielle à consulter en priorité :
    `https://api.cuescore.com/`
-   L'API publique est présentée comme une API JSON et peut être
    utilisée pour lire des données exposées publiquement.
-   La documentation/API est susceptible d'évoluer : ne pas figer un
    schéma supposé sans examiner les réponses réelles.
-   Ne pas confondre l'API REST publique avec les intégrations
    JavaScript / widgets / fonctionnalités CueScore Network, qui peuvent
    être soumises à une offre payante.
-   Ne pas supposer qu'un compte, une clé API ou un abonnement est
    nécessaire ou inutile : vérifier les exigences actuelles sur la
    documentation officielle et par un test HTTP non intrusif.
-   Ne pas contourner une authentification, une limitation, un contrôle
    d'accès ou une restriction technique.

### Exemple d'URL à valider

Un exemple d'utilisation historiquement rapporté est :

``` http
GET https://api.cuescore.com/tournament/?id=11135416
```

Cet exemple est un **point de départ à tester**, pas une garantie
contractuelle que cette route, ses paramètres ou son format sont
toujours supportés. L'agent doit vérifier le comportement actuel et
documenter le résultat.

L'identifiant du tournoi doit être extrait d'une URL CueScore fournie
par l'utilisateur, ou saisi explicitement. Ne pas coder en dur
l'identifiant d'exemple.

## 3. Ce qui est confirmé et ce qui doit être vérifié

### Capacités à rechercher dans la réponse

Inspecter les données renvoyées par l'API pour identifier, sans les
présumer :

-   identifiant et nom du tournoi ;
-   date, lieu et discipline ;
-   participants, joueurs ou équipes ;
-   identifiants des participants ;
-   matchs / rencontres ;
-   identifiant du match ;
-   numéro ou nom de table ;
-   participants de chaque côté ;
-   score courant ;
-   manches / frames / sets, si exposés ;
-   statut du match (à venir, en cours, terminé, abandonné, etc.) ;
-   vainqueur, si fourni ;
-   dates de mise à jour, si fournies.

### Points non garantis à tester

Ne pas annoncer comme disponibles avant vérification :

1.  Le score courant pendant un match, plutôt que le seul résultat
    final.
2.  Le détail des manches/frames/sets.
3.  L'identification fiable des matchs « en cours ».
4.  Le numéro de table.
5.  La fréquence à laquelle CueScore publie les modifications.
6.  L'existence de limites de débit, quotas ou règles d'usage.
7.  L'accès CORS depuis un navigateur.
8.  L'existence d'un endpoint documenté pour les matchs d'un tournoi.
9.  La disponibilité d'un flux WebSocket, SSE, webhook ou autre
    mécanisme Push.

**Hypothèse d'architecture :** aucun Push public n'étant confirmé à ce
stade, commencer par le polling HTTP côté serveur. Ne pas développer de
client WebSocket tant qu'un endpoint officiel documenté n'a pas été
identifié.

## 4. Mission d'exploration obligatoire pour l'agent

Avant de construire l'interface, effectuer une phase de découverte et
produire un rapport technique.

### Étape A --- Lire la documentation

1.  Ouvrir `https://api.cuescore.com/`.
2.  Relever les endpoints documentés, paramètres, méthodes HTTP,
    exemples et éventuelles exigences d'authentification.
3.  Relever les conditions d'utilisation, limites de requêtes et
    mentions de bêta/version.
4.  Distinguer clairement les endpoints publics REST des services
    payants ou intégrations Network.

### Étape B --- Tester un tournoi réel

Demander ou utiliser l'URL d'un tournoi public actif fournie par
l'utilisateur.

1.  Extraire son identifiant.
2.  Tester l'endpoint de tournoi documenté.
3.  Enregistrer un exemple de réponse JSON (en supprimant toute donnée
    personnelle non nécessaire).
4.  Identifier la structure réelle et les champs pertinents.
5.  Vérifier si les matchs sont inclus dans la réponse ou nécessitent
    une autre requête.
6.  Identifier les champs de score et leur sémantique.
7.  Vérifier les réponses en cas d'identifiant invalide, tournoi privé
    ou indisponibilité.

Ne pas lancer de balayage d'identifiants ou de collecte massive de
tournois.

### Étape C --- Vérifier le caractère temps réel

Sur un tournoi actif, effectuer un test limité et raisonnable :

1.  Récupérer une première réponse et noter l'heure.
2.  Répéter la requête à intervalle prudent, par exemple 15 à 30
    secondes au départ.
3.  Comparer les réponses et relever le délai entre une modification
    visible sur CueScore et sa présence dans l'API.
4.  Vérifier les en-têtes HTTP utiles (`ETag`, `Last-Modified`,
    `Cache-Control`, `Age`, `Retry-After`) lorsqu'ils existent.
5.  Vérifier les codes HTTP et éventuelles erreurs de quota.
6.  Ne réduire l'intervalle qu'après avoir confirmé que cela respecte
    les règles de l'API.

Ne pas promettre une actualisation à 5 ou 10 secondes avant ce test. La
fréquence de polling ne garantit pas la fraîcheur des données côté
fournisseur.

### Étape D --- Rapport de validation

Fournir un tableau avec :

  Élément              Résultat attendu
  -------------------- ----------------------------------------
  Endpoint tournoi     URL et méthode réellement vérifiées
  Authentification     Aucune / clé / autre, avec preuve
  Données du tournoi   Champs confirmés
  Matchs               Endpoint et structure confirmés
  Score courant        Confirmé / absent / incertain
  Manches ou frames    Confirmé / absent / incertain
  Table                Confirmé / absent / incertain
  Statut en cours      Champ et valeurs réelles
  Push / WebSocket     Confirmé ou non documenté
  Polling              Intervalle testé et délai observé
  Limites d'usage      Valeurs documentées ou inconnues
  CORS                 Testé ou non pertinent (appel serveur)

Si les données nécessaires au live ne sont pas exposées par l'API
publique, arrêter et présenter les limites avant de proposer une
solution de contournement.

## 5. Architecture d'intégration recommandée

Privilégier un connecteur serveur afin de ne pas exposer l'application
aux changements de l'API, aux problèmes CORS et à une éventuelle future
clé d'accès.

``` text
CueScore (API publique)
        |
        | HTTPS / JSON
        v
Connecteur serveur de l'application
        |
        +--> validation et normalisation des données
        |
        +--> cache avec durée de vie configurable
        |
        +--> comparaison avec la réponse précédente
        |
        v
Endpoint interne de l'application
        |
        v
Interface React / PWA
```

Le stockage persistant (PostgreSQL/Neon/Supabase) est facultatif pour le
premier prototype. Il devient utile pour conserver l'historique des
scores, les événements et les statistiques.

### Principes

-   Les appels à CueScore sont effectués côté serveur.
-   L'identifiant du tournoi est un paramètre validé, jamais une URL
    arbitraire fournie sans contrôle.
-   Utiliser un timeout réseau.
-   Respecter `Retry-After` si le serveur le fournit.
-   Gérer les erreurs 4xx/5xx sans boucle de retry agressive.
-   Mettre en cache les réponses et éviter les appels redondants.
-   Si `ETag` ou `Last-Modified` sont pris en charge, utiliser les
    requêtes conditionnelles (`If-None-Match`, `If-Modified-Since`).
-   Ne pas stocker de secrets dans le code client ou dans le dépôt.
-   Ne pas enregistrer de données personnelles non nécessaires.
-   Ajouter des logs techniques sans données sensibles.

## 6. Contrat interne conseillé

Créer une couche d'adaptation indépendante du format CueScore.
L'interface ne doit pas dépendre directement des noms de champs
externes.

Exemple de modèle interne **indicatif** ; les propriétés non disponibles
dans la source doivent rester `null` ou être omises :

``` ts
type Tournament = {
  id: string;
  name: string | null;
  startDate: string | null;
  endDate: string | null;
  venue: string | null;
  sourceUpdatedAt: string | null;
  matches: Match[];
};

type Match = {
  id: string;
  table: string | number | null;
  status: string | null;
  playerA: Participant | null;
  playerB: Participant | null;
  scoreA: number | null;
  scoreB: number | null;
  frames: unknown[] | null;
  winnerId: string | null;
  sourceUpdatedAt: string | null;
};

type Participant = {
  id: string;
  name: string;
};

type LiveSnapshot = {
  tournament: Tournament;
  fetchedAt: string;
  source: "cuescore";
  freshness: "fresh" | "stale" | "error";
  error: string | null;
};
```

Adapter ces types aux données réellement disponibles. Ne pas transformer
un score de manches en score de points, ni confondre sets, frames, racks
ou parties.

## 7. Routes internes possibles

Exemple de contrat pour le backend de l'application :

``` http
GET /api/cuescore/tournaments/:tournamentId
GET /api/cuescore/tournaments/:tournamentId/matches
GET /api/cuescore/tournaments/:tournamentId/status
```

Ces routes sont des routes **internes à créer**, pas des endpoints
CueScore.

Réponse interne suggérée :

``` json
{
  "source": "cuescore",
  "tournamentId": "IDENTIFIANT",
  "fetchedAt": "2026-01-01T12:00:00.000Z",
  "freshness": "fresh",
  "matches": []
}
```

La date ci-dessus est un exemple de format, pas une donnée réelle.

## 8. Polling et mise à jour de l'interface

Pour le prototype, commencer avec une fréquence prudente configurable,
par exemple 15 secondes, après validation des conditions d'usage.

-   Un seul poller serveur par tournoi, si plusieurs utilisateurs
    regardent le même tournoi.
-   Les clients lisent le cache interne, pas CueScore directement.
-   Suspendre ou ralentir les mises à jour lorsque la page est masquée,
    si cela est pertinent.
-   Prévoir un bouton « Actualiser » manuel.
-   Afficher « Dernière mise à jour à ... ».
-   Afficher un état « Données anciennes » si la récupération échoue ou
    si le cache dépasse le seuil défini.
-   Ne jamais présenter un ancien score comme une donnée live sans
    afficher son ancienneté.
-   Reprendre progressivement après une erreur ; éviter les retries
    simultanés de tous les clients.

TanStack Query peut être utilisé côté React pour rafraîchir l'endpoint
interne. Il ne doit pas multiplier les appels directs à CueScore.

## 9. Détection des changements

Comparer les matchs à partir de leur identifiant stable.

Un changement peut concerner :

-   le score A ou B ;
-   le détail des manches ;
-   le statut ;
-   le vainqueur ;
-   la table ;
-   les participants.

Ne pas utiliser l'ordre des matchs dans un tableau comme identifiant. Ne
pas considérer une valeur absente comme un score nul.

Prévoir une fonction pure `diffMatches(previous, current)` qui retourne
les changements observés. Les notifications sonores ou visuelles sont
une fonctionnalité d'interface distincte et doivent pouvoir être
désactivées.

## 10. Tests indispensables

-   Tournoi existant et public.
-   Identifiant inexistant.
-   Tournoi sans match commencé.
-   Match en cours.
-   Match terminé.
-   Match dont le score évolue.
-   Réponse JSON incomplète ou modifiée.
-   API indisponible / timeout.
-   Réponse 429 ou limitation de débit, si applicable.
-   Réponse 304 en cas de requête conditionnelle.
-   Cache périmé.
-   Plusieurs utilisateurs consultant le même tournoi.
-   Redémarrage du serveur.

Créer des fixtures JSON à partir de réponses réelles anonymisées pour
les tests automatisés.

## 11. Sécurité et conformité

-   Respecter les conditions d'utilisation de CueScore et les règles de
    l'API.
-   Ne pas contourner les contrôles d'accès ou les protections
    anti-automatisation.
-   Ne pas aspirer massivement le site web si l'API ne fournit pas une
    donnée.
-   Ne pas exposer une éventuelle clé dans le navigateur.
-   Valider et limiter les paramètres reçus par le backend.
-   Limiter le nombre de tournois suivis simultanément et la fréquence
    des requêtes.
-   Prévoir une désactivation du connecteur en cas de changement de
    politique ou de rupture de compatibilité.

## 12. Livrables attendus de l'agent

### Phase 1 --- Audit, sans développement de l'interface

1.  Documentation officielle résumée.
2.  Liste des endpoints REST réellement vérifiés.
3.  Exemple de réponse JSON d'un tournoi réel.
4.  Cartographie des champs utiles pour les scores live.
5.  Résultat du test de rafraîchissement.
6.  Limites, quotas et conditions d'utilisation identifiés.
7.  Verdict : faisable, faisable avec limites, ou non faisable
    gratuitement.

### Phase 2 --- Connecteur minimal

Uniquement si la phase 1 confirme que les données nécessaires sont
accessibles :

1.  Module `cueScoreClient` côté serveur.
2.  Types TypeScript correspondant au JSON réel.
3.  Fonction de normalisation vers le modèle interne.
4.  Cache et polling configurables.
5.  Routes API internes.
6.  Gestion des erreurs et de la fraîcheur.
7.  Tests automatisés avec fixtures.

### Phase 3 --- Validation

1.  Démonstration sur un tournoi réellement actif.
2.  Preuve qu'un changement de score est détecté.
3.  Mesure du délai observé.
4.  Vérification de l'absence d'appels superflus.
5.  Documentation des variables de configuration.

## 13. Consigne finale à l'agent

**Ne commence pas par coder une intégration supposée. Commence par
auditer l'API publique CueScore et tester un tournoi réel.**

N'invente aucun endpoint, paramètre, champ JSON, quota ou mécanisme
Push. Distingue toujours les faits confirmés, les hypothèses et les
éléments inconnus.

La priorité est de répondre à cette question :

> L'API publique gratuite de CueScore fournit-elle le score courant et
> les informations nécessaires des matchs d'un tournoi actif, avec un
> délai suffisamment court pour construire un tableau de scores quasi
> temps réel ?

Si oui, implémente un connecteur serveur sobre, configurable et
respectueux des limites de l'API. Si non, expose précisément les données
manquantes et demande une décision avant toute autre approche.
