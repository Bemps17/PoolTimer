interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
}

export function HelpPanel({ open, onClose }: HelpPanelProps) {
  return (
    <>
      <div className={`overlay${open ? ' active' : ''}`} onClick={onClose} />
      <div className={`panel-help${open ? ' active' : ''}`} role="dialog" aria-modal="true" aria-labelledby="help-title">
        <div className="header-panel">
          <h2 id="help-title">Mode d'emploi</h2>
          <button className="fermer-panel" onClick={onClose} aria-label="Fermer l'aide">
            &times;
          </button>
        </div>
        <div className="help-content">
          <p>
            Bienvenue sur H8timer ! Cette application est conçue pour arbitrer vos parties
            avec précision, simplicité et style.
          </p>

          <h3>Contrôles Principaux</h3>
          <ul>
            <li>
              <strong>Clic simple (écran) :</strong> si le chrono tourne, pause immédiate. S’il est à
              l’arrêt, un clic le relance.
            </li>
            <li>
              <strong>Double-clic (écran, chrono à l’arrêt) ou bouton reset :</strong> nouveau coup, temps
              de base. Si « Redémarrage auto après nouveau coup » est activé, le chrono repart tout seul
              après ce reset — ça ne concerne pas la pause.
            </li>
            <li>
              <strong>Après casse :</strong> charge le temps post-casse (réglable, 1:30 par défaut FFB) pour le
              coup en cours, sans démarrer le chrono (à lancer une fois les billes à l'arrêt). Le coup suivant,
              un changement de joueur ou une nouvelle manche reviennent au temps de base. Le bouton est masqué
              en <strong>Ultimate FBEP</strong> (pas de temps supplémentaire après la casse).
            </li>
            <li>
              <strong>Cliquez sur P1/P2 :</strong> change de joueur et réinitialise au temps de base.
              Si l'option « Relancer le chrono au clic joueur » est activée, le clic (même sur le
              joueur déjà actif) relance aussi le chrono.
            </li>
            <li>
              <strong>EXTENSION :</strong> une fois par joueur et par manche, uniquement pendant que le chrono
              tourne.
            </li>
            <li>
              <strong>NEW :</strong> nouvelle manche. Un appui long active ou désactive le mode Minions
              (cri Arghh à la première alerte).
            </li>
            <li>
              <strong>Plein écran :</strong> à activer depuis la configuration (dans le navigateur).
              En application installée, l'affichage est déjà plein écran.
            </li>
          </ul>

          <h3>Clavier mobile</h3>
          <p>
            Pendant le match, aucun champ texte n'est éditable sur l'écran de jeu. Les noms et les durées se
            règlent uniquement dans le menu : les durées via +/−, les noms après un appui explicite sur
            « modifier ».
          </p>

          <h3>Accéder aux Paramètres (⚙️)</h3>
          <p>
            Cliquez sur l'icône roue crantée en bas, avec les autres boutons. Elle reste visible
            même en mode « Boutons invisibles ».
          </p>
          <ul>
            <li>
              <strong>Les noms et couleurs</strong> des joueurs.
            </li>
            <li>
              <strong>Les temps</strong> de base, après casse et d'extension. Presets de compétition
              <strong>FFB Blackball</strong> (45s / 1:30 / +15s), <strong>FFB TD/TN</strong>
              (45s / 1:30 / +45s), <strong>FFB Blackball Master</strong> (30s / 1:00 / +30s) — ambiance bleue —
              et <strong>Ultimate FBEP</strong> (45s / +15s, vert canard, sans après casse).
            </li>
            <li>
              <strong>Les seuils d'alerte</strong> visuelle (orange et rouge).
            </li>
            <li>
              <strong>Le thème visuel</strong> (Sombre, Clair, Cyberpunk, FFB, FBEP).
            </li>
            <li>
              <strong>La taille des chiffres</strong> du chronomètre.
            </li>
            <li>
              <strong>Les sons</strong> (volume, activation des alertes/clics).
            </li>
            <li>
              <strong>Le mode d'interface</strong> (boutons visibles ou boutons invisibles).
            </li>
            <li>
              <strong>Le plein écran</strong> pour une utilisation dans le navigateur.
            </li>
            <li>
              <strong>L'automatisation</strong> : redémarrage après nouveau coup, et relance du chrono
              au clic sur un joueur.
            </li>
            <li>
              <strong>Installer l'application</strong> pour un usage hors ligne (Chrome / Edge), ou via
              Partager → Sur l'écran d'accueil sur iPhone.
            </li>
            <li>
              <strong>Historique des versions</strong> pour voir les nouveautés.
            </li>
            <li>
              <strong>Nouvelle version disponible :</strong> un bandeau propose « Mettre à jour » dès
              qu’une version plus récente est détectée (fichier version.json), même si le service worker
              n’a pas signalé de mise à jour. Le match n’est pas rechargé tout seul.
            </li>
            <li>
              <strong>Vérifier les mises à jour</strong> dans l’application force la même vérification.
            </li>
            <li>
              <strong>Miroir télécommande (bêta) :</strong> dans « Bêta / Work in progress », ouvrez une
              salle, scannez le QR avec une tablette / un autre téléphone. L’écran suit le chrono via
              Internet (code à 6 caractères). Une seule télécommande par salle.
            </li>
          </ul>
          <p>
            <strong>Note :</strong> pour que la <strong>vibration</strong> fonctionne, assurez-vous que votre
            téléphone n'est pas en mode silencieux et que les vibrations sont autorisées pour le navigateur.
          </p>
        </div>
      </div>
    </>
  );
}
