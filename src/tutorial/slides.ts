import { publicAssetUrl } from './assetUrl';
import slideAccueil from './assets/slide-accueil.svg?url';
import slideDouble from './assets/slide-double.svg?url';
import slideJoueurs from './assets/slide-joueurs.svg?url';
import slideMiroirRemote from './assets/slide-miroir-remote.svg?url';
import slideMiroirVisuel from './assets/slide-miroir-visuel.svg?url';
import slideReglages from './assets/slide-reglages.svg?url';
import slideTap from './assets/slide-tap.svg?url';
import slideTemps from './assets/slide-temps.svg?url';

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
  /** Vite import URL (hashed in production). */
  image: string;
  /** `public/tutorial/…` via BASE_URL — repli PWA / ancien cache. */
  imageFallback: string;
  fileName: string;
  alt: string;
}

const SLIDE_ASSETS: Record<TutorialSlideId, { fileName: string; image: string }> = {
  accueil: { fileName: 'slide-accueil.svg', image: slideAccueil },
  tap: { fileName: 'slide-tap.svg', image: slideTap },
  double: { fileName: 'slide-double.svg', image: slideDouble },
  joueurs: { fileName: 'slide-joueurs.svg', image: slideJoueurs },
  temps: { fileName: 'slide-temps.svg', image: slideTemps },
  reglages: { fileName: 'slide-reglages.svg', image: slideReglages },
  'miroir-remote': { fileName: 'slide-miroir-remote.svg', image: slideMiroirRemote },
  'miroir-visuel': { fileName: 'slide-miroir-visuel.svg', image: slideMiroirVisuel },
};

function slideImages(id: TutorialSlideId): Pick<TutorialSlide, 'image' | 'imageFallback' | 'fileName'> {
  const asset = SLIDE_ASSETS[id];
  return {
    fileName: asset.fileName,
    image: asset.image,
    imageFallback: publicAssetUrl(`tutorial/${asset.fileName}`),
  };
}

export const TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    id: 'accueil',
    title: 'Écran de jeu',
    caption: 'H8timer affiche le chrono, les deux joueurs en haut, et les commandes en bas (play, nouveau coup, NEW, ⚙️).',
    alt: 'Maquette de l’écran de jeu H8timer avec chrono et joueurs',
    ...slideImages('accueil'),
  },
  {
    id: 'tap',
    title: 'Démarrer ou pause',
    caption: 'Un appui simple sur le grand chrono : pause s’il tourne, départ s’il est à l’arrêt. Un court délai laisse passer un double appui.',
    alt: 'Flèche vers le chrono : appui simple pour play ou pause',
    ...slideImages('tap'),
  },
  {
    id: 'double',
    title: 'Nouveau coup',
    caption: 'Double appui sur l’écran, ou bouton reset : temps de base. Le chrono reste figé par défaut.',
    alt: 'Double appui et bouton reset pour un nouveau coup',
    ...slideImages('double'),
  },
  {
    id: 'joueurs',
    title: 'Joueurs, casse, extension',
    caption: 'Touchez un nom pour changer de joueur. APRÈS CASSE charge le temps post-casse. EXTENSION : une fois par joueur et par manche, chrono en cours.',
    alt: 'Bandeaux joueurs, boutons après casse et extension',
    ...slideImages('joueurs'),
  },
  {
    id: 'temps',
    title: 'Saisir les temps',
    caption: 'Dans ⚙️, les durées ont +/− et un champ : tapez au clavier (pavé numérique). Les noms s’éditent après « modifier », un nom vide est autorisé.',
    alt: 'Réglages avec champ numérique et boutons plus moins',
    ...slideImages('temps'),
  },
  {
    id: 'reglages',
    title: 'Menu configuration',
    caption: 'La roue en bas ouvre les réglages, même en boutons invisibles. Tutoriel, miroir, sons et mises à jour s’y trouvent.',
    alt: 'Bouton réglages en bas de l’écran',
    ...slideImages('reglages'),
  },
  {
    id: 'miroir-remote',
    title: 'Miroir — télécommande',
    caption: 'Sur le téléphone : ⚙️ → Miroir télécommande → Oui → Ouvrir une salle. Un code et un QR apparaissent. Gardez ce téléphone comme commande.',
    alt: 'Télécommande avec code salle et QR',
    ...slideImages('miroir-remote'),
  },
  {
    id: 'miroir-visuel',
    title: 'Miroir — écran Visuel',
    caption: 'Sur la tablette ou la TV, ouvrez pooltimer.vercel.app puis scannez le QR (ou /d/CODE). Attendez Sync OK, puis lancez le match depuis la télécommande.',
    alt: 'Télécommande liée à un grand écran Visuel, Sync OK',
    ...slideImages('miroir-visuel'),
  },
];
