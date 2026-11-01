// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { colorsForTheme } from '../timer/theme';
import { ThemeColorEditor } from './ThemeColorEditor';

afterEach(cleanup);

describe('ThemeColorEditor — alerte de contraste', () => {
  it('stays silent on a readable theme', () => {
    render(<ThemeColorEditor colors={colorsForTheme('sombre')} onChange={vi.fn()} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('warns, in French, when the timer digits cannot be read', () => {
    const colors = { ...colorsForTheme('sombre'), screen: '#222222', digitDefault: '#2a2a2a' };
    render(<ThemeColorEditor colors={colors} onChange={vi.fn()} />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toMatch(/contraste/i);
    expect(alert.textContent).toMatch(/Chiffres du chrono \(normal\)/);
    expect(alert.textContent).toMatch(/\d,\d:1/);
  });
});
