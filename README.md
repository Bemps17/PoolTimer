🎱 Timer de Billard Pro
Un chronomètre de tir ("shot clock") moderne, entièrement personnalisable et conçu pour l'arbitrage de parties de billard. Cette application web est pensée pour être utilisée sur n'importe quel appareil (mobile, tablette, ordinateur) et offre une expérience immersive et fiable pour les joueurs et les arbitres.

(Aperçu de l'application en thème Cyberpunk)

✨ Fonctionnalités Clés
Chronomètre de Haute Précision : Basé sur Date.now() pour une fiabilité à toute épreuve, sans dérive de temps.

Gestion Complète des Joueurs :

Support pour deux joueurs avec noms et couleurs personnalisables.

Indicateur visuel clair du joueur actif.

Système d'Extensions : Chaque joueur dispose d'une extension de temps par partie, avec un statut visuel (disponible/utilisée).

Personnalisation Poussée : Un menu de configuration complet permet de régler :

Thèmes Visuels : Sombre, Clair et Cyberpunk.

Temps : Durée de base par coup et durée de l'extension.

Alertes : Seuils d'avertissement (orange) et critique (rouge).

Audio : Volume général et activation/désactivation séparée des sons d'alerte et des clics d'interface.

Interface : Mode "tout tactile" (sans boutons) ou mode classique.

Automatisation : Passage automatique au joueur suivant après un temps écoulé.

Alertes Audio et Visuelles :

Changement de couleur du compteur aux seuils d'alerte.

Effet de "flash" sur le cadre pour attirer l'attention.

Sons distincts pour l'avertissement (cloche), le décompte final, et la fin du temps (buzzer).

Expérience Utilisateur Soignée (QoL) :

Mode Plein Écran pour une immersion totale.

Sauvegarde Automatique des paramètres dans le localStorage.

Fermeture du menu par balayage (swipe to close) sur mobile.

Design Responsive avec un compteur qui s'ajuste parfaitement à la taille de l'écran.

Gestion des "Safe Areas" sur mobile pour éviter que l'interface soit masquée par les barres de navigation natives.

🚀 Comment l'utiliser
Ouvrez le fichier index.html dans n'importe quel navigateur web moderne.

Configuration (Optionnel) : Cliquez sur l'icône roue crantée (⚙️) pour ajuster les paramètres à votre convenance. Les changements sont sauvegardés instantanément.

Lancer la partie :

Un clic simple sur l'écran du timer démarre ou met en pause le chronomètre.

Un double clic passe au joueur suivant et réinitialise le temps pour son tour.

Utiliser une extension : Lorsque le timer est en cours, le joueur actif peut cliquer sur la barre "EXTENSION" pour ajouter le temps supplémentaire défini.

Nouvelle Partie : Le bouton "NEW" réinitialise le jeu, y compris les extensions utilisées par les joueurs.

🛠️ Technologies
HTML5

CSS3 (avec variables CSS pour les thèmes et gestion Flexbox/Grid)

JavaScript (ES6+) : L'application est codée en une seule classe BilliardTimer pour une logique claire et structurée.

Tone.js : Une librairie puissante pour la génération de sons directement dans le navigateur, garantissant des alertes audio fiables sans dépendre de fichiers externes.

💻 Lancement en local
Aucune installation n'est requise. Il suffit de cloner ce dépôt et d'ouvrir le fichier index.html dans votre navigateur.

git clone https://votre-depot/timer-billard-pro.git
cd timer-billard-pro
# Ouvrez le fichier index.html

Ce projet est entièrement contenu dans un seul fichier, le rendant facile à déployer sur n'importe quel service d'hébergement statique (Netlify, Vercel, GitHub Pages, etc.).
