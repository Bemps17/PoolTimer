import { describe, expect, it } from 'vitest';
import { createLatencyTracker, MAX_ONE_WAY_MS } from './latency';

describe('compensation de la latence (écran Visuel en avance de la moitié du ping)', () => {
  it('is 0 until a round trip has been measured', () => {
    expect(createLatencyTracker().oneWayMs()).toBe(0);
  });

  it('uses half the median round-trip of recent pings (robust to one slow ping)', () => {
    const t = createLatencyTracker();
    for (const rtt of [80, 100, 90, 2_000, 110]) t.addRoundTrip(rtt);
    expect(t.oneWayMs()).toBe(50);
  });

  it('keeps only recent samples', () => {
    const t = createLatencyTracker(3);
    for (const rtt of [1_000, 1_000, 1_000, 40, 40, 40]) t.addRoundTrip(rtt);
    expect(t.oneWayMs()).toBe(20);
  });

  it('ignores absurd values and caps the correction', () => {
    const t = createLatencyTracker();
    t.addRoundTrip(-5);
    t.addRoundTrip(Number.NaN);
    expect(t.oneWayMs()).toBe(0);
    t.addRoundTrip(60_000);
    expect(t.oneWayMs()).toBe(MAX_ONE_WAY_MS);
  });
});
