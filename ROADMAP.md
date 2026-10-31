# ROADMAP — finir H8timer

Objectif : application « terminée » = chrono fiable + **score** + **vrai mode télécommande** + **presets et apparences créables et partageables** entre utilisateurs.

Statut au départ : v2.7.1. Chrono, presets FFB/FBEP codés en dur, apparence à 23 couleurs, miroir WebSocket (Cloudflare DO), PWA, sons, tutoriel : **fait et stable** (147 tests verts).

## Constat de l'analyse

| Besoin | État actuel | Ce qui manque |
| --- | --- | --- |
| Score visible sur l'écran Visuel | Aucun concept de score (ni `types.ts`, ni snapshot) | État de match, UI, champ dans le protocole |
| Interface télécommande différente | Le téléphone en mode miroir affiche **exactement le même `Scoreboard`** que l'app seule (gros chrono inutile : l'écran est ailleurs) | Vue dédiée `RemoteControllerView` |
| Presets personnalisés | 4 presets en dur (`COMPETITION_PRESET_TIMINGS`), `competitionMode` = union fermée recalculée à chaque chargement | Modèle de preset utilisateur, stockage, UI de création |
| Partage presets / apparence | Rien | Format d'échange versionné + canal de partage |

---

## Décisions à trancher (mes recommandations en gras)

### D1 — Comment partager presets et apparences ?

Les utilisateurs n'ont pas de compte. Quatre options, **cumulables** :

| Option | Principe | Backend | Effort | Verdict |
| --- | --- | --- | --- | --- |
| **A. Lien de partage** | Preset/thème sérialisé (JSON compact → base64url) dans le fragment `https://pooltimer.vercel.app/#p=…` ; ouvrir le lien propose « Importer ». Aussi affichable en **QR**. | Aucun | S | **À faire en premier** : zéro infra, fonctionne par WhatsApp/SMS, QR utile en salle |
| **B. Fichier `.h8preset.json`** | Export / import (Web Share API sur mobile, `<input type=file>`) | Aucun | S | **À faire avec A** (même sérialiseur) — sauvegarde/backup gratuite |
| **C. Code court** | `POST /share` sur le Worker existant → stocké en **KV avec TTL** (ex. 90 j), code `K7M-2QX` à saisir | Worker + KV (gratuit à cette échelle) | M | **Phase 2**, si A/B ne suffisent pas ; réutilise le Worker déjà déployé |
| D. Galerie publique / comptes | Catalogue communautaire (ex. « presets de ligue ») | BDD + modération + auth | L | **Non recommandé** pour l'instant (coût, modération, RGPD). À reconsidérer si demande de ligues/clubs |

Dans tous les cas : **enveloppe versionnée et validée** (jamais de confiance au JSON entrant) :

```jsonc
{ "h8": 1, "kind": "preset" | "theme" | "bundle", "name": "…", "author?": "…",
  "preset": { tempsBase, tempsApresCasse, tempsExtension, seuilAlerte, seuilCritique, … },
  "theme": { "base": "sombre", "colors": { … 23 clés … } } }
```

Validation par clamp (`CONFIG_LIMITS`) et `parseThemeColors` existants ; taille max (~4 Ko) ; nom nettoyé ; import jamais appliqué sans confirmation + aperçu.

### D2 — Que couvre « preset » ?

**Recommandé** : un preset personnalisé = **chronométrage + règles de score** (course à N, option après-casse, sans après-casse) ; **l'apparence reste un objet séparé** (cohérent avec la décision v2.7.0). Un « bundle » optionnel regroupe preset + thème pour un partage en un seul lien.

### D3 — Score : périmètre

**Recommandé (v1)** : score par joueur (+/−), **course à N manches** (optionnelle, affiche « Race to 7 »), détection de fin de manche manuelle, remise à zéro avec « Nouvelle partie ». Bouton NEW = « manche suivante » (garde le score) vs « nouveau match » (remet à 0, appui long/confirmation). Plus tard : historique des manches, nom de la rencontre/table.

### D4 — Où vit l'état de score ?

**Recommandé** : état `match` **séparé du moteur de chrono** (`src/timer/match.ts`, pur + testé), persisté en `localStorage`, ajouté au snapshot de façon **optionnelle**. Ne pas le mettre dans `TimerConfig` (ce n'est pas un réglage) ni dans `EngineState` (le moteur ne doit pas connaître le score).

---

## Phases

### Phase 0 — Fondations (0,5 j)
- [x] Analyse, `CLAUDE.md`, `ROADMAP.md`
- [ ] Ajouter `npm run typecheck` (`tsc -b --noEmit`) et un workflow CI GitHub Actions (`npm ci && npm test && npm run build`)
- [ ] Test de non-régression du **contrat de protocole** : un snapshot v2.7.1 doit toujours être accepté (rétro-compat)

### Phase 1 — Score (v2.8.0) — *prioritaire*
1. `timer/match.ts` : `MatchState { scores: {1,2}, raceTo: number|null, frame: number }`, fonctions pures `addPoint`, `removePoint`, `nextFrame`, `resetMatch`, `isMatchWon` + tests.
2. Persistance + `mergeMatch` (validation, bornes 0–99).
3. **Protocole** : `MirrorSnapshot.match?: MirrorMatch` optionnel ; `parseSnapshot` le parse explicitement (sinon le Worker le supprime) ; tests de rétro-compat ; **redéployer le Worker**.
4. UI : score dans les bandeaux joueurs (`PlayerStatus`), gros et lisible sur `DisplayView` (c'est la demande clé : *visible côté Visuel*), animation de gain de point, indicateur « manche N / course à N », bannière de victoire.
5. Réglage « Course à N » dans ⚙️ ; tutoriel + aide mis à jour.

*Critère de fin* : un point marqué sur le téléphone apparaît < 1 s sur l'écran Visuel, survit à un rechargement et à une reconnexion WebSocket.

### Phase 2 — Mode télécommande dédié (v2.9.0)
Aujourd'hui le téléphone affiche un chrono géant redondant avec l'écran. Quand une salle est ouverte (`mirror.room != null`), afficher **`RemoteControllerView`** :
- Chrono **petit** (aperçu) + état de connexion bien visible (écran lié / sync OK).
- **Grosses cibles tactiles** : Start/Pause (énorme), Nouveau coup, Après casse, Extension, bascule joueur (P1/P2 grands, couleur du joueur).
- **Score par joueur avec +/−** directement manipulable (cœur du besoin).
- Palette/typographie distinctes (« mode manette ») pour qu'on ne confonde jamais téléphone et écran Visuel ; thème de l'écran Visuel inchangé.
- Anti-erreur : Reset manche / Nouvelle partie avec appui long ou confirmation ; `navigator.wakeLock` pour garder le téléphone allumé ; retour haptique.
- Possibilité de revenir à la vue classique (bascule dans ⚙️).
- Extraire d'abord la logique de gestes de `Scoreboard.tsx` (325 lignes) dans un hook pour la réutiliser sans dupliquer.

*Point d'attention* : l'aperçu chrono du téléphone doit rester fiable même hors ligne (le moteur reste local au téléphone).

### Phase 3 — Presets personnalisés (v2.10.0)
1. Modèle `CustomPreset { id, name, timings, raceTo?, createdAt }` + `presets/storage.ts` (liste en `localStorage`, validation).
2. Refactor : `competitionMode` (union fermée) → **`presetId: string`** (intégrés `ffb|fbep|ffbTdTn|ffbMaster` + ids personnalisés) ; migration dans `mergeConfig` ; `detectCompetitionMode` gère « Personnalisé / modifié ».
3. UI ⚙️ « Presets » : créer / dupliquer (à partir d'un intégré) / renommer / supprimer ; cartes présentées comme les actuelles ; presets intégrés **non supprimables**, éditables par duplication.
4. Aperçu de ce que change le preset avant application (« 45s → 30s »).
5. Tests : migration de config, bornes, doublons, ids uniques.

### Phase 4 — Partage (v2.11.0)
1. `share/envelope.ts` : sérialisation / parsing versionné `h8:1` + tests de fuzz (JSON invalide, valeurs hors bornes, champs inconnus, payload énorme).
2. Export / import fichier (Web Share API + téléchargement).
3. **Lien `#p=`** + écran de confirmation d'import (aperçu, nom, « Ajouter à mes presets ») ; QR du lien (`QrCodeSvg` existe déjà).
4. Même mécanisme pour **l'apparence** (thème de 23 couleurs) et le **bundle**.
5. Boutons « Partager » sur chaque preset / thème personnalisé ; thèmes personnalisés nommés et sauvegardés (aujourd'hui une seule palette éditable, pas de bibliothèque).
6. *(Optionnel, si besoin réel)* codes courts via Worker + KV (option C) avec limite de débit.

### Phase 5 — Finitions pour « application terminée » (v3.0.0)
- Mode **sync préférences par salle** : proposer à l'écran Visuel d'adopter l'apparence de la télécommande (déjà le cas) ou la sienne.
- Sécurité du relais : limite de taille des messages et débit côté Worker, CORS restreint au domaine de prod, salle plus longue qu'un `sessionStorage` (persister en `localStorage` pour survivre à la fermeture de la PWA).
- Accessibilité : contrastes des thèmes personnalisés (avertissement si contraste chrono/fond insuffisant), tailles de cibles ≥ 48 px, `aria-live` sur le score.
- Tests UI de base (Vitest + Testing Library) sur la vue télécommande et l'import de preset ; test E2E Playwright du parcours contrôleur → écran.
- Mettre à jour `README`, tutoriel (slides score + partage), `CHANGELOG`, SEO si pertinent.
- Release 3.0.0.

## Risques

| Risque | Mitigation |
| --- | --- |
| Champ ajouté au snapshot « disparaît » (parse strict) ou casse d'anciens écrans PWA en cache | Champs optionnels + tests de rétro-compat + redéploiement Worker documenté |
| Import de lien/fichier malveillant ou corrompu | Validation stricte, clamp, taille max, confirmation utilisateur, jamais d'exécution/HTML |
| Refactor `competitionMode → presetId` casse les configs existantes | Migration dans `mergeConfig` + tests avant/après |
| Latence / perte de WebSocket en salle | Déjà géré (reconnexion, `seq`) ; le score doit être idempotent (envoyer l'état complet, pas des « +1 ») — c'est le cas avec le snapshot complet |
| Vue télécommande dupliquant `Scoreboard` | Extraire hooks de gestes avant la phase 2 |
