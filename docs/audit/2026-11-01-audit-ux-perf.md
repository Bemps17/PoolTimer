# Audit design, parcours, UX / UI / QoL et performances — v3.5.1

Date : 2026-11-01. Méthode : captures Playwright (390×844), parcours chronométrés en appuis, mesures sur build de production (`vite preview`) avec mobile simulé (CPU ×4, 4G lente 1,6 Mb/s, 150 ms), métriques Chrome DevTools, sourcemaps. Planche : `2026-11-01-planche.png`.

## 1. Performances

| Mesure | Résultat | Verdict |
| --- | --- | --- |
| JS télécommande (gzip) | ~180 ko (React 77 ko + app 103 ko) | correct |
| Premier affichage télécommande (mobile ×4, 4G lente, 1ʳᵉ visite) | FCP / LCP 2,6 s, chrono visible 2,7 s | moyen |
| Premier affichage écran Visuel (idem) | 1,35 s, 58 nœuds | très bon |
| Visites suivantes | instantané (service worker, 87 fichiers / 1,5 Mo en cache) | très bon |
| CPU chrono arrêté / en marche | 0,6 % / 1,8 % (script 64 ms par 10 s) | très bon |
| Mémoire JS | 7,2 Mo | très bon |
| Stabilité visuelle (CLS) | 0,019 / 0,006 | très bon |

Constats :

- **P1 — Tone.js chargé d'emblée** : Tone + `standardized-audio-context` = ~230 ko (≈ 60 ko gzip) dans le premier chargement, alors que le son ne sert qu'après le premier appui. Chargement différé → gain estimé ≈ 0,3–0,5 s sur 4G lente.
- **P1 — Polices Google bloquantes** : feuille `fonts.googleapis.com` bloquante au premier affichage (connexion à 2 domaines tiers), polices absentes hors ligne tant qu'elles n'ont pas été vues une fois en ligne, et transfert d'IP vers Google (sujet RGPD / CNIL). Héberger Poppins 600 + Chakra Petch 700 en woff2 dans l'app (≈ 40 ko, en cache hors ligne dès l'installation).
- **P2 — Menu ⚙️ re-rendu à chaque seconde, même fermé** : ~200 nœuds montés en permanence ; React réécrit les attributs `name` / `type` de 8 champs à chaque tic (250 mutations DOM / 10 s). Impact faible (1,8 % CPU) mais batterie gaspillée : ne monter le contenu qu'à l'ouverture (ou mémoïser).
- **P3 — Sons du cache** : 690 ko dont deux WAV de 220 ko (alertes 5 s) ; en Opus / MP3 ≈ 30 ko chacun → cache de 1,5 Mo à ~1,1 Mo.

## 2. Parcours (nombre d'appuis)

| Tâche | Appuis | Remarque |
| --- | --- | --- |
| Lancer le chrono (1ʳᵉ ouverture) | 1 | idéal |
| Ouvrir une salle et obtenir le QR | 5 (⚙️ → Plus → Miroir → Activer le miroir → Ouvrir une salle) | l'interrupteur « Activer le miroir » est une étape en trop |
| Marquer une manche en mode télécommande | 3 (⚙️ → + → fermer) | voulu (temps prioritaire), mais lent en match |
| Changer de preset | 2–3 | bien |
| Activer le paysage | 3 | bien |

- **P1 — Miroir caché dans « Plus »** : c'est la fonction phare (télécommande + écran distant) mais elle est rangée avec le diagnostic et le partage, alors que l'onglet **Écran** a déjà une carte « Écran distant ». Regrouper : ouverture de salle + QR + lien dans **Écran → Écran distant** ; « Plus » garde streaming, diagnostic, partage, application.
- **P1 — Supprimer l'interrupteur « Activer le miroir »** : un seul bouton « Ouvrir une salle » (5 → 3 appuis).
- **P2 — Score en match** : garder l'écran de la télécommande sans score, mais offrir un raccourci : appui long sur le nom d'un joueur = +1 manche (avec retour visuel et vibration), ou petit bouton « Score » dans l'en-tête de l'aperçu qui ouvre directement « Score en cours ».

## 3. Design / UI

Points forts : hiérarchie claire (chrono énorme, Départ très visible), voyant sans texte, couleurs d'alerte cohérentes entre téléphone, aperçu et écran Visuel, onglets Lucide nets, cibles ≥ 44 px partout (vérifié en e2e).

- **P1 — Toast « Paramètres sauvegardés ! » à chaque réglage** : il apparaît à chaque interrupteur, et même après un +1 au score ; il masque l'en-tête (et l'aperçu « Écran distant » après fermeture du menu). Contraire à la sobriété voulue : la sauvegarde est automatique, le toast doit disparaître (le garder seulement pour import, copie de lien, erreurs).
- **P2 — « Streaming (OBS / Streamlabs) » toujours déplié** : longue carte (contenu, disposition, taille, fond, noms, F, blanche) visible même sans salle ouverte. Règle du projet : une option dépendante ne s'affiche que si son parent est actif → la replier (`SettingsDisclosure`) et ne l'afficher qu'avec une salle ouverte.
- **P2 — Barre de commandes classique peu contrastée** : icônes Départ / Nouveau coup gris-vert sur fond sombre (Départ à 60 % d'opacité à l'arrêt) ; « NEW » en rouge ressemble à une alerte. Départ plein vert à l'arrêt, « NEW » neutre.
- **P3 — Noms en double sur la télécommande** : les joueurs apparaissent dans l'aperçu ET dans la rangée de sélection juste dessous. Acceptable (l'aperçu montre ce que voit l'écran distant), à surveiller sur petit écran (320 px).
- **P3 — En-tête « Configuration » + bouton « Tutoriel »** : le tutoriel occupe une place de choix à chaque ouverture ; il pourrait aller dans Plus → Aide.

## 4. QoL

- **P2 — Pas d'annulation après un +1 sur la télécommande** (« Annuler la dernière action » est en bas de la carte Score, après de nombreuses options) : la placer dans « Score en cours ».
- **P2 — Voyant rouge sans écran connecté** : normal, mais en début de match la télécommande paraît « en panne ». Un état neutre (gris) tant qu'aucun écran ne s'est encore connecté serait plus juste.
- **P3 — Mode « Boutons invisibles »** : aucune indication des gestes au premier usage (un seul rappel dans les réglages) ; une aide discrète une seule fois (« appui = départ, double appui = nouveau coup ») éviterait les blocages.

## 5. Plan proposé (ordre conseillé)

1. Toast supprimé pour la sauvegarde automatique ; streaming replié et conditionné à la salle ; annuler dans « Score en cours ». (petit, visible tout de suite)
2. Miroir déplacé dans Écran → Écran distant, sans interrupteur intermédiaire (5 → 3 appuis).
3. Polices auto-hébergées + Tone.js chargé au premier appui + menu monté à l'ouverture (perf, hors ligne, RGPD).
4. Raccourci score sur la télécommande (appui long sur un joueur) — à valider, change le geste.
5. Sons WAV compressés ; voyant gris avant la première connexion ; aide gestes en mode tactile.
