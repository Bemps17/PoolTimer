import { describe, expect, it } from 'vitest';
import { countSocketsByRole, resolveSocketRole, selectDisplayTargets } from './relay';

describe('mirror relay targeting', () => {
  it('prefers serialized attachment role over missing tags', () => {
    expect(resolveSocketRole({ role: 'controller', secret: 'x' }, [])).toBe('controller');
    expect(resolveSocketRole({}, ['display'])).toBe('display');
    expect(resolveSocketRole(null, ['controller'])).toBe('controller');
    expect(resolveSocketRole(undefined, [])).toBeUndefined();
  });

  it('falls back to every non-controller socket when display tags are empty', () => {
    const sender = { id: 'c' };
    const display = { id: 'd' };
    const extra = { id: 'unknown' };
    const roleOf = (socket: { id: string }) => {
      if (socket.id === 'c') return 'controller' as const;
      if (socket.id === 'd') return 'display' as const;
      return undefined;
    };

    expect(
      selectDisplayTargets({
        sender,
        taggedDisplays: [display],
        allSockets: [sender, display, extra],
        roleOf,
      }),
    ).toEqual([display]);

    expect(
      selectDisplayTargets({
        sender,
        taggedDisplays: [],
        allSockets: [sender, display, extra],
        roleOf,
      }).map((socket) => socket.id),
    ).toEqual(['d', 'unknown']);
  });

  it('counts roles from attachments when tag lists are empty', () => {
    const sockets = [{ role: 'display' as const }, { role: 'display' as const }, { role: 'controller' as const }];
    expect(countSocketsByRole(sockets, (socket) => socket.role, 'display')).toBe(2);
    expect(countSocketsByRole(sockets, (socket) => socket.role, 'controller')).toBe(1);
  });
});
