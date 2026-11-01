/**
 * Pont entre les lecteurs de fichiers (HTMLAudioElement) et la chaîne Web Audio (gain + limiteur).
 * Évite un import circulaire : toneAudio enregistre le routeur, les lecteurs l'appellent.
 *
 * Un élément branché sur la chaîne ne joue QUE si l'AudioContext tourne (sinon silence, irréversible pour cet
 * élément). Chaque son a donc deux éléments : un routé (volume maximal + limiteur) et un direct (repli), choisi
 * à chaque lecture selon l'état du contexte. Une alerte reste audible même si le navigateur a suspendu l'audio.
 */
type Router = (audio: HTMLAudioElement) => boolean;

let router: Router | null = null;
let isReady: () => boolean = () => false;

export function registerAudioRouter(next: Router | null, ready: () => boolean = () => true): void {
  router = next;
  isReady = ready;
}

function chainReady(): boolean {
  if (!router) return false;
  try {
    return isReady();
  } catch {
    return false;
  }
}

/** Vrai si l'élément passe par la chaîne maître (son volume doit alors rester à 1). */
export function routeAudio(audio: HTMLAudioElement): boolean {
  if (!router || !chainReady()) return false;
  try {
    return router(audio);
  } catch {
    return false;
  }
}

export interface AcquiredAudio {
  audio: HTMLAudioElement;
  /** true : volume géré par la chaîne (mettre audio.volume = 1) ; false : régler audio.volume soi-même. */
  routed: boolean;
}

export function createElementPool(factory: (key: string) => HTMLAudioElement) {
  const routed = new Map<string, HTMLAudioElement>();
  const direct = new Map<string, HTMLAudioElement>();
  const failed = new Set<string>();

  const directFor = (key: string): AcquiredAudio => {
    let audio = direct.get(key);
    if (!audio) {
      audio = factory(key);
      direct.set(key, audio);
    }
    return { audio, routed: false };
  };

  return {
    acquire(key: string): AcquiredAudio {
      if (!chainReady() || failed.has(key)) return directFor(key);
      const existing = routed.get(key);
      if (existing) return { audio: existing, routed: true };
      const audio = factory(key);
      if (routeAudio(audio)) {
        routed.set(key, audio);
        return { audio, routed: true };
      }
      // Routage impossible : on garde cet élément comme sortie directe (il n'a pas été branché).
      failed.add(key);
      direct.set(key, audio);
      return { audio, routed: false };
    },
  };
}
