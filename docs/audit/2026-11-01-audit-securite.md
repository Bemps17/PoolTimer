# Audit de sécurité — v3.5.1

Date : 2026-11-01. Périmètre : relais Cloudflare (`worker/src/index.ts`, `src/mirror/*`), protocole et validation, imports (liens `#h8=`, fichiers, sons), stockage local, en-têtes du site (Vercel), dépendances (`npm audit`). Méthode : lecture du code, en-têtes réels de production (via Vercel), `npm audit`. Pas de test d'intrusion sur le relais de production (bloqué depuis la session).

## Modèle de menace (rappel)

Pas de comptes, pas de base de données, pas de données personnelles hormis des **noms de joueurs**. Les risques réels : **détourner l'écran / l'overlay d'un stream** (afficher autre chose), **casser le service** (quota gratuit Cloudflare partagé par tout le compte), **injecter du contenu** via un lien ou un fichier importé.

## Points forts (vérifiés)

- **Secret de télécommande** : 128 bits issus de `crypto.getRandomValues`, jamais dans les liens d'écran / OBS (`/d/CODE`, `/o/CODE`), masqué dans le journal `.log` (vérifié en e2e).
- **Une seule télécommande par salle**, les écrans sont en lecture seule ; un écran qui tente `push` est refusé (`unauthorized`).
- **Origines** : seules la production, les aperçus Vercel du projet et localhost peuvent ouvrir un WebSocket depuis un navigateur (protège contre le détournement par une page tierce).
- **Garde-fous** : messages ≤ 32 Ko, 40 écrans max par salle, débit limité par connexion (push 15/s, ping 1/s), séquence anti-rejeu (`stale_seq`), salles supprimées après 2 h sans connexion.
- **Validation** : tout snapshot reçu est re-parsé champ par champ (champs inconnus supprimés), couleurs de thème en `#rrggbb`, noms normalisés ; imports limités (lien 6 000 caractères, fichier 16 Ko, son 1,5 Mo / 12 sons, type audio vérifié) et **toujours confirmés** (`ImportDialog`).
- **Pas d'injection HTML** : aucun `innerHTML`, `dangerouslySetInnerHTML`, `eval` ; React échappe tout le texte.
- **HTTPS forcé** (HSTS 2 ans + preload) ; **0 vulnérabilité** dans les dépendances livrées aux utilisateurs.

## Constats

| # | Gravité | Constat | Correctif proposé |
| --- | --- | --- | --- |
| S1 | **Moyenne** | **Épuisement du quota gratuit** : chaque connexion d'écran écrit 1 ligne (`setAlarm`), chaque connexion de télécommande 3 (secret, état, alarme), même à l'identique. Un simple script qui ouvre/ferme des connexions (pas besoin de secret pour un écran, il suffit d'un code valide ; pas d'Origin hors navigateur) consomme les 100 000 écritures/jour du compte → relais hors service pour tous. Idem pour les 100 000 requêtes/jour des Durable Objects. | Ne plus écrire quand rien ne change (secret identique, alarme déjà lointaine : lire `getAlarm()` — lecture gratuite au regard du quota d'écriture) ; limiter les nouvelles connexions par salle (seau à jetons dans `mirror/limits.ts`) ; à terme, domaine personnalisé + règle de limitation de débit Cloudflare sur `/ws`. |
| S2 | Moyenne | **En-têtes de sécurité absents** sur le site : pas de CSP, pas de `frame-ancestors` (la télécommande peut être intégrée dans une page piège — clickjacking), pas de `Referrer-Policy`, pas de `X-Content-Type-Options`, pas de `Permissions-Policy`. | `vercel.json` : CSP (`default-src 'self'` ; `connect-src 'self' wss://h8timer-mirror…` ; `img-src 'self' data: blob:` ; `media-src 'self' blob:` ; polices), `frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, `Permissions-Policy` minimal. L'overlay OBS n'est pas une iframe : non concerné. Tester la PWA, l'audio et le relais avant mise en production. |
| S3 | Faible | **Reprise d'une salle expirée** : 2 h sans aucune connexion, la salle est effacée ; quiconque connaît le code peut alors la réclamer avec son propre secret, pousser un faux affichage vers l'écran / l'overlay OBS restés sur ce code, et la vraie télécommande reçoit « salle occupée ». Le code est visible (écran en attente, URL de l'overlay). | Côté télécommande : sur « occupée » avec le code mémorisé, proposer immédiatement une nouvelle salle (et prévenir que le lien OBS change). Option : conserver une empreinte du secret plus longtemps que l'état. |
| S4 | Faible | **Champs non bornés dans le snapshot** : `p1Color` / `p2Color` acceptent n'importe quel texte, les nombres (temps, taille des chiffres) ne sont pas bornés. Pas d'exploitation trouvée (React ignore une couleur invalide, seule la télécommande authentifiée peut publier), mais contraire à la règle « toute donnée entrante validée ». | Couleurs en `#rrggbb` et nombres bornés (mêmes limites que `mergeConfig`) dans `parseDisplayConfig`, avec tests dans `protocol.test.ts`. Worker à redéployer. |
| S5 | Faible | **Outils de développement vulnérables** (`npm audit`) : vitest (critique), vite, wrangler / miniflare, sharp, undici… Risque limité au poste de développement et à la CI, rien n'est livré aux utilisateurs. | Mettre à jour vitest, vite, vite-plugin-pwa, wrangler et sharp (montées de version majeures : à faire avec les tests). |
| S6 | Info | **Polices Google** : l'adresse IP de chaque visiteur part chez Google (point RGPD relevé par des autorités européennes). | Héberger Poppins / Chakra Petch dans l'app (aussi gain de perf et hors ligne, cf. audit UX). |
| S7 | Info | **Secret dans l'URL du WebSocket** (`?secret=`) : chiffré par TLS, mais visible dans d'éventuels journaux (`wrangler tail`, outils réseau). | L'envoyer dans le premier message plutôt que dans l'URL (changement de protocole rétro-compatible). |
| S8 | Info | Lecture d'une salle sans secret : quiconque a le code voit le chrono et les noms (par conception : écrans publics). | Rien, à documenter ; code de 6 caractères sur 32 symboles (≈ 1 milliard de combinaisons), pas d'énumération réaliste. |

## Suivi

- **S1** et **S2** corrigés en v3.5.2 (voir `CHANGELOG.md`).

## Priorités

1. **S1** (disponibilité du service) puis **S2** (en-têtes) : peu de code, gain réel.
2. **S4** et **S3** : durcissement du protocole et du parcours de reprise.
3. **S5**, **S6**, **S7** : maintenance et vie privée.
