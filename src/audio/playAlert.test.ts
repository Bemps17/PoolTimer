import { describe, expect, it } from 'vitest';
import { resolveAlertSoundId } from './playAlert';
import { MINIONS_ARGHH_ID } from './minions';
import { getDefaultConfig } from '../timer/config';

describe('resolveAlertSoundId', () => {
  it('uses the selected warning pool, or the historic Minions Arghh when the easter egg is on', () => {
    const config = getDefaultConfig();
    expect(resolveAlertSoundId('warning', config)).toBe('classic-alert-time');
    expect(resolveAlertSoundId('warning', { ...config, alertWarningIds: ['cretins-couac'] })).toBe('cretins-couac');
    expect(
      resolveAlertSoundId('warning', {
        ...config,
        minionsMode: true,
        sonAlertes: true,
        alertWarningIds: ['classic-warning'],
      }),
    ).toBe(MINIONS_ARGHH_ID);
  });

  it('uses distinct pools for 5s ticks, 5s oneshot and the end gong', () => {
    const config = {
      ...getDefaultConfig(),
      alertCriticalIds: ['cretins-tick'],
      alertEndIds: ['cretins-fin'],
    };
    expect(resolveAlertSoundId('countdown_tick', config)).toBe('cretins-tick');
    expect(resolveAlertSoundId('critical_oneshot', { ...config, alertCriticalIds: ['cretins-alerte5s'] })).toBe(
      'cretins-alerte5s',
    );
    expect(resolveAlertSoundId('gong', config)).toBe('cretins-fin');
    expect(resolveAlertSoundId('click', config)).toBe('classic-clic');
  });
});
