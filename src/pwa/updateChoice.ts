export const UPDATE_SNOOZE_KEY = 'h8timer.update.snoozedVersion';

export function snoozeToken(incomingVersion?: string): string {
  const trimmed = incomingVersion?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'pending';
}

export function loadSnoozedVersion(storage: Pick<Storage, 'getItem'> | undefined = localStorage): string | null {
  try {
    const value = storage?.getItem(UPDATE_SNOOZE_KEY);
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export function saveSnoozedVersion(
  token: string,
  storage: Pick<Storage, 'setItem'> | undefined = localStorage,
): void {
  try {
    storage?.setItem(UPDATE_SNOOZE_KEY, token);
  } catch {
    // ignore quota / private mode
  }
}

export function clearSnoozedVersion(storage: Pick<Storage, 'removeItem'> | undefined = localStorage): void {
  try {
    storage?.removeItem(UPDATE_SNOOZE_KEY);
  } catch {
    // ignore
  }
}

export function shouldShowUpdateBanner(options: {
  updateAvailable: boolean;
  incomingVersion?: string;
  snoozedVersion?: string | null;
  forceShow?: boolean;
}): boolean {
  if (!options.updateAvailable) return false;
  if (options.forceShow) return true;
  return options.snoozedVersion !== snoozeToken(options.incomingVersion);
}

export function rollbackCopy(options: { updateAvailable: boolean; snoozed: boolean }): {
  canStayOnCurrent: boolean;
  canRollbackInstalled: boolean;
  message: string;
} {
  if (options.updateAvailable) {
    return {
      canStayOnCurrent: true,
      canRollbackInstalled: false,
      message: options.snoozed
        ? 'Vous restez sur la version actuelle. La mise à jour attend ; elle ne s’installera que si vous choisissez « Mettre à jour ».'
        : 'Vous pouvez rester sur cette version (Plus tard). Revenir en arrière après une mise à jour déjà installée n’est en général pas possible dans le navigateur.',
    };
  }
  return {
    canStayOnCurrent: false,
    canRollbackInstalled: false,
    message:
      'Revenir à une version plus ancienne n’est pas possible une fois la mise à jour installée (limitation PWA / navigateur). Tant que vous refusez une mise à jour, l’app reste sur la version en cours.',
  };
}
