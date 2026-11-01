/**
 * Pont entre les lecteurs de fichiers (HTMLAudioElement) et la chaîne Web Audio (gain + limiteur).
 * Évite un import circulaire : toneAudio enregistre le routeur, les lecteurs l'appellent.
 */
type Router = (audio: HTMLAudioElement) => boolean;

let router: Router | null = null;

export function registerAudioRouter(next: Router | null): void {
  router = next;
}

/** Vrai si l'élément passe par la chaîne maître (son volume doit alors rester à 1). */
export function routeAudio(audio: HTMLAudioElement): boolean {
  if (!router) return false;
  try {
    return router(audio);
  } catch {
    return false;
  }
}
