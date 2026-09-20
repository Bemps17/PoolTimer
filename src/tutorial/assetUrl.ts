/** Resolve a file from `public/` with Vite's `BASE_URL` (PWA / sous-chemin). */
export function publicAssetUrl(relativePath: string, base: string = import.meta.env.BASE_URL): string {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${relativePath.replace(/^\//, '')}`;
}

/** Hashed URL emitted by Vite for a bundled tutorial SVG. */
export function bundledTutorialUrl(fileName: string): string {
  return new URL(`./assets/${fileName}`, import.meta.url).href;
}
