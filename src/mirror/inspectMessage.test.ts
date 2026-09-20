import { describe, expect, it } from 'vitest';
import { inspectServerPayload } from './protocol';

describe('inspectServerPayload', () => {
  it('flags invalid JSON and unparsed protocol messages', () => {
    expect(inspectServerPayload('{nope')).toEqual(
      expect.objectContaining({ parsed: undefined, code: 'invalid_json' }),
    );
    expect(inspectServerPayload(JSON.stringify({ type: 'snapshot', seq: 1 }))).toEqual(
      expect.objectContaining({ parsed: undefined, code: 'unparsed' }),
    );
    expect(inspectServerPayload(JSON.stringify({ type: 'push_ok', seq: 3 }))).toEqual({
      parsed: { type: 'push_ok', seq: 3 },
    });
  });
});
