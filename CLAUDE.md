# CLAUDE.md — H8timer (PoolTimer)

Chronomètre de tir (shot clock) billard / Blackball FFB, PWA React. Langue de l'UI, des commits et de la doc : **français**. Version courante : voir `package.json` / `src/changelog.ts`.

## Commandes

```bash
npm ci                # installer
npm run dev           # Vite (http://localhost:5173)
npm test              # vitest run (tests unitaires + composants jsdom, doit rester vert)
npx tsc -b            # typecheck (fait aussi partie de `npm run build`)
npm run build         # tsc -b && vite build -> dist/
npm run mirror:dev    # Worker Cloudflare local (ws://localhost:8787), .env.development le cible
npm run test:mirror   # sonde le relais WebSocket (wrangler dev)
```

## Architecture

```
src/
  App.tsx                 route : /d/CODE -> DisplayView, sinon ControllerApp
  timer/
    types.ts              TimerConfig, EngineState, Theme, CompetitionMode
    engine.ts             logique PURE (tick, start/pause, extension, après-casse) -> testée
    config.ts             défauts, limites, presets de compétition, mergeConfig (validation localStorage)
    theme.ts              23 couleurs (ThemeColors), thèmes nommés, CSS vars
  hooks/
    useBilliardTimer.ts   état moteur + config + effets (son/vibration) + tick 50 ms
    useMirror.ts          useControllerMirror (push) et useDisplayMirror (réception, interpolation)
  mirror/
    protocol.ts           types + parsing/validation des messages WS (partagé client ET worker)
    room.ts, relay.ts     logique de salle éphémère (partagée avec le worker)
    storage.ts            salle/secret en sessionStorage, miroir activé en localStorage
  components/
    Scoreboard.tsx        écran de jeu (manette ET écran seul)
    DisplayView.tsx       écran Visuel en lecture seule (miroir)
    SettingsPanel.tsx     menu ⚙️ (sections repliables)
    MirrorSettings.tsx    ouverture de salle, QR, lien
  audio/                  Tone.js + packs d'alertes + sons importés
  pwa/                    mises à jour / installation
worker/src/index.ts       Cloudflare Worker + Durable Object `TimerRoom` (relais, PAS de base de données)
```

### Miroir télécommande (flux actuel)

Contrôleur (téléphone) → `push {seq, snapshot}` → Durable Object → `snapshot` → écrans `/d/CODE` (lecture seule, 1 contrôleur max par salle, secret en query).
`MirrorSnapshot` = état moteur + `MirrorDisplayConfig` (sous-ensemble de `TimerConfig`). L'écran interpole localement (`remainingFromSnapshot`).

## Règles du projet

- **Moteur pur** : toute logique de chrono va dans `timer/engine.ts` avec test, pas dans les composants.
- **`protocol.ts` est un contrat partagé** avec le Worker (il l'importe via `../../src/...`). Tout champ ajouté au snapshot doit être : ajouté au type, **parsé explicitement dans `parseSnapshot`/`parseDisplayConfig`** (les champs inconnus sont supprimés), **optionnel/rétro-compatible** (anciens écrans PWA en cache), testé dans `protocol.test.ts`. Après changement de protocole : **redéployer le Worker** (`cd worker && npx wrangler deploy`) — le déploiement Vercel ne suffit pas.
- **Toute donnée persistée/importée passe par une fonction de validation** du style `mergeConfig` (clamp, valeurs par défaut). Ne jamais faire confiance à du JSON externe (localStorage, import de fichier, lien partagé).
- **Presets = chronométrage uniquement ; apparence = indépendante** (décision v2.7.0). Ne pas re-coupler les deux.
- **Pas de clavier mobile pendant le match** : aucun `<input>` texte sur l'écran de jeu.
- **Partage** : tout contenu entrant (lien `#h8=`, fichier, texte collé) passe par `share/envelope.ts` (`decodeShareText`) puis une confirmation (`ImportDialog`) ; ne jamais appliquer directement. Écran allumé : `useKeepAwake` (Wake Lock + repli vidéo `public/keepawake.*`).
- Pas de back-end avec comptes ni base de données sans décision explicite (coût / RGPD / maintenance).
- **Audio** : tout son (fichiers `HTMLAudioElement`, imports, synthés Tone) doit passer par la chaîne maître de `toneAudio.ts` (volume → gain → limiteur -1 dBFS) via `outputRoute.ts`/`loudness.ts` ; ne pas régler `audio.volume` directement ni lire `config.volume` (utiliser `effectiveVolumeDb`). Un élément routé dépend du `AudioContext` (relancé sur `visibilitychange` / `pointerdown`).
- Pas de sons ou d'assets sous droits (Voicemod, Illumination…) dans le dépôt.
- Chaque évolution visible : bump `package.json` + entrée dans `src/changelog.ts` + `CHANGELOG.md` (des tests `changelog.test.ts` / `seo.test.ts` vérifient la cohérence).
- **TDD** : test d'abord (rouge), puis code (vert). Logique dans des modules purs testés ; composants testés avec Testing Library (`// @vitest-environment jsdom` en tête de fichier `.test.tsx`). Le Worker se vérifie avec `npm run test:mirror` (limites, origines, inondation). La CI GitHub (`.github/workflows/ci.yml`) rejoue typecheck + tests + build + sonde.
- **Relais** : tout nouveau garde-fou va dans `mirror/limits.ts` (pur, testé) avant d'être branché dans `worker/src/index.ts`.

## Pièges connus

- `competitionMode` est une union fermée (`ffb | fbep | ffbTdTn | ffbMaster`) **recalculée** par `detectCompetitionMode` à chaque `mergeConfig`. Les presets personnalisés vivent à part (`timer/presets.ts`, clé `h8timer.presets`) : un preset actif est détecté par égalité des temps (`matchesPreset`), jamais stocké dans la config.
- `Theme` est aussi une union fermée, dupliquée dans `protocol.ts` (`parseDisplayConfig`) : l'étendre aux deux endroits.
- La salle miroir (code + secret) est conservée en `localStorage` (`mirror/storage.ts`, migration depuis `sessionStorage`) : le lien OBS survit à la fermeture ; seul « Fermer la salle » l'efface.
- Le Worker supprime les salles après ~2 h sans connexion (alarm DO).
- Les snapshots sont renvoyés toutes les 2 s tant que le chrono tourne, et à chaque changement de `config` (toute modif de réglage est poussée).

## Workflow Git

Développer sur la branche désignée par la tâche, commits atomiques en français (`feat(score): …`, `fix(mirror): …`), pas de PR sans demande explicite.

## Feuille de route

Voir [ROADMAP.md](ROADMAP.md) (score, mode télécommande dédié, presets personnalisés partageables).
