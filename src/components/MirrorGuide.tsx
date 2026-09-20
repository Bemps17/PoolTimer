export type MirrorGuideVariant = 'help' | 'settings';

function MirrorGuideBody() {
  return (
    <>
      <p>
        <strong>Télécommande</strong> : le téléphone qui ouvre la salle (commandes du match).{' '}
        <strong>Écran Visuel</strong> : tablette, TV ou autre téléphone en lecture seule.
      </p>
      <ol className="mirror-guide-steps">
        <li>
          Sur la télécommande : ⚙️ → <strong>Bêta / Work in progress</strong> → Miroir
          télécommande <strong>Oui</strong> → <strong>Ouvrir une salle</strong>.
        </li>
        <li>Un code à 6 caractères et un QR s’affichent. Gardez ce téléphone comme commande.</li>
        <li>
          Sur l’écran Visuel, ouvrez <strong>https://pooltimer.vercel.app</strong> (site de
          production, pas une copie locale) puis scannez le QR, ou ouvrez le lien{' '}
          <code>/d/CODE</code>.
        </li>
        <li>
          Attendez <strong>Écran lié · sync OK</strong> sur la télécommande et{' '}
          <strong>Sync OK</strong> sur l’écran.
        </li>
        <li>
          Lancez le match depuis la télécommande. L’écran suit le chrono ; un appui dessus passe
          en plein écran (lecture seule).
        </li>
      </ol>
      <p>
        <strong>Sync OK</strong> : l’écran a reçu le chrono et le relais transmet les mises à jour.{' '}
        « En attente d’un écran » : le QR n’a pas encore été ouvert.{' '}
        « Écran lié · pas de sync » : l’écran est connecté mais le relais n’acquitte pas.
      </p>
      <p>
        <strong>Si ça bloque</strong> : pas besoin du même Wi‑Fi (sync Internet). Utilisez toujours
        l’URL de production. Une seule télécommande par salle. Fermez la salle, ouvrez-en une
        nouvelle, puis rescannez.
      </p>
    </>
  );
}

export function MirrorGuide({ variant }: { variant: MirrorGuideVariant }) {
  switch (variant) {
    case 'help':
      return (
        <section id="aide-miroir" className="mirror-guide-help" aria-labelledby="aide-miroir-title">
          <h3 id="aide-miroir-title">Miroir télécommande (bêta)</h3>
          <MirrorGuideBody />
        </section>
      );
    case 'settings':
      return (
        <details className="mirror-guide" open>
          <summary>Tutoriel — lier un écran Visuel</summary>
          <MirrorGuideBody />
        </details>
      );
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
}
