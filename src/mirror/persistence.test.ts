import { describe, expect, it } from 'vitest';
import {
  ALARM_REFRESH_MS,
  alarmNeedsRefresh,
  claimNeedsPersist,
  createWritePlanner,
  SNAPSHOT_PERSIST_MS,
} from './persistence';

describe('relais : budget d’écritures Durable Object (plan gratuit 100 000 lignes/jour)', () => {
  it('persists the first snapshot and every pause, so a reconnecting screen gets the latest stopped state', () => {
    const plan = createWritePlanner();
    expect(plan.onPush({ isRunning: true, now: 0 }).persist).toBe(true);
    expect(plan.onPush({ isRunning: true, now: 2_000 }).persist).toBe(false);
    expect(plan.onPush({ isRunning: false, now: 3_000 }).persist).toBe(true); // pause
    expect(plan.onPush({ isRunning: false, now: 4_000 }).persist).toBe(true); // réglage modifié à l'arrêt
  });

  it('throttles persistence while the clock runs', () => {
    const plan = createWritePlanner();
    plan.onPush({ isRunning: true, now: 0 });
    expect(plan.onPush({ isRunning: true, now: SNAPSHOT_PERSIST_MS - 1 }).persist).toBe(false);
    expect(plan.onPush({ isRunning: true, now: SNAPSHOT_PERSIST_MS }).persist).toBe(true);
  });

  it('refreshes the expiry alarm rarely', () => {
    const plan = createWritePlanner();
    expect(plan.onPush({ isRunning: true, now: 0 }).refreshAlarm).toBe(true);
    expect(plan.onPush({ isRunning: true, now: 60_000 }).refreshAlarm).toBe(false);
    expect(plan.onPush({ isRunning: true, now: ALARM_REFRESH_MS }).refreshAlarm).toBe(true);
  });

  it('one hour of running clock costs < 150 rows instead of ~5 400', () => {
    const plan = createWritePlanner();
    let rows = 0;
    for (let now = 0; now < 3_600_000; now += 2_000) {
      const step = plan.onPush({ isRunning: true, now });
      rows += (step.persist ? 1 : 0) + (step.refreshAlarm ? 1 : 0);
    }
    expect(rows).toBeLessThan(150);
  });

  it('a realistic match hour (shots of ~40 s, pauses between) stays far below the free quota', () => {
    const plan = createWritePlanner();
    let rows = 0;
    let now = 0;
    while (now < 3_600_000) {
      for (let t = 0; t < 40_000; t += 2_000) {
        const step = plan.onPush({ isRunning: true, now: now + t });
        rows += (step.persist ? 1 : 0) + (step.refreshAlarm ? 1 : 0);
      }
      const pause = plan.onPush({ isRunning: false, now: now + 40_000 });
      rows += (pause.persist ? 1 : 0) + (pause.refreshAlarm ? 1 : 0);
      now += 60_000;
    }
    // ~60 pauses + ~120 snapshots en course + ~6 alarmes : < 250 lignes/heure, soit > 400 heures de match par jour.
    expect(rows).toBeLessThan(250);
  });
});

describe('économie d’écritures à la connexion (S1 : quota gratuit)', () => {
  const TTL = 2 * 60 * 60 * 1000;

  it('sets the expiry alarm when none exists', () => {
    expect(alarmNeedsRefresh(null, 1_000, TTL)).toBe(true);
  });

  it('does not rewrite an alarm that is still far away (reconnections cost nothing)', () => {
    expect(alarmNeedsRefresh(1_000 + TTL - 60_000, 1_000, TTL)).toBe(false);
    expect(alarmNeedsRefresh(1_000 + TTL / 2 + 1, 1_000, TTL)).toBe(false);
  });

  it('pushes the alarm back once half of the delay has elapsed', () => {
    expect(alarmNeedsRefresh(1_000 + TTL / 2 - 1, 1_000, TTL)).toBe(true);
    expect(alarmNeedsRefresh(500, 1_000, TTL)).toBe(true);
  });

  it('a controller reconnecting with the same secret and nothing to reset writes nothing', () => {
    expect(claimNeedsPersist({ storedSecret: 'abc', storedSeq: 0 }, 'abc')).toBe(false);
  });

  it('writes when the secret changes (new room) or the sequence must restart at 0', () => {
    expect(claimNeedsPersist({ storedSecret: null, storedSeq: 0 }, 'abc')).toBe(true);
    expect(claimNeedsPersist({ storedSecret: 'abc', storedSeq: 42 }, 'abc')).toBe(true);
  });
});
