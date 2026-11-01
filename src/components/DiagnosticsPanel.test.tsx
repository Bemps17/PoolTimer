// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DiagnosticsPanel } from './DiagnosticsPanel';

afterEach(cleanup);

describe('DiagnosticsPanel', () => {
  const rows: Array<[string, string]> = [
    ['Synchro', 'OK'],
    ['Aller-retour (médiane)', '42 ms'],
  ];

  it('shows the measurements', () => {
    render(<DiagnosticsPanel level="ok" rows={rows} buildLog={() => 'x'} fileName="h8timer-test.log" onClear={vi.fn()} />);
    expect(screen.getByText('Aller-retour (médiane)')).toBeTruthy();
    expect(screen.getByText('42 ms')).toBeTruthy();
  });

  it('downloads the log as a .log text file', async () => {
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:h8');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(<DiagnosticsPanel level="slow" rows={rows} buildLog={() => 'contenu du journal'} fileName="h8timer-test.log" onClear={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Télécharger le journal/ }));
    const blob = createObjectURL.mock.calls[0]![0] as unknown as Blob;
    expect(blob.type).toContain('text/plain');
    expect(await blob.text()).toBe('contenu du journal');
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });

  it('can clear the log', () => {
    const onClear = vi.fn();
    render(<DiagnosticsPanel level="down" rows={rows} buildLog={() => ''} fileName="a.log" onClear={onClear} />);
    fireEvent.click(screen.getByRole('button', { name: /Effacer le journal/ }));
    expect(onClear).toHaveBeenCalled();
  });
});
