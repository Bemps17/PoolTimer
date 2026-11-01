# Changelog

Toutes les dates sont en UTC.

## 3.5.0 — 2026-11-01

- **Paysage Non · Auto · Forcé** (`viewOptions.landscape: LandscapeMode`, l'ancien booléen est relu : vrai → `auto`). `orientationLockTarget()` : `portrait` / `any` / `landscape`. En Auto, `screen.orientation.lock('any')` au lieu de `unlock()` : Chrome Android garde le manifeste d'installation (ancien `portrait`) et `unlock()` y revenait — d'où le paysage toujours bloqué en 3.4.1. Forcé : verrou paysage ; message si le navigateur refuse.
- **Score sur l'écran du téléphone** (`matchOptions.showOnPhone`, vrai par défaut ; `scoreOnPhone()`) : masqué sur l'écran de jeu (classique et côtés du paysage), toujours compté dans ⚙️ → Match (« Score en cours ») et envoyé à l'écran distant / overlay. Interrupteur principal renommé « Activer le score ».

## 3.4.1 — 2026-11-01

- **Correctif paysage** : le manifeste PWA verrouillait l'app installée en portrait (`orientation: 'portrait'`), donc tourner le téléphone ne faisait rien. Manifeste en `orientation: 'any'` ; tant que l'option paysage est désactivée, `useOrientationLock` demande le portrait (`screen.orientation.lock`, accepté par Android en app installée, ignoré ailleurs) ; option activée → `unlock()`. Logique pure `orientationLockTarget()` testée.
- Aide de l'option : la rotation automatique du téléphone doit être activée.

## 3.4.0 — 2026-11-01

- **Télécommande dédiée** (`components/RemoteControl.tsx`, salle ouverte, portrait) : aperçu en direct de l'écran distant (`RemotePreview` : joueurs, EXT, score s'il est envoyé, chiffres et couleurs d'alerte, `SyncDot`), très gros Départ / Pause, grille Nouveau coup · Extension · Après casse · Nouvelle manche, ⚙️ dans l'en-tête de l'aperçu. Plus de score sur l'écran de la télécommande.
- **Score en cours dans ⚙️ → Match** (carte en tête de l'onglet, `MatchScore` avec noms et + / −) ; option « Score sur la télécommande » (`viewOptions.remoteScore`) supprimée (ignorée à la lecture des anciennes configs).
- **Nouvelle manche à l'appui long** (`HoldButton`, 600 ms, jauge ; activation clavier directe) ; retour tactile (`haptic`) si la vibration est activée.
- **Disposition paysage** (`components/LandscapeBoard.tsx`, `viewOptions.landscape`, faux par défaut ; `boardLayout()` pur et testé ; `useIsLandscape`) : joueur 1 à gauche, chrono (ou aperçu si salle ouverte) et commandes au centre, joueur 2 à droite ; score / F / blanche / + / − sur les côtés si le score est activé.
- Ancien mode télécommande intégré à `Scoreboard` retiré. Tests : composants (Testing Library) + e2e (télécommande 360 px, paysage 780×360, score depuis ⚙️, retour en portrait).

## 3.3.1 — 2026-11-01

- **Onglets du menu ⚙️** : libellés courts **Match · Écran · Thème · Son · Plus** (les anciens « Affichage » / « Apparence » débordaient sur un vrai téléphone avec police agrandie) et **icônes Lucide** (`lucide-react` : Timer, MonitorSmartphone, Palette, Volume2, Ellipsis) à la place des emojis.
- **Texte sur une ligne** (`FitText singleLine`, `fitSingleLineFontSize`) : taille de base en `clamp()` puis réduction automatique jusqu'à tenir en largeur (ellipse seulement au-delà du minimum) ; réajusté après chargement des polices. Appliqué aux noms (accueil, réglages) et aux libellés d'onglets. « EXT », sélecteur de couleur et marges bornés en `clamp()`. « modifier » → icône crayon.
- e2e : aucun onglet ne déborde ni ne chevauche sur 360 px ; noms sur une ligne et entiers (accueil, réglages jusqu'à 32 caractères), police à 100 % et 130 %.

## 3.3.0 — 2026-11-01

- **Menu ⚙️ repensé** (QoL d’abord) : 5 onglets — Match (joueurs, chrono, score), Affichage (mode d’interface, écran distant), Apparence (thème, couleurs repliées, mes thèmes), Son, Plus (miroir, streaming, diagnostic, partage, application). Dernier onglet mémorisé.
- **Mode d’interface séparé de l’apparence** : boutons visibles / invisibles d’un côté, thème et couleurs de l’autre.
- **Contrôles** : `ToggleField` (interrupteurs, rôle `switch`), `SegmentedField` (choix segmentés), `SettingsCard` (sections toujours ouvertes), `SettingsDisclosure` (avancé replié). Options du score affichées seulement si le score est activé. Miroir et streaming convertis.
- **Correctif** : chiffres dimensionnés sur la place libre (`.timer-content`) — EXTENSION et APRÈS CASSE ne sont plus masqués quand le score et la blanche sont visibles ; boutons d’action ≥ 44 px. Couvert en e2e (360×640, 360×780, 412×915).

## 3.2.0 — 2026-11-01

- **Chrono seul par défaut** : `matchOptions.enabled = false`, `showFerme = false` ; migration ponctuelle des configs ≤ 3.1 (`defaultsVersion = 2`).
- **Voyant de synchro sans texte** (`SyncDot`, `mirror/syncLevel.ts`) : vert / orange (aller-retour > 300 ms, accusé > 3 s, état en course > 12 s) / rouge (relais coupé, pas d’écran ou de télécommande, accusé > 10 s). Écran Visuel épuré : chrono, score si activé, voyant, icône plein écran.
- **Diagnostic** (`diagnostics/log.ts`) : mesures d’aller-retour (accusés de la télécommande, pings de l’écran), compteurs, journal borné persistant exportable en `.log`, secret masqué. ⚙️ → Appareil & partage → Diagnostic ; appui sur le voyant de l’écran Visuel.
- **Batterie** (`timer/tickSchedule.ts`) : réveils alignés sur les changements d’affichage au lieu de 50 ms ; écran Visuel inactif chrono arrêté ; renvoi périodique 5 s ; voyant réévalué toutes les 2 s sans re-rendu inutile.
- **Latence** : le Worker diffuse avant d’écrire, écritures et alarme en `allowUnconfirmed`. **Worker à redéployer.** E2E : ~100 ms télécommande → écran (local).

## 3.1.0 — 2026-11-01

Suite de l’audit (TDD, scénario de bout en bout en CI).

- **Score → chrono** : marquer une manche lance la nouvelle manche du chrono avec le casseur suivant (`matchOptions.frameRestartsTimer`, oui par défaut ; `newGame(state, config, firstPlayer)`).
- **Historique des manches** (`match.frames` : vainqueur, casseur, heure) et **fenêtre de fin de match** (`MatchEndDialog`, `matchSummary`) avec partage du résultat.
- **Mode équipe** (`matchOptions.sides`), transmis à l’écran Visuel (`match.sides`, optionnel). **Worker à redéployer.**
- **Ergonomie** : réglages en 3 onglets ; cibles tactiles ≥ 44 px (scoreur compact sur 2 lignes) ; bouton « annuler » retiré de la barre de score (reste dans ⚙️ → Score) ; toast de preset limité à 2 changements.
- **Écran Visuel** : bouton plein écran dédié ; compensation de la latence (moitié de la médiane des pings).
- **Performance** : vues chargées à la demande (`React.lazy`) ; écran Visuel ≈ 88 Ko gzip au lieu de 188 ; overlay sans fondu de fond (flash sombre dans OBS).
- **Qualité** : scénario Playwright `npm run test:e2e` (télécommande → relais → écran Visuel → overlay, cibles tactiles sur 360 px) ajouté à la CI.

## 3.0.1 — 2026-11-01

- **Relais économe** (`mirror/persistence.ts`) : snapshot + séquence dans une seule clé `state`, persistée au premier push, à chaque arrêt du chrono et au plus toutes les 30 s en course ; alarme d’expiration repoussée toutes les 10 min. < 250 lignes écrites par heure de match (≈ 5 400 avant), quota gratuit Durable Objects : 100 000 / jour. **Worker à redéployer.**
- **Alertes toujours audibles** (`audio/outputRoute.ts`) : chaque son a un élément routé (gain + limiteur) et un élément direct ; le direct est utilisé tant que l’`AudioContext` n’est pas `running`, avec tentative de relance avant chaque son.

## 3.0.0 — 2026-11-01

- **Salle miroir persistante** (`localStorage`, migration depuis la session) : le lien de l’écran Visuel et l’overlay OBS survivent à la fermeture de l’app ; « Fermer la salle » l’efface.
- **Relais durci** : liste d’origines autorisées (production, aperçus Vercel du projet, localhost, `ALLOWED_ORIGINS` optionnel), messages ≤ 32 Ko, débit limité (seau à jetons), 40 écrans max par salle, nouveaux codes d’erreur `too_large` / `rate_limited` / `room_full`. **Redéployer le Worker** (`cd worker && npx wrangler deploy`).
- **Accessibilité** : alerte de contraste WCAG dans l’éditeur de couleurs ; thème Clair : orange d’alerte du chrono foncé (2,3:1 → > 4:1).
- **Tutoriel** : diapositives scoreur, streaming, partage.
- **Qualité** : CI GitHub Actions (typecheck, tests, build, sonde du relais), tests d’interface (Testing Library).

## 2.11.0 — 2026-11-01

- **Partage** de presets et de thèmes personnalisés par **lien (`#h8=…`), QR code ou fichier** `.h8preset.json` ; option « inclure mon apparence » (bundle). Format versionné `h8:1`, taille bornée, valeurs clampées, **confirmation + aperçu avant tout import** (⚙️ → Partage & import, ou ouverture directe du lien).
- **Thèmes personnalisés** nommés (20 max) : ⚙️ → Apparence → *Mes thèmes*.
- **Écran toujours allumé** sur la télécommande (salle ouverte) **et** sur l’écran Visuel : Screen Wake Lock, repli vidéo muette (`keepawake.mp4/webm`) au premier appui, statut affiché. Remplace `useWakeLock`.
- Limite : verrou manuel, économiseur de batterie ou veille système restent prioritaires.

## 2.10.1 — 2026-11-01

- **Alertes au volume maximum** : mode *Maximum* par défaut (0 dB au lieu de -10 dB, y compris pour les configs existantes), mode *Réglable* en option (⚙️ → Sons & vibration).
- **Chaîne audio** : gain +6 dB → limiteur -1 dBFS pour tous les sons (fichiers, packs, imports, Minions, synthés). Niveau moyen des fichiers embarqués relevé d’environ **+14 à +16 dB** (mesuré hors ligne).
- Bip du compte à rebours plus aigu (carré, 1,5 kHz) pour les petits haut-parleurs ; iOS : ignore l’interrupteur silencieux si possible ; bouton **Tester le volume**.
- Limite physique : le volume média du téléphone reste le plafond.

## 2.10.0 — 2026-11-01

- **Presets personnalisés** : créer, renommer, dupliquer, supprimer (30 max) depuis ⚙️ → Compétition & temps → *Mes presets*, à partir des réglages actuels ou d’un preset intégré. Course à N optionnelle. Chronométrage uniquement : thème, couleurs et sons inchangés.
- Aperçu des changements à l’application (« base 45→30 s »). Stockage local validé (`h8timer.presets`).
- **Roue crantée classique** pour le bouton Paramètres.
- Prépare le partage (Phase 4) : format de preset validé et borné.

## 2.9.0 — 2026-11-01

- **Vue télécommande** : salle miroir ouverte → vue dédiée du téléphone (bandeau de liaison, cadre accentué, grosses commandes). Le **chrono reste prioritaire**, le score est un bandeau discret (compact / grand / masqué). Écran du téléphone gardé allumé (option).
- **Écran Visuel** : mise en page pilotée depuis la télécommande — chrono en grand (défaut), équilibré, score en grand.
- **Streaming OBS / Streamlabs** : lien `/o/CODE` (source Navigateur), lecture seule, fond transparent / sombre / vert chroma ; chrono seul, score seul ou les deux ; paramètres dans l’URL (`p`, `l`, `n`, `f`, `b`, `s`, `bg`).
- Pas de redéploiement du Worker nécessaire (le champ `displayLayout` est optionnel). Redéployer reste utile pour le score (2.8.0).

## 2.8.0 — 2026-11-01

- **Scoreur 1 contre 1** (joueur ou équipe) : score avec +/− et annulation, **casses fermes (F)** en compteur séparé et en plus petit chiffre.
- **Blanche** = qui casse ; appui pour inverser ; la casse alterne à chaque manche marquée.
- **Tirage à la bande** (option) : une seule fois au début du match, désigne le premier casseur.
- Course à N optionnelle, bouton **Nouveau match** (⚙️ → Score).
- **Écran Visuel** : score en grand, F en petit, blanche sur le casseur. Champ `match` optionnel dans le snapshot (anciennes télécommandes compatibles). **Worker Cloudflare à redéployer** (`cd worker && npx wrangler deploy`).

## 2.7.1 — 2026-09-21

- **SEO** : titre et description Google axés sur le **contrôle à distance** (télécommande + écran Visuel en miroir).
- Canonical `https://pooltimer.vercel.app`, Open Graph / Twitter, `robots.txt`, `sitemap.xml`, JSON-LD WebApplication.
- Manifeste PWA H8timer aligné ; landmarks HTML (`main` / `header` / `nav`).

## 2.7.0 — 2026-09-20

- **Apparence indépendante des presets** : changer de thème ou de couleur ne réécrit plus FFB / TD/TN / Master / Ultimate.
- Les presets ne touchent qu’au chronométrage. Ils peuvent proposer une ambiance (bleu FFB, vert canard Ultimate `#007879`) à l’application, puis les couleurs se règlent librement.
- ⚙️ → **Apparence** : une couleur par zone (fond, cadre, chrono, chiffres, accent, boutons, pied de page, zones joueurs, chrome des réglages, ambiance / halo, bordures). Pipette + hex, mémorisé.
- L’écran miroir Visuel reprend les couleurs du snapshot.

## 2.6.2 — 2026-09-20

- **Réglages plus courts** : sections repliables regroupées (thèmes / apparence, sons & vibration, compétition & temps, etc.) et typographie plus dense.
- **Un seul bouton Tutoriel** en haut du menu ⚙️ (plus de doublon dans Miroir).
- **Images du tutoriel** : chemins Vite (`public/tutorial` + `BASE_URL`, import hashed en repli). SVG réécrits en UTF-8 XML valide (les fichiers Latin-1 / caractères de contrôle cassaient l’affichage dans Chrome).
- **Bandeau de mise à jour PWA** : sur mobile, « Plus tard » s’affiche sous « Mettre à jour » dans le cadre (plus de débordement).

## 2.6.1 — 2026-09-20

- **Sons d’origine restaurés** : alerte initiale (`public/sound/alert-time.mp3`), clic (`clic.mp3`), cri Arghh Minions (`minions-arghh.mp3`) déjà présents dans le dépôt avant 2.6.0.
- **Mode Minions** (appui long sur NEW) rejoue le fichier historique, sans remplacer le pack choisi. Packs Crétins / Minions-like (originaux H8timer) restent des options dans ⚙️ → Bibliothèque d’alertes.
- Pack classique par défaut = alerte initiale du dépôt. **Aucun extrait Voicemod n’est embarqué** : téléchargez-les vous-même puis Importer (l’app ne va pas les chercher).

## 2.6.0 — 2026-09-20

- **Fin de bêta** : le miroir télécommande (et l’écran Visuel) sont présentés comme des fonctions stables.
- **Tutoriel** : diaporama illustré (écran de jeu, commandes, saisie des temps, miroir télécommande ↔ Visuel), bouton « Tutoriel ».
- **Saisie clavier** des temps (base, après casse, extension, seuils, taille des chiffres) en plus des +/−, avec bornes. Pas de clavier accidentel sur l’écran de jeu.
- **Bibliothèque d’alertes** originale H8timer : Pack Crétins (original), Pack Minions-like (original), sélection fixe ou aléatoire, bips 1 s ou alerte ~5 s, son de fin distinct, import de fichiers. Aucun extrait Ubisoft / Illumination.
- **Mises à jour PWA** : « Mettre à jour » ou « Plus tard / Rester sur cette version ». Pas de vrai rollback une fois la nouvelle version installée (limitation navigateur), expliqué dans l’app.
- **Noms** : vider un nom ne réécrit plus « P1 » / « P ». Placeholder d’affichage uniquement.

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
