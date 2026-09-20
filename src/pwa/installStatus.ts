export type PwaInstallStatus = 'installed' | 'available' | 'ios' | 'unsupported';

export function isStandaloneDisplay(options: {
  displayModeStandalone: boolean;
  iosStandalone: boolean | undefined;
}): boolean {
  return options.displayModeStandalone || options.iosStandalone === true;
}

export function isIosSafari(userAgent: string): boolean {
  return /iphone|ipad|ipod/i.test(userAgent);
}

export function getPwaInstallStatus(options: {
  standalone: boolean;
  hasDeferredPrompt: boolean;
  userAgent: string;
}): PwaInstallStatus {
  if (options.standalone) return 'installed';
  if (options.hasDeferredPrompt) return 'available';
  if (isIosSafari(options.userAgent)) return 'ios';
  return 'unsupported';
}

export function installButtonCopy(status: PwaInstallStatus): { label: string; hint: string; disabled: boolean } {
  switch (status) {
    case 'available':
      return {
        label: 'Installer l’application',
        hint: 'Ajoutez H8timer à l’écran d’accueil pour l’utiliser hors ligne.',
        disabled: false,
      };
    case 'installed':
      return {
        label: 'Application installée',
        hint: 'H8timer est déjà disponible hors ligne depuis l’écran d’accueil.',
        disabled: true,
      };
    case 'ios':
      return {
        label: 'Installer l’application',
        hint: 'Sur iPhone / iPad : bouton Partager → Sur l’écran d’accueil.',
        disabled: true,
      };
    case 'unsupported':
      return {
        label: 'Installer l’application',
        hint: 'Installation non proposée par ce navigateur. Ouvrez H8timer dans Chrome ou Edge, ou sur Safari : Partager → Sur l’écran d’accueil.',
        disabled: true,
      };
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}
