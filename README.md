# H8timer

Chronomètre de tir (shot clock) pour le billard / Blackball FFB. Application web installable (PWA), pensée pour mobile, tablette et ordinateur.

Version actuelle : **2.1.0** (voir [CHANGELOG.md](CHANGELOG.md)).

## Fonctionnalités

- Temps de base configurable (`tempsBase`, 45 s par défaut)
- **Après casse** configurable (`tempsApresCasse`, 90 s / 1:30 par défaut) : bouton arbitre qui charge cette durée pour le coup en cours, puis retour au temps de base au nouveau coup, au changement de joueur ou à la nouvelle manche
- Extension configurable (`tempsExtension`, +45 s par défaut, preset FFB) : **une fois par joueur et par manche**
- Deux joueurs, noms et couleurs, thèmes Sombre / Clair / Cyberpunk
- Modes boutons visibles ou tout tactile
- Alertes visuelles, sonores (Tone.js) et vibration
- Plein écran, sauvegarde automatique dans `localStorage`
- **Pas de clavier mobile pendant le match** : aucun champ texte sur l'écran de jeu ; durées via +/− dans les réglages ; noms éditables uniquement après un appui explicite « modifier »

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
```

## Installation PWA (mobile)

Depuis le menu ⚙️ → **Installer l’application** (Chrome / Edge). Sur iPhone / iPad : **Partager → Sur l’écran d’accueil**.

1. Ouvrir l'app dans Chrome (Android) ou Safari (iOS).
2. Android : bouton d’installation dans les réglages, ou menu → **Installer l'application**.
3. iOS : Partager → **Sur l'écran d'accueil**.

Les icônes 192 / 512 sont générées à partir de `billard_ball_8.svg`. Pour les régénérer :

```bash
npm run icons
```

## Déploiement Vercel

Projet Vite : build `npm run build`, sortie `dist/`. Aucune variable d'environnement n'est requise.

## Contrôles

| Action | Effet |
| --- | --- |
| Clic simple sur l'écran | Démarrer / Pause |
| Double-clic ou bouton reset | Nouveau coup (temps de base) |
| APRÈS CASSE | Charge `tempsApresCasse` pour ce coup (sans démarrer — à lancer une fois les billes arrêtées) |
| P1 / P2 | Change de joueur, temps de base (option : relance aussi le chrono) |
| EXTENSION | Ajoute `tempsExtension` (1× / joueur / manche, chrono en cours) |
| NEW | Nouvelle manche, extensions réinitialisées |
