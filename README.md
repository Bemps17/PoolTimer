# H8timer

Chronomètre de tir (shot clock) pour le billard / Blackball FFB. Application web installable (PWA), pensée pour mobile, tablette et ordinateur.

Version actuelle : **2.6.1** (voir [CHANGELOG.md](CHANGELOG.md)).

## Fonctionnalités

- Temps de base configurable (`tempsBase`, 45 s par défaut)
- **Après casse** configurable (`tempsApresCasse`, 90 s / 1:30 par défaut) : bouton arbitre qui charge cette durée pour le coup en cours, puis retour au temps de base au nouveau coup, au changement de joueur ou à la nouvelle manche. Masqué en **Ultimate FBEP** (pas de temps supplémentaire après la casse).
- Extension configurable (`tempsExtension`, +15 s par défaut FFB / FBEP) : **une fois par joueur et par manche**
- Presets **FFB Blackball** (45s / 1:30 / +15s), **FFB TD/TN** (45s / 1:30 / +45s), **FFB Blackball Master** (30s / 1:00 / +30s) et **Ultimate FBEP** (45s / +15s, sans après casse)
- Deux joueurs, noms et couleurs, thèmes Sombre / Clair / Cyberpunk
- Modes boutons visibles ou boutons invisibles (réglages toujours accessibles)
- Taille des chiffres du chrono réglable
- Alertes visuelles, sonores et vibration. Pack **classique** (fichiers d’origine du dépôt + cloche Tone.js), Pack Crétins et Pack Minions-like (originaux H8timer), tirage aléatoire, bips 1 s ou alerte ~5 s. Import local de vos fichiers (Voicemod : téléchargement manuel, pas de fetch)
- Plein écran (dans les réglages, pour le navigateur), sauvegarde automatique dans `localStorage`
- **Pas de clavier mobile pendant le match** : aucun champ texte sur l'écran de jeu ; dans ⚙️, durées via +/− **et** saisie au clavier ; noms éditables uniquement après un appui explicite « modifier » (un nom vide est autorisé)
- **Miroir télécommande** : téléphone = commandes, tablette/PC = grand chrono, pairing code + QR, sync Internet. Tutoriel illustré : bouton **Tutoriel** (⚙️, aide, ou section Miroir).

## Lancer en local

```bash
npm install
npm run dev
```

Puis ouvrir l'URL affichée (en général `http://localhost:5173`).

### Build de production

```bash
npm install
npm run build
npm run preview
```

Le dossier `dist/` est le livrable statique, prêt pour Vercel (SPA Vite).

## Tests

```bash
npm test
npm run test:mirror
```

`test:mirror` démarre `wrangler dev` (port 8787) puis vérifie le relais WebSocket : ping→pong, push télécommande → snapshot écran, erreurs `stale_seq` / `bad_push`, second contrôleur `room_busy`. Pour viser un Worker déjà lancé :

```bash
MIRROR_WS_URL=ws://127.0.0.1:8787 npm run test:mirror
MIRROR_WS_URL=wss://h8timer-mirror.h8timer.workers.dev npm run test:mirror
```

## Installation PWA (mobile)

Depuis le menu ⚙️ → **Installer l’application** (Chrome / Edge). Sur iPhone / iPad : **Partager → Sur l’écran d’accueil**.

Quand une version plus récente est publiée, un bandeau **Nouvelle version disponible** propose **Mettre à jour** ou **Plus tard** (rester sur cette version). Le chrono en cours n’est pas rechargé tout seul. Une fois la mise à jour installée, un vrai retour à l’ancienne version n’est en général pas possible (limitation PWA / navigateur). L’app compare `public/version.json` (réseau, sans cache) à la version embarquée, en plus du service worker. Dans ⚙️ : **Vérifier les mises à jour**.

1. Ouvrir l'app dans Chrome (Android) ou Safari (iOS).
2. Android : bouton d’installation dans les réglages, ou menu → **Installer l'application**.
3. iOS : Partager → **Sur l'écran d'accueil**.

Les icônes 192 / 512 sont générées à partir de `billard_ball_8.svg`. Pour les régénérer :

```bash
npm run icons
```

## Déploiement Vercel

Projet Vite : build `npm run build`, sortie `dist/`.

### Variable d’environnement (miroir)

| Variable | Exemple | Rôle |
| --- | --- | --- |
| `VITE_MIRROR_WS_URL` | `wss://h8timer-mirror.h8timer.workers.dev` | Relais WebSocket (Cloudflare Worker + Durable Object). Sans cette variable, l’UI miroir s’affiche mais « Ouvrir une salle » reste inactif. |

Production : l’URL est dans `.env.production` (fichier versionné). Vite l’inline au build — inutile de la poser dans le dashboard Vercel.

Local :

```bash
# terminal 1
npm run mirror:dev

# terminal 2 — .env.development pointe déjà sur ws://localhost:8787
npm run dev
```

### Relais Cloudflare (gratuit Workers / Durable Objects)

Le Worker est dans `worker/` (pas de base de données). Déploiement :

```bash
cd worker
npx wrangler login
npx wrangler deploy
```

Puis copier l’URL `https://h8timer-mirror.<compte>.workers.dev` dans `VITE_MIRROR_WS_URL` (le client ajoute `/ws`).

Salles éphémères : une télécommande par code, écrans en lecture seule, snapshot renvoyé aux retards / reconnexions, expiration ~2 h d’inactivité.

Après un correctif du Worker (ex. 2.5.3, relais `push`), **redéployer** est obligatoire : l’app Vercel ne suffit pas, le Durable Object tourne sur Cloudflare.

## Utiliser le miroir (arbitre)

Le tutoriel pas à pas est dans l’app : bouton **Tutoriel** (diaporama) et **⚙️ → Mode d’emploi**.

1. **Télécommande** (téléphone) : Miroir télécommande **Oui** → **Ouvrir une salle** (code + QR).
2. **Écran Visuel** : ouvrir [https://pooltimer.vercel.app](https://pooltimer.vercel.app), scanner le QR ou aller sur `/d/CODE`.
3. Attendre **Écran lié · sync OK** / **Sync OK**, puis lancer le match sur le téléphone.

Pas besoin du même Wi‑Fi (sync Internet). Une seule télécommande par salle. Si ça bloque : fermer la salle, en ouvrir une nouvelle.

## Contrôles

| Action | Effet |
| --- | --- |
| Clic simple sur l'écran (chrono en cours) | Pause (après un court délai, pour distinguer le double appui) |
| Clic simple sur l'écran (à l'arrêt) | Démarrer (même délai) |
| Double-clic, ou bouton reset | Nouveau coup (temps de base ; chrono figé par défaut, option auto-start) |
| APRÈS CASSE | Charge `tempsApresCasse` pour ce coup (sans démarrer — à lancer une fois les billes arrêtées) |
| P1 / P2 (bandeau) | Change de joueur, temps de base (option : relance aussi le chrono). Nom vide → affichage « Joueur 1 / 2 » |
| EXTENSION | Ajoute `tempsExtension` (1× / joueur / manche, chrono en cours) |
| NEW | Nouvelle manche ; appui long : active / désactive le mode Minions (cri Arghh historique) |
| ⚙️ (pied de page) | Ouvre la configuration (reste visible en boutons invisibles) |

## Sons

- **Pack classique (défaut)** : alerte initiale et clics déjà dans le dépôt (`public/sound/alert-time.mp3`, `clic.mp3`), plus la cloche / les bips Tone.js.
- **Mode Minions** : appui long sur **NEW** (ou ⚙️ → Automatisation une fois déverrouillé). Rejoue `public/sound/minions-arghh.mp3` à la première alerte orange.
- **Pack Crétins** et **Pack Minions-like (original)** : options supplémentaires dans ⚙️ → Bibliothèque d’alertes.
- **Import** : ⚙️ → Bibliothèque d’alertes → Importer un fichier audio. Les extraits Voicemod / « funny » doivent être téléchargés par vos soins ; l’app ne les récupère pas (droits d’auteur).
