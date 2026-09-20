export const APP_VERSION = '2.7.0';

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  notes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.7.0',
    date: '2026-09-20',
    title: 'Apparence indépendante des presets',
    notes: [
      'Choisir un thème ou une couleur ne change plus les presets de compétition (FFB, TD/TN, Master, Ultimate FBEP).',
      'Les presets ne règlent que le chronométrage. Ils peuvent suggérer une ambiance (bleu FFB, vert canard Ultimate #007879) une fois, puis l’apparence se personnalise librement.',
      '⚙️ → Apparence : couleurs par zone (fond, cadre, chrono, chiffres, accent, boutons, pied de page, zones joueurs, menu réglages, ambiance / halo, bordures). Pipette + hex, mémorisées.',
      'L’écran miroir Visuel reçoit les couleurs du tableau via le snapshot.',
    ],
  },
  {
    version: '2.6.2',
    date: '2026-09-20',
    title: 'Réglages compacts et tutoriel illustré',
    notes: [
      'Menu ⚙️ regroupé en sections repliables (joueurs, compétition & temps, apparence, sons & vibration, automatisation, miroir, application) avec une mise en page plus dense.',
      'Un seul bouton « Tutoriel », toujours visible en haut du menu Configuration.',
      'Illustrations du diaporama : chemins public/tutorial via BASE_URL, fichiers SVG UTF-8 valides (plus de Latin-1 / caractères de contrôle), import Vite hashed en repli, sans data-URL cassée.',
      'Bandeau PWA : sur mobile (~390 px), « Plus tard » passe sous « Mettre à jour », dans le même cadre (flex-wrap / colonne), sans débordement.',
    ],
  },
  {
    version: '2.6.1',
    date: '2026-09-20',
    title: 'Alertes d’origine et Minions restaurés',
    notes: [
      'Restauration des sons déjà présents dans le dépôt : alerte initiale (alert-time.mp3), clic (clic.mp3), et cri Arghh Minions (minions-arghh.mp3).',
      'L’appui long sur NEW réactive le mode Minions historique (pas le pack Minions-like généré). Packs Crétins / Minions-like originaux toujours disponibles dans ⚙️.',
      'Par défaut, le pack classique rejoue l’alerte initiale du dépôt. Les extraits Voicemod « funny » ne sont pas embarqués : téléchargez-les vous-même puis Importer (l’app ne va pas les chercher).',
    ],
  },
  {
    version: '2.6.0',
    date: '2026-09-20',
    title: 'Tutoriel, sons originaux et saisie clavier',
    notes: [
      'Le miroir télécommande n’est plus présenté comme une bêta : réglages, aide, écran Visuel et tutoriel parlent d’une fonction prête à l’emploi.',
      'Bouton « Tutoriel » : diaporama illustré (écran de jeu, commandes, saisie des temps, miroir télécommande ↔ Visuel).',
      'Les durées (temps de base, après casse, extension, alertes, taille des chiffres) se tapent au clavier en plus des +/−, avec contrôle des bornes. Pas de clavier accidentel sur l’écran de jeu.',
      'Bibliothèque d’alertes originale H8timer : Pack Crétins (original), Pack Minions-like (original), tirage fixe ou aléatoire, bips chaque seconde ou un son ~5 s, son de fin distinct, import de vos fichiers. Aucun extrait Ubisoft / Illumination.',
      'Mise à jour PWA : « Mettre à jour » ou « Plus tard / Rester sur cette version ». Un retour vers une version déjà remplacée n’est en général pas possible (limitation navigateur).',
      'Noms : un champ vidé reste vide (plus de P1 / P réinjectés). L’écran affiche « Joueur 1 / 2 » uniquement en placeholder.',
    ],
  },
  {
    version: '2.5.6',
    date: '2026-09-20',
    title: 'Surface plus large',
    notes: [
      'Moins de marge latérale : le tableau utilise presque toute la largeur du téléphone et de la tablette (safe-area / encoche conservée).',
      'Les bandeaux P1/P2, le cadre et la rangée de boutons s’élargissent ; les noms longs ont plus de place (police auto 2.5.5 inchangée).',
      'Plein écran et écran miroir Visuel conservent leurs insets, sans bande décorative excessive.',
    ],
  },
  {
    version: '2.5.5',
    date: '2026-09-20',
    title: 'Noms longs et tutoriel miroir',
    notes: [
      'Les noms acceptent prénom et nom (jusqu’à 32 caractères), plus seulement 5 lettres.',
      'Sur le tableau et l’écran miroir, la taille de police se réduit pour que le nom tienne dans le bandeau P1/P2.',
      'Les noms courts (P1, Alex…) restent à la taille habituelle.',
      'Mode d’emploi du miroir (télécommande ↔ écran Visuel) : étapes de pairing, Sync OK et pannes courantes, dans l’aide et ⚙️ → Bêta.',
    ],
  },
  {
    version: '2.5.4',
    date: '2026-09-20',
    title: 'Double appui et reset figé',
    notes: [
      'Simple appui vs double appui : le tap unique (pause ou départ) n’est confirmé que si aucun second tap n’arrive dans la fenêtre.',
      'Le délai de confirmation n’est plus annulé par le décompte (tick 50 ms), ce qui empêchait la pause au tap tant que le chrono tournait.',
      'Double appui sur l’écran (chrono en cours ou à l’arrêt) : nouveau coup.',
      'Après reset / double appui, le chrono reste figé par défaut. Option « Redémarrage auto après nouveau coup » pour relancer (désactivée par défaut).',
    ],
  },
  {
    version: '2.5.3',
    date: '2026-09-20',
    title: 'Miroir : relais push + indicateur de sync',
    notes: [
      'Le relais Cloudflare transmet bien les pushes télécommande → écran (plus de chrono bloqué à 00:00).',
      'Erreur explicite si push refusé (bad_push, unauthorized, stale_seq) au lieu d’un drop silencieux.',
      'Indicateur de connexion / sync sur la télécommande (« Écran lié · sync OK ») et sur l’écran.',
      'Redéployer le Worker Cloudflare (`cd worker && npx wrangler deploy`) : le correctif relais n’est actif qu’après ce deploy.',
    ],
  },
  {
    version: '2.5.2',
    date: '2026-09-20',
    title: 'Miroir : décompte figé',
    notes: [
      'L’écran miroir recompte quand la télécommande lance le chrono, y compris après une reconnexion.',
      'Le relais accepte à nouveau les pushes après reconnect (seq du welcome + reset seq au claim).',
      'Décompte interpolé à l’heure de réception sur l’écran, sans dépendre d’horloges identiques.',
      'Redéployer le Worker Cloudflare (`worker/`) pour le reset de seq côté Durable Object.',
    ],
  },
  {
    version: '2.5.1',
    date: '2026-09-20',
    title: 'Relais miroir production',
    notes: [
      'URL du relais WebSocket Cloudflare configurée pour la production (VITE_MIRROR_WS_URL).',
    ],
  },
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
