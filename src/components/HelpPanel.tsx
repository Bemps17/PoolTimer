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
            Bienvenue sur le Timer de Billard Pro ! Cette application est conçue pour arbitrer vos parties
            avec précision, simplicité et style.
          </p>

          <h3>Contrôles Principaux</h3>
          <ul>
            <li>
              <strong>Clic simple (écran) :</strong> lance ou met en pause le chronomètre.
            </li>
            <li>
              <strong>Double-clic (écran) ou bouton reset :</strong> nouveau coup, temps de base.
            </li>
            <li>
              <strong>Après casse :</strong> charge le temps post-casse (réglable, 1:30 par défaut FFB) pour le
              coup en cours. Le coup suivant, un changement de joueur ou une nouvelle manche reviennent au
              temps de base.
            </li>
            <li>
              <strong>Cliquez sur P1/P2 :</strong> change de joueur et réinitialise au temps de base.
            </li>
            <li>
              <strong>EXTENSION :</strong> une fois par joueur et par manche, uniquement pendant que le chrono
              tourne.
            </li>
            <li>
              <strong>Icône plein écran :</strong> affiche le timer en immersion totale.
            </li>
          </ul>

          <h3>Clavier mobile</h3>
          <p>
            Pendant le match, aucun champ texte n'est éditable sur l'écran de jeu. Les noms et les durées se
            règlent uniquement dans le menu : les durées via +/−, les noms après un appui explicite sur
            « modifier ».
          </p>

          <h3>Accéder aux Paramètres (⚙️)</h3>
          <p>Cliquez sur l'icône roue crantée en haut à droite pour personnaliser :</p>
          <ul>
            <li>
              <strong>Les noms et couleurs</strong> des joueurs.
            </li>
            <li>
              <strong>Les temps</strong> de base, après casse et d'extension (preset FFB Blackball : 45s / 1:30 /
              +45s).
            </li>
            <li>
              <strong>Les seuils d'alerte</strong> visuelle (orange et rouge).
            </li>
            <li>
              <strong>Le thème visuel</strong> (Sombre, Clair, Cyberpunk).
            </li>
            <li>
              <strong>Les sons</strong> (volume, activation des alertes/clics).
            </li>
            <li>
              <strong>Le mode d'interface</strong> (boutons ou tout tactile).
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
