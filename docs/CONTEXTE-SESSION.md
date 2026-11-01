# Contexte de session — H8timer (reprise de travail)

> Fichier de mémoire pour reprendre le projet dans une nouvelle conversation sans rien perdre.
> **À lire en premier**, puis `CLAUDE.md` (règles) et `ROADMAP.md` (feuille de route).
> Dernière mise à jour : 2026-11-01, après la fusion de la PR #30 (v3.5.1 en production).

## 1. Où en est le projet

| Élément | État |
| --- | --- |
| Version en production | **3.5.1** (toucher du chrono en paysage, télécommande dédiée, paysage Non · Auto · Forcé, score masquable sur le téléphone) |
| Site | https://pooltimer.vercel.app (Vercel, projet `pooltimer`, déploiement automatique depuis `main`) |
| Relais miroir | Cloudflare Worker `h8timer-mirror`, version active **`f694928a-923d-4c8e-96e4-18726b0b06df`** |
| Branche de travail | `claude/app-completion-roadmap-eyqp6k` (repartie de `main`, propre) |
| Tests | 366 tests Vitest, sonde du relais, scénario e2e Playwright : tout vert (local + CI GitHub) |
| CueScore | **En attente (WIP)**, rien de codé — voir `docs/integrations/cuescore.md` |

Historique des PR fusionnées : #22 (v3.0.1), #23 (v3.1.0), #24 (v3.2.0 + v3.3.0), #25 (docs), #26 (v3.3.1), #27 (v3.4.0), #28 (v3.4.1), #29 (v3.5.0), #30 (v3.5.1).
Journal détaillé de chaque version : `CHANGELOG.md`. Versions du Worker et retours arrière : fin de `ROADMAP.md`.

## 2. Ce que veut l'utilisateur (préférences durables)

- **Langue** : tout en français (UI, commits, docs, réponses).
- **Sobriété avant tout** : par défaut **le chrono seul**. Le score est une option ; s'il est activé, les casses fermes (F) restent masquées par défaut. « Alléger la vision au maximum. »
- **Aucun texte de statut à l'écran** : synchro = **un point de couleur** (vert OK, orange latence, rouge ne marche pas). Les détails vont dans le **diagnostic** (réglages + fichier `.log`).
- **Batterie et latence** sont des priorités (pas de réveils inutiles, relais rapide).
- **Menu ⚙️ « quality of life first »** : simple, intuitif, fonctions bien séparées. Mode d'interface (boutons visibles / invisibles) **séparé** de l'apparence (thème / couleurs).
- **Méthode** : **TDD systématique** (test rouge → code → vert), vérification visuelle (captures Playwright), e2e, puis CI GitHub + aperçu Vercel via les MCP.
- **Git** : commits atomiques en français ; l'utilisateur **valide lui-même chaque fusion** dans `main` (proposer, ne pas fusionner sans son « ok »). Versionner chaque évolution visible (package.json, `public/version.json`, `src/changelog.ts`, `CHANGELOG.md`, README).

## 3. Règles métier billard (confirmées par l'utilisateur)

- Match **1 contre 1**, joueur **ou équipe** (même logique, seuls les libellés changent : « Équipe A / B »).
- **Score** (manches) et **casses fermes F** (parties parfaites sur sa propre casse) = **deux compteurs séparés**, F en plus petit chiffre.
- **Blanche** = indique qui casse ; appui dessus = inverser. **Alternance** de la casse à chaque manche marquée.
- **Tirage à la bande** (option) : **une seule fois, au début du match**, désigne le premier casseur.
- Option (activée) : marquer une manche relance le chrono (nouvelle manche, extensions remises à zéro, au tour du casseur).
- **Score** : « Activer le score » = compté dans ⚙️ et affiché sur l'écran distant ; « Score sur l'écran du téléphone » peut le masquer sur le téléphone seulement (demande de l'utilisateur, v3.5.0).
- **Télécommande** : le contrôle du temps d'abord ; pas de score sur l'écran de la télécommande (il se règle dans ⚙️ → Match) ; voir clairement ce qu'affiche l'écran distant (aperçu en direct). Paysage = option, jamais par défaut (défaut portrait).
- Le bouton « annuler » a été **retiré de la barre de score** à la demande de l'utilisateur (reste dans ⚙️ → Match → Score).
- Référence fonctionnelle du scoreur : dépôt `Bemps17/Scoreurv3` (comportement repris, pas le code).

## 4. Architecture en bref (détails dans `CLAUDE.md`)

- PWA React + Vite + TypeScript, déployée sur Vercel. Routeur `App.tsx` en `React.lazy` : `/` télécommande (`ControllerApp.tsx`), `/d/CODE` écran Visuel, `/o/CODE` overlay OBS/Streamlabs.
- Logique pure et testée : `timer/` (moteur, match, presets, thèmes, contrastes, tickSchedule), `mirror/` (protocole partagé avec le Worker, limites, persistance, latence, syncLevel, overlay), `share/` (enveloppe de partage), `diagnostics/` (journal), `audio/` (chaîne maître + repli).
- Relais : `worker/src/index.ts` (Durable Object `TimerRoom`, SQLite). Protocole rétro-compatible : tout nouveau champ du snapshot est **optionnel** et **parsé explicitement**.
- Menu ⚙️ : 5 onglets **Match · Écran · Thème · Son · Plus** ; contrôles `ToggleField`, `SegmentedField`, `SettingsCard`, `SettingsDisclosure` (`components/SettingsControls.tsx`).

## 5. Accès et outils (constatés dans les sessions précédentes)

- **GitHub** : MCP `mcp__github__*` (dépôt `Bemps17/PoolTimer`). CI : `.github/workflows/ci.yml` (jobs `test`, `relay-probe`, `e2e`).
- **Vercel** : MCP `mcp__Vercel__*`. Équipe `team_bDrALhuIP24RecBVIFibd3aV` (bemps17s-projects), projet `prj_8BH8xs4S3u5fAR3A56nvvjEFCen7` (`pooltimer`). Aperçus : `pooltimer-…-bemps17s-projects.vercel.app`.
- **Cloudflare** : plugin Cloudflare (MCP `mcp__cloudflare__execute` / `search` / `docs`), compte de l'utilisateur. Pas de `wrangler login` dans le conteneur.
  - **Déployer le Worker sans wrangler login** : `npx wrangler deploy --dry-run --minify --outdir /tmp/wbundle --config worker/wrangler.jsonc`, puis `PUT /accounts/{id}/workers/scripts/h8timer-mirror` en multipart (metadata : `main_module: index.js`, `compatibility_date: 2026-09-20`, binding `durable_object_namespace` `ROOMS` → classe `TimerRoom` **et** (depuis 3.5.2) binding `{ type: 'ratelimit', name: 'CONNECT_LIMITER', namespace_id: '1001', simple: { limit: 40, period: 60 } }`, **sans nouvelle migration**). Vérifier ensuite `/deployments` et `/content/v2`. Noter la version dans le journal de `ROADMAP.md`.
- **Réseau du conteneur** : `workers.dev`, `api.cuescore.com` et `developers.cloudflare.com` étaient bloqués → impossible de sonder le vrai relais depuis la session ; la sonde réelle se lance sur le poste de l'utilisateur : `MIRROR_WS_URL=wss://h8timer-mirror.h8timer.workers.dev npm run test:mirror`.
- **Playwright** : `playwright@1.63.0` en devDependency (navigateurs dans `/opt/pw-browsers`, ne pas réinstaller). Scripts de capture ad hoc : `NODE_PATH=$PWD/node_modules node script.cjs`.
- CI : les polices y sont rendues ~3 % plus larges qu'en local ; un texte ajusté au minimum de `FitText` peut passer en local et être tronqué en CI → garder une marge (éléments voisins en px/vw, pas en rem).
- PWA : le manifeste est en `orientation: 'any'`, mais **Chrome Android garde le manifeste d'installation** (ancien `portrait`) : `screen.orientation.unlock()` y revient. On demande donc toujours explicitement l'orientation (`useOrientationLock` : `portrait` / `any` / `landscape` selon Non · Auto · Forcé). Ne jamais remettre `orientation: 'portrait'`. Les e2e tournent en navigateur, pas en PWA installée : vérifier sur un vrai téléphone ce qui dépend du manifeste. L'utilisateur teste sur **Android, PWA installée**.
- Piège shell : `pkill -f "vite …"` peut tuer le shell courant → utiliser des motifs `"[v]ite --port 5199"`.

## 6. Commandes de vérification (avant tout push)

```bash
npx tsc -b && npm test && npm run build
npm run test:mirror      # relais local (wrangler dev)
npm run test:e2e         # télécommande → relais → écran Visuel → overlay (+ 44 px, petits écrans, journal)
```

## 7. Prochaines étapes possibles

0. **Mode télécommande dédié — choix A + D fait, implémenté et en production en v3.4.0** : A = télécommande portrait (`RemoteControl` : aperçu en direct de l'écran distant `RemotePreview`, gros Départ/Pause, actions, Nouvelle manche à l'appui long) ; score réglé dans ⚙️ → Match (carte « Score en cours » en tête). D = paysage (`LandscapeBoard`), option ⚙️ → Écran **désactivée par défaut**. Maquettes d'origine : `docs/propositions/telecommande.html`.
1. **Essai en salle** sur de vrais téléphones / TV / OBS : batterie, latence réelle, lisibilité. Récupérer les fichiers `.log` (⚙️ → Plus → Diagnostic) pour analyse.
2. **CueScore (WIP)** : phase 1 = audit de l'API publique (autoriser `api.cuescore.com` dans le réseau de la session + URL d'un tournoi public actif). Ne rien supposer (endpoints, champs, quotas). Réglage prévu : « Source du score : Manuelle / CueScore ».
3. Non retenus pour l'instant : secret de salle hors URL, traduction (anglais), codes de partage courts (Worker + KV).

## 8. Comment mettre à jour ce fichier

À la fin de chaque session importante : version en production, commit de `main`, version du Worker, nouvelles préférences ou règles métier exprimées par l'utilisateur, décisions et prochaines étapes. Garder ce fichier court et factuel.
