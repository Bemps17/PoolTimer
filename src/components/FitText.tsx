import { useLayoutEffect, useRef } from 'react';
import { PLAYER_NAME_MIN_FONT_PX, computeFitFontSize, fitSingleLineFontSize } from '../timer/playerName';

interface FitTextProps {
  children: string;
  className?: string;
  minFontPx?: number;
  /** Une seule ligne : la police rétrécit pour tenir en largeur (ellipse en dernier recours). */
  singleLine?: boolean;
}

function overflows(el: HTMLElement): boolean {
  return el.scrollWidth - el.clientWidth > 1 || el.scrollHeight - el.clientHeight > 1;
}

function readCssFontPx(el: HTMLElement): number {
  const size = Number.parseFloat(getComputedStyle(el).fontSize);
  return Number.isFinite(size) && size > 0 ? size : 19.2;
}

export function FitText({ children, className, minFontPx = PLAYER_NAME_MIN_FONT_PX, singleLine = false }: FitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    let fittedKey = '';
    const fit = () => {
      const key = `${Math.round(el.clientWidth)}:${children}:${minFontPx}`;
      if (key === fittedKey) return;

      el.style.removeProperty('font-size');
      const maxPx = readCssFontPx(el);
      if (!overflows(el)) {
        fittedKey = key;
        return;
      }

      if (singleLine) {
        // Taille de base = clamp() CSS ; on ne rétrécit que de ce qu'il faut pour tenir sur la ligne.
        let size = fitSingleLineFontSize({
          availableWidth: el.clientWidth,
          contentWidth: el.scrollWidth,
          maxFontSize: maxPx,
          minFontSize: minFontPx,
        });
        el.style.fontSize = `${size}px`;
        for (let i = 0; i < 6 && size > minFontPx && el.scrollWidth - el.clientWidth > 1; i += 1) {
          size = Math.max(minFontPx, size - 0.5);
          el.style.fontSize = `${size}px`;
        }
        fittedKey = key;
        return;
      }

      const hinted = computeFitFontSize({
        availableWidth: el.clientWidth,
        availableHeight: el.clientHeight,
        contentWidth: el.scrollWidth,
        contentHeight: el.scrollHeight,
        maxFontSize: maxPx,
        minFontSize: minFontPx,
      });
      el.style.fontSize = `${hinted}px`;

      let low = minFontPx;
      let high = maxPx;
      let best = minFontPx;
      if (!overflows(el)) {
        best = hinted;
        low = hinted;
      } else {
        high = hinted;
      }

      for (let i = 0; i < 14; i += 1) {
        const mid = (low + high) / 2;
        el.style.fontSize = `${mid}px`;
        if (overflows(el)) {
          high = mid;
        } else {
          best = mid;
          low = mid;
        }
      }
      el.style.fontSize = `${best}px`;
      fittedKey = `${Math.round(el.clientWidth)}:${children}:${minFontPx}`;
    };

    fit();
    // La police web peut arriver après le premier calcul et changer la largeur du texte : réajuster.
    let cancelled = false;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        if (cancelled) return;
        fittedKey = '';
        fit();
      });
    }
    // Navigateurs (et jsdom) sans ResizeObserver : ajustement au redimensionnement de la fenêtre.
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', fit);
      return () => {
        cancelled = true;
        window.removeEventListener('resize', fit);
      };
    }
    const parent = el.parentElement;
    const observer = new ResizeObserver(fit);
    if (parent) observer.observe(parent);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [children, minFontPx, singleLine]);

  return (
    <span ref={ref} className={`${className ?? ''}${singleLine ? ' fit-single' : ''}`.trim()} title={children}>
      {children}
    </span>
  );
}
