export function PlayIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function PauseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

export function ResetIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
    </svg>
  );
}

export function ExpandIcon() {
  return (
    <svg className="expand-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

export function CompressIcon() {
  return (
    <svg className="compress-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  );
}

/** Roue crantée classique : 8 dents autour d'un moyeu percé. */
export function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 4.59L10.58 1.90L13.42 1.90L13.71 4.59A7.6 7.6 0 0 1 16.03 5.55L16.03 5.55L18.14 3.85L20.15 5.86L18.45 7.97A7.6 7.6 0 0 1 19.41 10.29L19.41 10.29L22.10 10.58L22.10 13.42L19.41 13.71A7.6 7.6 0 0 1 18.45 16.03L18.45 16.03L20.15 18.14L18.14 20.15L16.03 18.45A7.6 7.6 0 0 1 13.71 19.41L13.71 19.41L13.42 22.10L10.58 22.10L10.29 19.41A7.6 7.6 0 0 1 7.97 18.45L7.97 18.45L5.86 20.15L3.85 18.14L5.55 16.03A7.6 7.6 0 0 1 4.59 13.71L4.59 13.71L1.90 13.42L1.90 10.58L4.59 10.29A7.6 7.6 0 0 1 5.55 7.97L5.55 7.97L3.85 5.86L5.86 3.85L7.97 5.55A7.6 7.6 0 0 1 10.29 4.59Z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}
