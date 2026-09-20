import { describe, expect, it } from 'vitest';
import { commitIntegerField } from './numberField';

describe('commitIntegerField', () => {
  it('clamps to the configured range', () => {
    expect(commitIntegerField('5', 45, 10, 180)).toBe(10);
    expect(commitIntegerField('200', 45, 10, 180)).toBe(180);
    expect(commitIntegerField('45', 15, 10, 180)).toBe(45);
  });

  it('keeps the previous value when empty or not a number', () => {
    expect(commitIntegerField('', 45, 10, 180)).toBe(45);
    expect(commitIntegerField('   ', 15, 5, 90)).toBe(15);
    expect(commitIntegerField('abc', 30, 10, 180)).toBe(30);
  });

  it('parses a leading integer and ignores a decimal comma leftover', () => {
    expect(commitIntegerField('12.7', 45, 10, 180)).toBe(12);
    expect(commitIntegerField('20,4', 45, 10, 180)).toBe(20);
  });
});
