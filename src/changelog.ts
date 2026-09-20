export const APP_VERSION = '2.3.0';

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  notes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.3.0',
    date: '2026-09-20',
    title: 'Interface de jeu',
    notes: [
      'Indicateurs P1 et P2 sur toute la largeur.',
      'Bouton réglages dans le pied de page, toujours visible en mode boutons invisibles.',
      'Plein écran déplacé dans la configuration (l’app installée est déjà plein écran).',
      'Chiffres du chrono plus grands, taille réglable et mémorisée.',
    ],
  },
  {
    version: '2.2.0',
    date: '2026-09-20',
    title: 'Mise à jour PWA',
    notes: [
      'Notification « Nouvelle version disponible » avec bouton Mettre à jour (sans rechargement forcé).',
    ],
  },
  {
    version: '2.1.0',
    date: '2026-09-20',
    title: 'H8timer',
    notes: [
      'Nom affiché de l’application : H8timer.',
      'Option « Relancer le chrono au clic joueur » (sélection + temps de base + départ).',
      'Easter egg Minions : appui long sur NEW, puis cri Arghh à la première alerte.',
      'Bouton « Installer l’application » dans les réglages (PWA / hors ligne).',
      'Historique des versions accessible depuis la configuration.',
    ],
  },
  {
    version: '2.0.0',
    date: '2026-09-20',
    title: 'React / PWA',
    notes: [
      'Refonte en React + Vite, application installable (PWA).',
      'Après casse FFB (1:30), extension une fois par joueur et par manche.',
      'Thèmes, mode tactile, alertes sonores et vibration.',
    ],
  },
];
