import { useLayoutEffect, useRef } from 'react';
import { PLAYER_NAME_MIN_FONT_PX, computeFitFontSize } from '../timer/playerName';

interface FitTextProps {
  children: string;
  className?: string;
  minFontPx?: number;
}

function overflows(el: HTMLElement): boolean {
  return el.scrollWidth - el.clientWidth > 1 || el.scrollHeight - el.clientHeight > 1;
}

function readCssFontPx(el: HTMLElement): number {
  const size = Number.parseFloat(getComputedStyle(el).fontSize);
  return Number.isFinite(size) && size > 0 ? size : 19.2;
}

export function FitText({ children, className, minFontPx = PLAYER_NAME_MIN_FONT_PX }: FitTextProps) {
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
    const parent = el.parentElement;
    const observer = new ResizeObserver(fit);
    if (parent) observer.observe(parent);
    return () => observer.disconnect();
  }, [children, minFontPx]);

  return (
    <span ref={ref} className={className} title={children}>
      {children}
    </span>
  );
}
