# Changelog

Toutes les dates sont en UTC.

## 2.5.6 — 2026-09-20

- **Surface plus large** : moins de marge latérale ; le tableau occupe presque toute la largeur téléphone / tablette.
- Le `max-width` 500 px et le `95vw` sont remplacés par un remplissage du viewport (plafond 72 rem / ~1152 px sur grand écran).
- Padding du cadre, des bandeaux P1/P2 et de la rangée de boutons réduit ; les insets d’encoche (`safe-area`) restent.
- Plein écran et écran miroir Visuel inchangés dans le principe, avec des gouttières décoratives plus petites.

## 2.5.5 — 2026-09-20

- **Noms de joueurs** : prénom + nom jusqu’à 32 caractères (plus de limite à 5 lettres).
- Sur le tableau et l’écran miroir, la **taille de police s’adapte** à la longueur pour éviter la coupure.
- Les noms courts restent grands et lisibles.
- **Tutoriel miroir** (télécommande ↔ écran Visuel) dans le Mode d’emploi et ⚙️ → Bêta : pairing code/QR, Sync OK, Internet (pas le même Wi‑Fi), URL de production, nouvelle salle si ça bloque.

## 2.5.4 — 2026-09-20

- **Simple vs double appui** : la pause (ou le départ) n’est confirmée que si aucun second tap n’arrive dans la fenêtre — le double appui n’est plus volé par la pause.
- Le délai de confirmation survit au tick du chrono (plus de pause « avalée » tant que le temps défile).
- Double appui sur l’écran (chrono en cours ou à l’arrêt) : **nouveau coup**.
- Après reset / double appui, le chrono **reste figé par défaut**. Option « Redémarrage auto après nouveau coup » (désactivée par défaut).

## 2.5.3 — 2026-09-20

- **Miroir** : le relais transmet les `push` de la télécommande vers l’écran (chrono plus bloqué à 00:00).
- Accusé `push_ok` + erreurs explicites (`bad_push`, `unauthorized`, `stale_seq`) au lieu d’un drop silencieux.
- Indicateur de connexion / sync (télécommande et écran) et probe `npm run test:mirror`.
- **Worker Cloudflare à redéployer** (`cd worker && npx wrangler deploy`).

## 2.5.2 — 2026-09-20

- **Miroir** : l’écran `/d/CODE` recompte bien quand la télécommande lance le chrono, même après une reconnexion.
- Interpolation locale à l’heure de réception (plus de mélange d’horloges télécommande / écran).
- **Worker Cloudflare à redéployer** (`worker/`) : le Durable Object réinitialise `seq` au claim de la télécommande.

## 2.5.1 — 2026-09-20

- URL du **relais miroir** configurée pour la production (`VITE_MIRROR_WS_URL` dans `.env.production`).

## 2.5.0 — 2026-09-20

- **Miroir télécommande (bêta)** : code salle + QR, écran lecture seule (`/d/CODE`).
- Sync Internet (Cloudflare Durable Object), thème / ambiance FFB et FBEP repris sur l’écran.

## 2.4.0 — 2026-09-20

- Preset **FFB TD/TN** : 45s / 1:30 / +45s, alertes 20s / 5s, ambiance bleue FFB.
- Preset **FFB Blackball Master** : 30s / 1:00 / +30s, alertes 10s / 5s, ambiance bleue FFB.
- **Ultimate FBEP** : pas d’après casse (bouton masqué, temps post-casse aligné sur le temps de base).

## 2.3.2 — 2026-09-20

- **Pause** immédiate au premier appui sur l’écran (plus de conflit avec le double-tap / auto-start).
- Double appui « nouveau coup » uniquement quand le chrono est à l’arrêt.

## 2.3.1 — 2026-09-20

- Détection d’une **nouvelle version** via `version.json` (même si le service worker ne prévient pas).
- **Mettre à jour** active le SW en attente, vide le cache de l’origine, puis recharge.
- Bouton **Vérifier les mises à jour** dans la configuration.

## 2.3.0 — 2026-09-20

- Indicateurs **P1** et **P2** sur toute la largeur.
- Bouton **réglages** dans le pied de page, toujours visible en mode boutons invisibles.
- **Plein écran** déplacé dans la configuration (l’application installée est déjà plein écran).
- Chiffres du chrono plus grands, **taille réglable** et mémorisée.
- Appui long sur **NEW** : active ou désactive le mode Minions.
- Presets **FFB Blackball** (ambiance bleue) et **Ultimate FBEP** (vert canard) : 45s / +15s.

## 2.2.0 — 2026-09-20

- Notification **Nouvelle version disponible** avec bouton **Mettre à jour** (le match n’est pas rechargé tout seul).

## 2.1.0 — 2026-09-20

- Nom affiché de l’application : **H8timer**.
- Option **Relancer le chrono au clic joueur**.
- Easter egg Minions (appui long sur NEW) : cri Arghh à la première alerte.
- Bouton **Installer l’application** dans les réglages (PWA / hors ligne).
- Historique des versions dans la configuration.

## 2.0.0 — 2026-09-20

- Refonte React + Vite, application installable (PWA).
- Après casse FFB, extension une fois par joueur et par manche.
- Thèmes, mode tactile, alertes sonores et vibration.
