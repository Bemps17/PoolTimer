import { encode } from 'uqr';
import type { ReactNode } from 'react';

interface QrCodeSvgProps {
  value: string;
  title?: string;
}

export function QrCodeSvg({ value, title }: QrCodeSvgProps) {
  const encoded = encode(value, { ecc: 'M' });
  const size = encoded.size;
  const modules = flattenModules(encoded);
  const cells: ReactNode[] = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!modules[y * size + x]) continue;
      cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
    }
  }

  return (
    <svg
      className="mirror-qr"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={title ?? 'QR code'}
    >
      <title>{title ?? value}</title>
      <rect width={size} height={size} fill="#fff" />
      <g fill="#111">{cells}</g>
    </svg>
  );
}

function flattenModules(encoded: ReturnType<typeof encode>): boolean[] {
  return encoded.data.flat();
}
