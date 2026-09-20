import { useEffect, useState } from 'react';
import { TUTORIAL_SLIDES } from '../tutorial/slides';

interface TutorialSlideshowProps {
  open: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export function TutorialSlideshow({ open, onClose, initialIndex = 0 }: TutorialSlideshowProps) {
  const last = TUTORIAL_SLIDES.length - 1;
  const [index, setIndex] = useState(() => Math.min(last, Math.max(0, initialIndex)));

  useEffect(() => {
    if (open) setIndex(Math.min(last, Math.max(0, initialIndex)));
  }, [open, initialIndex, last]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
          setIndex((current) => Math.min(last, current + 1));
          break;
        case 'ArrowLeft':
          setIndex((current) => Math.max(0, current - 1));
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, last, onClose]);

  if (!open) return null;

  const slide = TUTORIAL_SLIDES[index];
  const prev = () => setIndex((current) => Math.max(0, current - 1));
  const next = () => setIndex((current) => Math.min(last, current + 1));

  return (
    <div className="tutorial-root" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <div className="tutorial-backdrop" onClick={onClose} />
      <div className="tutorial-card">
        <div className="tutorial-header">
          <p className="tutorial-kicker">
            Tutoriel {index + 1} / {TUTORIAL_SLIDES.length}
          </p>
          <h2 id="tutorial-title">{slide.title}</h2>
          <button type="button" className="fermer-panel" onClick={onClose} aria-label="Fermer le tutoriel">
            &times;
          </button>
        </div>
        <div className="tutorial-figure">
          <img src={slide.image} alt={slide.alt} />
        </div>
        <p className="tutorial-caption">{slide.caption}</p>
        <div className="tutorial-dots" role="tablist" aria-label="Diapositives">
          {TUTORIAL_SLIDES.map((item, dotIndex) => (
            <button
              key={item.id}
              type="button"
              className={`tutorial-dot${dotIndex === index ? ' active' : ''}`}
              aria-label={item.title}
              aria-current={dotIndex === index ? 'true' : undefined}
              onClick={() => setIndex(dotIndex)}
            />
          ))}
        </div>
        <div className="tutorial-nav">
          <button type="button" className="bouton-menu bouton-menu-secondary" onClick={prev} disabled={index === 0}>
            Précédent
          </button>
          {index === last ? (
            <button type="button" className="bouton-menu" onClick={onClose}>
              Terminer
            </button>
          ) : (
            <button type="button" className="bouton-menu" onClick={next}>
              Suivant
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
