# CLAUDE.md — H8timer (PoolTimer)

> **Reprise de session : lire d'abord [docs/CONTEXTE-SESSION.md](docs/CONTEXTE-SESSION.md)** (état, préférences de l'utilisateur, accès, prochaines étapes).

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
npm run test:e2e      # bout en bout Playwright (wrangler dev + Vite), aussi en CI
```

## Architecture

```
src/
  App.tsx                 routeur : /o/CODE -> OverlayView, /d/CODE -> DisplayView, sinon ControllerApp (React.lazy)
  ControllerApp.tsx       télécommande / app principale (scoreur, réglages, miroir, partage)
  timer/
    types.ts              TimerConfig, EngineState, Theme, CompetitionMode
    engine.ts             logique PURE (tick, start/pause, extension, après-casse) -> testée
    config.ts             défauts, limites, presets de compétition, mergeConfig (validation localStorage)
    theme.ts              23 couleurs (ThemeColors), thèmes nommés, CSS vars
  hooks/
    useBilliardTimer.ts   état moteur + config + effets (son/vibration) ; réveils via timer/tickSchedule.ts
    useMirror.ts          useControllerMirror (push) et useDisplayMirror (réception, interpolation)
  mirror/
    protocol.ts           types + parsing/validation des messages WS (partagé client ET worker)
    room.ts, relay.ts     logique de salle éphémère (partagée avec le worker)
    storage.ts            salle/secret persistants en localStorage (migration depuis sessionStorage)
  components/
    Scoreboard.tsx        écran de jeu (manette ET écran seul)
    DisplayView.tsx       écran Visuel en lecture seule (miroir)
    SettingsPanel.tsx     menu ⚙️ en 5 onglets (Match · Écran · Thème · Son · Plus)
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
- **Menu ⚙️** : 5 onglets (Match · Écran · Thème · Son · Plus). Onglets : icônes **Lucide** (`lucide-react`), libellés ≤ 5 lettres (pas d'emoji). Texte variable (noms, libellés) : une seule ligne via `<FitText singleLine>` + taille de base en `clamp()`, jamais de retour à la ligne. Booléen = `ToggleField`, 2-3 choix = `SegmentedField`, section = `SettingsCard`, rarement utilisé = `SettingsDisclosure` (`components/SettingsControls.tsx`). Pas de liste Oui/Non. Une option dépendante ne s'affiche que si son parent est actif.
- **Sobriété** : par défaut le chrono seul (score off, F off). Aucun texte de statut à l'écran : le voyant `SyncDot` (vert/orange/rouge, règles dans `mirror/syncLevel.ts`) ; les détails vont dans le diagnostic (`diagnostics/log.ts`, journaux `h8timer.log.remote` / `.display`). Pas de `setInterval` court : réveils via `timer/tickSchedule.ts`.
- **Partage** : tout contenu entrant (lien `#h8=`, fichier, texte collé) passe par `share/envelope.ts` (`decodeShareText`) puis une confirmation (`ImportDialog`) ; ne jamais appliquer directement. Écran allumé : `useKeepAwake` (Wake Lock + repli vidéo `public/keepawake.*`).
- Pas de back-end avec comptes ni base de données sans décision explicite (coût / RGPD / maintenance).
- **Audio** : tout son (fichiers `HTMLAudioElement`, imports, synthés Tone) doit passer par la chaîne maître de `toneAudio.ts` (volume → gain → limiteur -1 dBFS) via `outputRoute.ts`/`loudness.ts` ; ne pas régler `audio.volume` directement ni lire `config.volume` (utiliser `effectiveVolumeDb`). Lire un fichier via `createElementPool(...).acquire(src)` : élément routé si l'`AudioContext` tourne, sinon élément direct (un élément routé est muet tant que le contexte est suspendu).
- **Relais et quota Cloudflare** : plan gratuit = 100 000 lignes écrites/jour pour tout le compte (`put`, `delete`, `setAlarm` = 1 ligne). Toute écriture du Worker passe par `mirror/persistence.ts` ; ne jamais écrire à chaque message.
- Pas de sons ou d'assets sous droits (Voicemod, Illumination…) dans le dépôt.
- Chaque évolution visible : bump `package.json` + entrée dans `src/changelog.ts` + `CHANGELOG.md` (des tests `changelog.test.ts` / `seo.test.ts` vérifient la cohérence).
- **TDD** : test d'abord (rouge), puis code (vert). Logique dans des modules purs testés ; composants testés avec Testing Library (`// @vitest-environment jsdom` en tête de fichier `.test.tsx`). Le Worker se vérifie avec `npm run test:mirror` (limites, origines, inondation). La CI GitHub (`.github/workflows/ci.yml`) rejoue typecheck + tests + build + sonde.
- **Relais** : tout nouveau garde-fou va dans `mirror/limits.ts` (pur, testé) avant d'être branché dans `worker/src/index.ts`.

## Pièges connus

- `competitionMode` est une union fermée (`ffb | fbep | ffbTdTn | ffbMaster`) **recalculée** par `detectCompetitionMode` à chaque `mergeConfig`. Les presets personnalisés vivent à part (`timer/presets.ts`, clé `h8timer.presets`) : un preset actif est détecté par égalité des temps (`matchesPreset`), jamais stocké dans la config.
- `Theme` est aussi une union fermée, dupliquée dans `protocol.ts` (`parseDisplayConfig`) : l'étendre aux deux endroits.
- La salle miroir (code + secret) est conservée en `localStorage` (`mirror/storage.ts`, migration depuis `sessionStorage`) : le lien OBS survit à la fermeture ; seul « Fermer la salle » l'efface.
- Le Worker supprime les salles après ~2 h sans connexion (alarm DO).
- Les snapshots partent immédiatement à chaque changement, et sont renvoyés toutes les 5 s tant que le chrono tourne (rattrapage).

## Workflow Git

Développer sur la branche désignée par la tâche, commits atomiques en français (`feat(score): …`, `fix(mirror): …`), pas de PR sans demande explicite. Les fusions dans `main` (= mise en production Vercel) se font uniquement après l'accord explicite de l'utilisateur.

## Feuille de route

Voir [ROADMAP.md](ROADMAP.md) (score, mode télécommande dédié, presets personnalisés partageables).
