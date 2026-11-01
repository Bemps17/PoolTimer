# Score automatique depuis CueScore — WORK IN PROGRESS

> Statut : **en attente (WIP)**. Rien n'est codé. Cadrage complet : [cuescore-cadrage.md](cuescore-cadrage.md).

## Objectif

Récupérer le score d'un match depuis CueScore pour ne plus le saisir dans H8timer.
C'est un **réglage** : la saisie manuelle reste le mode par défaut et le repli.

## Ce qui est confirmé à ce jour

| Élément | État |
| --- | --- |
| Endpoint tournoi | **Non vérifié.** `GET https://api.cuescore.com/tournament/?id=…` n'est qu'une piste du cadrage. |
| Accès réseau | `api.cuescore.com` **injoignable** depuis les sessions cloud de dev (politique réseau). À autoriser avant l'audit. |
| Score courant, manches, table, statut « en cours » | Inconnus. |
| Push / WebSocket | Non documenté à ce stade : partir sur du polling. |
| Quotas / conditions d'utilisation | Inconnus. |

Aucun endpoint, champ, quota ni délai ne doit être supposé : tout part de l'**audit (phase 1)**.

## Plan proposé pour H8timer

### Phase 1 — Audit (sans interface)
- Prérequis : autoriser `api.cuescore.com` (et la doc) dans le réseau de la session, et l'URL d'un tournoi **public et actif**.
- Lire la doc officielle, tester **un** tournoi réel, enregistrer une réponse anonymisée en fixture, mesurer le délai de mise à jour (requêtes espacées de 15 à 30 s, sans balayage d'identifiants).
- Remplir le tableau de validation du cadrage (§ 4, étape D) et rendre un verdict : faisable / avec limites / non faisable.

### Phase 2 — Connecteur (si la phase 1 le permet)
- **Côté serveur, dans le relais Cloudflare existant** (pas de nouvelle infrastructure) : un Durable Object par tournoi suivi = un seul poller, cache, respect de `Retry-After` / `ETag`, timeout, nombre de tournois suivis limité.
- Module pur `src/integrations/cuescore/` : `parseTournamentId(url)`, `normalizeTournament(json)` vers le modèle interne, `diffMatches(prev, next)` ; tests sur fixtures réelles (inexistant, sans match commencé, en cours, terminé, JSON partiel, 429, 304, timeout).
- Attention au budget du plan gratuit Cloudflare (lignes écrites par jour, cf. audit v3.0) : cache en mémoire, écritures limitées.

### Phase 3 — Dans l'application
- Réglage ⚙️ → Score : **Source du score : Manuelle (défaut) / CueScore**, URL du tournoi, choix du match (table / joueurs).
- En mode CueScore : score en lecture seule sur la télécommande, mention « CueScore · mis à jour il y a 20 s », état « données anciennes » si la récupération échoue, bouton Actualiser, retour à la saisie manuelle en un appui.
- Protocole miroir : `match.source` (`manual` | `cuescore`) et `match.fetchedAt` optionnels, pour l'écran Visuel et l'overlay OBS.
- **À vérifier pendant l'audit** : CueScore expose-t-il les casses fermes (F) et qui casse ? Sinon, ces deux informations restent manuelles même en mode CueScore.
- Ne jamais afficher un ancien score comme « live », ni transformer un score absent en 0.
