export const APP_VERSION = '2.5.0';

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  notes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.5.0',
    date: '2026-09-20',
    title: 'Miroir télécommande (bêta)',
    notes: [
      'Section « Bêta / Work in progress » : miroir télécommande (code salle + QR).',
      'Écran lecture seule sur /d/CODE, thèmes FFB / FBEP synchronisés, sync Internet via Worker Cloudflare.',
    ],
  },
  {
    version: '2.4.0',
    date: '2026-09-20',
    title: 'Presets FFB TD/TN et Master',
    notes: [
      'Preset FFB TD/TN : 45s / 1:30 / +45s, alertes 20s et 5s, ambiance bleue FFB.',
      'Preset FFB Blackball Master : 30s / 1:00 / +30s, alertes 10s et 5s, ambiance bleue FFB.',
      'Ultimate FBEP : plus d’après casse (bouton masqué, temps post-casse = temps de base).',
    ],
  },
  {
    version: '2.3.2',
    date: '2026-09-20',
    title: 'Pause au tap',
    notes: [
      'Pause immédiate dès le premier appui sur l’écran (plus de délai de 300 ms).',
      'Le double appui « nouveau coup » ne s’applique plus que chrono à l’arrêt, pour ne pas relancer à la place d’une pause.',
    ],
  },
  {
    version: '2.3.1',
    date: '2026-09-20',
    title: 'Mise à jour PWA',
    notes: [
      'Détection d’une nouvelle version via version.json (même si le service worker ne prévient pas).',
      'Bouton « Mettre à jour » : activation du SW en attente, nettoyage du cache, rechargement.',
      'Bouton « Vérifier les mises à jour » dans la configuration.',
    ],
  },
  {
    version: '2.3.0',
    date: '2026-09-20',
    title: 'Interface de jeu',
    notes: [
      'Indicateurs P1 et P2 sur toute la largeur.',
      'Bouton réglages dans le pied de page, toujours visible en mode boutons invisibles.',
      'Plein écran déplacé dans la configuration (l’app installée est déjà plein écran).',
      'Chiffres du chrono plus grands, taille réglable et mémorisée.',
      'Appui long sur NEW : active ou désactive le mode Minions.',
      'Presets FFB Blackball (bleu) et Ultimate FBEP (vert canard) : 45s / +15s.',
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
