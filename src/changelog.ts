export const APP_VERSION = '3.3.1';

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  notes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '3.3.1',
    date: '2026-11-01',
    title: 'Onglets du menu : icônes modernes, plus de débordement',
    notes: [
      'Onglets du menu ⚙️ renommés en libellés courts — Match · Écran · Thème · Son · Plus — pour ne plus déborder ni se chevaucher sur les petits téléphones, même avec une grande taille de police système.',
      'Icônes vectorielles modernes (style Lucide) à la place des emojis.',
    ],
  },
  {
    version: '3.3.0',
    date: '2026-11-01',
    title: 'Menu des paramètres repensé',
    notes: [
      'Menu ⚙️ en 5 onglets, une fonction chacun : Match (joueurs, chrono, score), Affichage (mode d’interface, écran distant), Apparence (thème, couleurs, mes thèmes), Son, Plus (miroir, streaming, diagnostic, partage, application).',
      'Le mode d’interface (boutons visibles / invisibles) est séparé de l’apparence ; la personnalisation des couleurs est repliée sous le choix du thème.',
      'Plus intuitif : interrupteurs au lieu des listes Oui / Non, choix segmentés, options du score visibles seulement quand le score est activé, réglages avancés repliés, le menu rouvre sur le dernier onglet.',
      'Correctif : avec le score et la blanche affichés, les boutons EXTENSION et APRÈS CASSE ne passent plus sous la barre de commandes sur les petits téléphones.',
    ],
  },
  {
    version: '3.2.0',
    date: '2026-11-01',
    title: 'Vision allégée, voyant de synchro et diagnostic',
    notes: [
      'Par défaut, le chrono seul : le score est désactivé et, quand on l’active, les casses fermes restent masquées. Appliqué une fois aux configurations existantes.',
      'Voyant de synchro, sans texte : vert = OK, orange = latence, rouge = interrompu, sur la télécommande et sur l’écran Visuel. L’écran Visuel n’affiche plus que le chrono (plus le score s’il est activé).',
      'Diagnostic dans ⚙️ → Appareil & partage → Diagnostic (et en touchant le voyant de l’écran Visuel) : aller-retour médian / p95 / max, écrans liés, reconnexions, journal téléchargeable (.log) sans secret.',
      'Batterie : le chrono ne se recalcule plus que quand le chiffre change (environ 135 réveils pour 45 s au lieu de 900), rien chrono arrêté sur l’écran Visuel, renvois de rattrapage toutes les 5 s au lieu de 2 s.',
      'Latence : le relais diffuse l’état avant d’écrire en stockage et sans attendre la confirmation ; environ 100 ms mesurés de bout en bout en local.',
    ],
  },
  {
    version: '3.1.0',
    date: '2026-11-01',
    title: 'Fin de match, mode équipe et ergonomie',
    notes: [
      'Marquer une manche relance le chrono : nouvelle manche, extensions remises à zéro, au tour du joueur qui casse (réglable dans ⚙️ → Score).',
      'Historique des manches et fenêtre de fin de match : vainqueur, score, course à N, nombre de manches, durée, casses fermes, avec « Partager le résultat » et « Nouveau match ».',
      'Mode équipe : « Équipe A / B » à la place de « Joueur 1 / 2 » sur la télécommande, l’écran Visuel et l’overlay.',
      'Réglages en 3 onglets (Match, Apparence, Appareil & partage) ; boutons du scoreur d’au moins 44 px, même sur un téléphone de 360 px ; aperçu de preset court.',
      'Barre de score allégée : le bouton « annuler » est retiré (toujours disponible dans ⚙️ → Score), la place revient au score et aux casses fermes.',
      'Écran Visuel : bouton « Plein écran » dédié (un appui ne quitte plus le plein écran), chrono compensé de la latence réseau.',
      'Plus rapide : l’écran Visuel et l’overlay OBS chargent environ deux fois moins de code ; l’overlay n’a plus de flash sombre au chargement.',
    ],
  },
  {
    version: '3.0.1',
    date: '2026-11-01',
    title: 'Relais économe et alertes toujours audibles',
    notes: [
      'Relais : beaucoup moins d’écritures dans le stockage Cloudflare (moins de 250 par heure de match au lieu d’environ 5 400), pour ne jamais atteindre le quota gratuit quotidien. Le chrono reste diffusé en direct. Worker à redéployer.',
      'Alertes toujours audibles : si le navigateur suspend l’audio (appel, notification, écran verrouillé), l’alerte est jouée directement au lieu de rester muette, puis le volume renforcé reprend dès que l’audio est relancé.',
    ],
  },
  {
    version: '3.0.0',
    date: '2026-11-01',
    title: 'H8timer 3.0 : fiabilité, sécurité et accessibilité',
    notes: [
      'Salle miroir persistante : le code et le secret sont conservés sur l’appareil, donc le lien de l’écran Visuel et l’overlay OBS restent valables après fermeture de l’application. « Fermer la salle » l’efface.',
      'Relais plus sûr : origines autorisées (production, aperçus Vercel, localhost), messages limités à 32 Ko, débit de la télécommande limité, 40 écrans maximum par salle. Les rafales sont renvoyées automatiquement. Worker Cloudflare à redéployer.',
      'Accessibilité : alerte de contraste (WCAG) dans l’éditeur de couleurs quand le chrono ou le menu deviennent illisibles ; couleur d’alerte du thème Clair corrigée (2,3:1 → plus de 4:1).',
      'Tutoriel : trois nouvelles diapositives (scoreur, streaming OBS / Streamlabs, partage).',
      'Qualité : intégration continue GitHub Actions (typecheck, tests, build, sonde du relais) et tests d’interface (scoreur, tirage, import, contraste).',
    ],
  },
  {
    version: '2.11.0',
    date: '2026-11-01',
    title: 'Partage de presets et d’apparences, écran toujours allumé',
    notes: [
      'Partage : chaque preset ou thème personnalisé se partage par lien, QR code ou fichier .h8preset.json. Option « inclure mon apparence » pour envoyer chrono et couleurs en un seul partage.',
      'Import : ouvrir un lien de partage (ou le coller / charger un fichier dans ⚙️ → Partage & import) affiche un aperçu des changements ; rien n’est modifié sans confirmation. Contenu validé et borné.',
      'Thèmes personnalisés : enregistrez l’apparence actuelle sous un nom, réappliquez-la, partagez-la (⚙️ → Apparence → Mes thèmes).',
      'Écran toujours allumé sur la télécommande ET sur l’écran Visuel : verrou d’écran natif, avec repli vidéo muette quand le navigateur le refuse (un appui suffit). Statut affiché.',
      'Limite : bouton de verrouillage, économiseur de batterie ou réglage système de mise en veille restent prioritaires sur une PWA.',
    ],
  },
  {
    version: '2.10.1',
    date: '2026-11-01',
    title: 'Alertes sonores au volume maximum',
    notes: [
      'Volume des alertes : mode Maximum par défaut (0 dB, auparavant -10 dB), appliqué aussi aux configurations existantes. Mode Réglable disponible dans ⚙️ → Sons & vibration.',
      'Chaîne audio renforcée : gain +6 dB puis limiteur à -1 dBFS (pas de saturation). Mesuré sur les fichiers embarqués : niveau moyen relevé d’environ +14 à +16 dB par rapport à l’ancien réglage par défaut.',
      'Tous les sons passent par cette chaîne : fichiers d’alerte, packs, sons importés, mode Minions et synthétiseurs.',
      'Bip du compte à rebours plus aigu et plus riche (onde carrée, 1,5 kHz), mieux restitué par les petits haut-parleurs de smartphone ; cloche à pleine échelle.',
      'iPhone : les alertes ignorent désormais l’interrupteur silencieux quand le navigateur le permet. Bouton « Tester le volume » dans les réglages.',
      'Une page web ne peut pas dépasser le volume média du téléphone : montez-le au maximum avec les boutons de volume.',
    ],
  },
  {
    version: '2.10.0',
    date: '2026-11-01',
    title: 'Presets personnalisés et nouvelle roue crantée',
    notes: [
      'Presets personnalisés : créez, renommez, dupliquez et supprimez vos propres presets de chronométrage (jusqu’à 30), à partir de vos réglages ou d’un preset FFB / Ultimate. ⚙️ → Compétition & temps → Mes presets.',
      'Un preset peut inclure la course à N du scoreur. Il ne change jamais le thème, les couleurs ni les sons.',
      'Aperçu à l’application : la liste des temps modifiés s’affiche (par exemple base 45→30 s).',
      'Les presets sont enregistrés et validés localement ; les presets FFB / TD/TN / Master / Ultimate restent intégrés et non supprimables.',
      'Le bouton Paramètres reprend une roue crantée classique (8 dents, moyeu percé).',
    ],
  },
  {
    version: '2.9.0',
    date: '2026-11-01',
    title: 'Vue télécommande, mises en page et overlay de streaming',
    notes: [
      'Vue télécommande : quand une salle miroir est ouverte, le téléphone passe en vue dédiée (bandeau de liaison, cadre accentué, grosses commandes). Le chrono reste l’élément principal et le score devient un bandeau discret (compact, grand ou masqué).',
      'Écran Visuel : mise en page réglable depuis la télécommande (chrono en grand par défaut, équilibré, score en grand).',
      'Streaming OBS / Streamlabs : lien overlay /o/CODE à coller dans une source Navigateur. Chrono seul, score seul ou les deux, côte à côte ou empilés, taille, fond transparent / sombre / vert chroma, noms, F et blanche au choix.',
      'L’écran du téléphone reste allumé en mode télécommande (option).',
      'Réglages dans ⚙️ → Affichage télécommande & écran, et ⚙️ → Streaming. Compatible avec les anciennes télécommandes ; aucun redéploiement du Worker requis pour cette version.',
    ],
  },
  {
    version: '2.8.0',
    date: '2026-11-01',
    title: 'Scoreur 1 contre 1 : score, casses fermes et blanche',
    notes: [
      'Scoreur 1 contre 1 (joueur ou équipe) sur la télécommande : score de chaque côté avec +/−, annulation de la dernière action.',
      'Casses fermes (F) : compteur séparé du score, affiché en plus petit chiffre à côté du score.',
      'La blanche indique qui casse ; appui sur la blanche pour inverser. La casse alterne à chaque manche marquée.',
      'Option Tirage à la bande : une seule fois au début du match, pour désigner le premier casseur.',
      'Course à N optionnelle avec annonce de victoire. Réglages dans ⚙️ → Score, bouton Nouveau match.',
      'L’écran Visuel (miroir) affiche le score en grand, les F en petit et la blanche. Compatible avec les anciennes télécommandes.',
    ],
  },
  {
    version: '2.7.1',
    date: '2026-09-21',
    title: 'Référencement : télécommande et écran miroir',
    notes: [
      'SEO on-page (FR) : titre, description et Open Graph centrés sur le contrôle à distance (télécommande + écran Visuel).',
      'Canonical https://pooltimer.vercel.app, robots.txt, sitemap.xml et données structurées WebApplication.',
      'Manifeste PWA H8timer aligné ; landmarks HTML (main, header, nav) pour l’accessibilité et les crawlers.',
    ],
  },
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
