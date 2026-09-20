export type TutorialSlideId =
  | 'accueil'
  | 'tap'
  | 'double'
  | 'joueurs'
  | 'temps'
  | 'reglages'
  | 'miroir-remote'
  | 'miroir-visuel';

export interface TutorialSlide {
  id: TutorialSlideId;
  title: string;
  caption: string;
  image: string;
  alt: string;
}

export const TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    id: 'accueil',
    title: 'Écran de jeu',
    caption: 'H8timer affiche le chrono, les deux joueurs en haut, et les commandes en bas (play, nouveau coup, NEW, ⚙️).',
    image: '/tutorial/slide-accueil.svg',
    alt: 'Maquette de l’écran de jeu H8timer avec chrono et joueurs',
  },
  {
    id: 'tap',
    title: 'Démarrer ou pause',
    caption: 'Un appui simple sur le grand chrono : pause s’il tourne, départ s’il est à l’arrêt. Un court délai laisse passer un double appui.',
    image: '/tutorial/slide-tap.svg',
    alt: 'Flèche vers le chrono : appui simple pour play ou pause',
  },
  {
    id: 'double',
    title: 'Nouveau coup',
    caption: 'Double appui sur l’écran, ou bouton reset : temps de base. Le chrono reste figé par défaut.',
    image: '/tutorial/slide-double.svg',
    alt: 'Double appui et bouton reset pour un nouveau coup',
  },
  {
    id: 'joueurs',
    title: 'Joueurs, casse, extension',
    caption: 'Touchez un nom pour changer de joueur. APRÈS CASSE charge le temps post-casse. EXTENSION : une fois par joueur et par manche, chrono en cours.',
    image: '/tutorial/slide-joueurs.svg',
    alt: 'Bandeaux joueurs, boutons après casse et extension',
  },
  {
    id: 'temps',
    title: 'Saisir les temps',
    caption: 'Dans ⚙️, les durées ont +/− et un champ : tapez au clavier (pavé numérique). Les noms s’éditent après « modifier », un nom vide est autorisé.',
    image: '/tutorial/slide-temps.svg',
    alt: 'Réglages avec champ numérique et boutons plus moins',
  },
  {
    id: 'reglages',
    title: 'Menu configuration',
    caption: 'La roue en bas ouvre les réglages, même en boutons invisibles. Tutoriel, miroir, sons et mises à jour s’y trouvent.',
    image: '/tutorial/slide-reglages.svg',
    alt: 'Bouton réglages en bas de l’écran',
  },
  {
    id: 'miroir-remote',
    title: 'Miroir — télécommande',
    caption: 'Sur le téléphone : ⚙️ → Miroir télécommande → Oui → Ouvrir une salle. Un code et un QR apparaissent. Gardez ce téléphone comme commande.',
    image: '/tutorial/slide-miroir-remote.svg',
    alt: 'Télécommande avec code salle et QR',
  },
  {
    id: 'miroir-visuel',
    title: 'Miroir — écran Visuel',
    caption: 'Sur la tablette ou la TV, ouvrez pooltimer.vercel.app puis scannez le QR (ou /d/CODE). Attendez Sync OK, puis lancez le match depuis la télécommande.',
    image: '/tutorial/slide-miroir-visuel.svg',
    alt: 'Télécommande liée à un grand écran Visuel, Sync OK',
  },
];
