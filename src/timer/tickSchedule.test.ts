import { describe, expect, it } from 'vitest';
import { formatTime } from './format';
import { nextTickDelay, TICK_MARGIN_MS } from './tickSchedule';

describe('réveils du chrono : seulement quand le chiffre affiché change (batterie)', () => {
  it('wakes once per second above 10 s', () => {
    expect(nextTickDelay(45_000, true)).toBe(1_000 + TICK_MARGIN_MS);
    expect(nextTickDelay(44_730, true)).toBe(730 + TICK_MARGIN_MS);
    expect(nextTickDelay(12_000, false)).toBe(1_000 + TICK_MARGIN_MS);
  });

  it('wakes every tenth of a second under 10 s only when tenths are displayed', () => {
    expect(nextTickDelay(9_950, true)).toBe(50 + TICK_MARGIN_MS);
    expect(nextTickDelay(9_000, true)).toBe(100 + TICK_MARGIN_MS);
    expect(nextTickDelay(9_950, false)).toBe(950 + TICK_MARGIN_MS);
  });

  it('never misses a visible change: after each wake-up the display has changed', () => {
    for (const ms of [true, false]) {
      let remaining = 45_000;
      let shown = formatTime(remaining, ms);
      while (remaining > 0) {
        remaining = Math.max(0, remaining - nextTickDelay(remaining, ms));
        const next = formatTime(remaining, ms);
        expect(next, `${remaining} ms`).not.toBe(shown);
        shown = next;
      }
    }
  });

  it('a 45 s shot wakes the CPU ~135 times instead of 900 (50 ms polling)', () => {
    let wakes = 0;
    for (let remaining = 45_000; remaining > 0; wakes += 1) remaining -= nextTickDelay(remaining, true);
    expect(wakes).toBeLessThan(140);
    expect(45_000 / 50).toBe(900);
  });

  it('handles 0 and negative values', () => {
    expect(nextTickDelay(0, true)).toBeGreaterThan(0);
    expect(nextTickDelay(-20, false)).toBeGreaterThan(0);
  });
});
