// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ShareEnvelope } from '../share/envelope';
import { getDefaultConfig } from '../timer/config';
import { colorsForTheme } from '../timer/theme';
import { ImportDialog } from './ImportDialog';

afterEach(cleanup);

const envelope: ShareEnvelope = {
  kind: 'bundle',
  preset: { name: 'Ligue', tempsBase: 30, tempsApresCasse: 60, tempsExtension: 30, seuilAlerte: 10, seuilCritique: 5, raceTo: 7 },
  theme: { name: 'Néon', base: 'cyberpunk', colors: colorsForTheme('cyberpunk') },
};

describe('ImportDialog', () => {
  it('previews the changes and changes nothing until the user confirms', () => {
    const onAdd = vi.fn();
    render(<ImportDialog envelope={envelope} config={getDefaultConfig()} onAdd={onAdd} onCancel={vi.fn()} />);
    expect(screen.getByText(/Ligue/)).toBeTruthy();
    expect(screen.getByText(/base 45→30 s/)).toBeTruthy();
    expect(screen.getByText(/course à 7/)).toBeTruthy();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('distinguishes "add" from "add and apply", and can be cancelled', () => {
    const onAdd = vi.fn();
    const onCancel = vi.fn();
    render(<ImportDialog envelope={envelope} config={getDefaultConfig()} onAdd={onAdd} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /^Ajouter à mes/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter et appliquer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onAdd).toHaveBeenNthCalledWith(1, false);
    expect(onAdd).toHaveBeenNthCalledWith(2, true);
    expect(onCancel).toHaveBeenCalled();
  });
});
