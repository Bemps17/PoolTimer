import { MirrorGuide } from './MirrorGuide';

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
  onShowTutorial: () => void;
}

export function HelpPanel({ open, onClose, onShowTutorial }: HelpPanelProps) {
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
          <button type="button" className="bouton-menu" onClick={onShowTutorial}>
            Tutoriel
          </button>
          <p className="install-hint">Diaporama illustré : écran de jeu, commandes, saisie des temps, miroir télécommande ↔ Visuel.</p>

          <h3>Contrôles Principaux</h3>
          <ul>
            <li>
              <strong>Clic simple (écran) :</strong> pause si le chrono tourne, départ s’il est à l’arrêt.
              L’action n’est confirmée qu’après un court délai, pour laisser passer un double appui.
            </li>
            <li>
              <strong>Double-clic (écran) ou bouton reset :</strong> nouveau coup, temps de base. Le chrono
              reste figé par défaut. Si « Redémarrage auto après nouveau coup » est activé, il repart tout
              seul.
            </li>
            <li>
              <strong>Après casse :</strong> charge le temps post-casse (réglable, 1:30 par défaut FFB) pour le
              coup en cours, sans démarrer le chrono (à lancer une fois les billes à l'arrêt). Le coup suivant,
              un changement de joueur ou une nouvelle manche reviennent au temps de base. Le bouton est masqué
              en <strong>Ultimate FBEP</strong> (pas de temps supplémentaire après la casse).
            </li>
            <li>
              <strong>Cliquez sur un joueur :</strong> change de joueur et réinitialise au temps de base.
              Si l'option « Relancer le chrono au clic joueur » est activée, le clic (même sur le
              joueur déjà actif) relance aussi le chrono.
            </li>
            <li>
              <strong>EXTENSION :</strong> une fois par joueur et par manche, uniquement pendant que le chrono
              tourne.
            </li>
            <li>
              <strong>NEW :</strong> nouvelle manche. Un appui long active ou désactive le pack Minions-like
              (original H8timer).
            </li>
            <li>
              <strong>Plein écran :</strong> à activer depuis la configuration (dans le navigateur).
              En application installée, l'affichage est déjà plein écran.
            </li>
          </ul>

          <h3>Clavier</h3>
          <p>
            Pendant le match, aucun champ n’est éditable sur l’écran de jeu (pas de clavier accidentel).
            Dans ⚙️, les durées se règlent par +/− <strong>et</strong> par saisie au clavier (champ numérique).
            Les noms s’éditent après un appui explicite sur « modifier » ; un nom vide est conservé (l’écran
            affiche « Joueur 1 / 2 » sans réécrire P1).
          </p>

          <h3>Accéder aux Paramètres (⚙️)</h3>
          <p>
            Cliquez sur l'icône roue crantée en bas, avec les autres boutons. Elle reste visible
            même en mode « Boutons invisibles ».
          </p>
          <ul>
            <li>
              <strong>Les noms et couleurs</strong> des joueurs (prénom / nom, jusqu’à 32 caractères ;
              la taille de police s’adapte sur le tableau).
            </li>
            <li>
              <strong>Les temps</strong> de base, après casse et d'extension — saisisables au clavier.
              Presets <strong>FFB Blackball</strong>, <strong>FFB TD/TN</strong>, <strong>FFB Blackball Master</strong>
              et <strong>Ultimate FBEP</strong>.
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
              <strong>Les sons</strong> : packs originaux H8timer (classique, Crétins, Minions-like), tirage
              fixe ou aléatoire, bips 1 s ou alerte ~5 s, import de vos fichiers.
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
              <strong>Nouvelle version disponible :</strong> un bandeau propose « Mettre à jour » ou
              « Plus tard » (rester sur cette version). Le match n’est pas rechargé tout seul. Un vrai
              retour arrière après installation n’est en général pas possible (limitation PWA).
            </li>
            <li>
              <strong>Vérifier les mises à jour</strong> dans l’application force la même vérification.
            </li>
            <li>
              <strong>Miroir télécommande :</strong> pairing code + QR. Ouvrez le <strong>Tutoriel</strong>
              (diaporama) ou lisez la section ci-dessous.
            </li>
          </ul>

          <MirrorGuide variant="help" />

          <p>
            <strong>Note :</strong> pour que la <strong>vibration</strong> fonctionne, assurez-vous que votre
            téléphone n'est pas en mode silencieux et que les vibrations sont autorisées pour le navigateur.
          </p>
        </div>
      </div>
    </>
  );
}
