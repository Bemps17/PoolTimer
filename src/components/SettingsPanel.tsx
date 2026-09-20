import { useRef, type TouchEvent } from 'react';
import { applyFfbPreset, CONFIG_LIMITS } from '../timer/config';
import { formatSecondsClock } from '../timer/format';
import type { InterfaceMode, Theme, TimerConfig } from '../timer/types';
import { dbToGain, gainToDb } from '../timer/volume';
import { NumberStepper, parseBooleanSelect, SelectField, VolumeSlider } from './NumberStepper';
import { PlayerNameField } from './PlayerNameField';

interface SettingsPanelProps {
  open: boolean;
  config: TimerConfig;
  onClose: () => void;
  onChange: (next: TimerConfig, options?: { resetShot?: boolean }) => void;
  onShowHelp: () => void;
}

const THEME_OPTIONS = [
  { value: 'sombre', label: 'Sombre' },
  { value: 'light', label: 'Clair' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
];

const INTERFACE_OPTIONS = [
  { value: 'boutons', label: 'Boutons Visibles' },
  { value: 'tactile', label: 'Mode Tactile Complet' },
];

const YES_NO = [
  { value: 'true', label: 'Oui' },
  { value: 'false', label: 'Non' },
];

const ON_OFF = [
  { value: 'true', label: 'Activés' },
  { value: 'false', label: 'Désactivés' },
];

const VIBRATION = [
  { value: 'true', label: 'Activée' },
  { value: 'false', label: 'Désactivée' },
];

export function SettingsPanel({ open, config, onClose, onChange, onShowHelp }: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef({ startX: 0, startY: 0, moveX: 0, moveY: 0, isDragging: false });

  const patch = (partial: Partial<TimerConfig>, resetShot = false) => {
    onChange({ ...config, ...partial }, { resetShot });
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      moveX: touch.clientX,
      moveY: touch.clientY,
      isDragging: false,
    };
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    const content = contentRef.current;
    if (!panel) return;
    if (content && content.scrollTop > 0 && !touchRef.current.isDragging) return;

    const touch = event.touches[0];
    touchRef.current.moveX = touch.clientX;
    touchRef.current.moveY = touch.clientY;
    const deltaX = touchRef.current.moveX - touchRef.current.startX;
    const deltaY = touchRef.current.moveY - touchRef.current.startY;

    if (!touchRef.current.isDragging) {
      if (Math.abs(deltaX) > Math.abs(deltaY) + 5) {
        touchRef.current.isDragging = true;
        panel.style.transition = 'none';
      } else {
        return;
      }
    }

    if (touchRef.current.isDragging && deltaX > 0) {
      event.preventDefault();
      panel.style.transform = `translateX(${deltaX}px)`;
    }
  };

  const handleTouchEnd = () => {
    const panel = panelRef.current;
    if (!panel || !touchRef.current.isDragging) return;
    panel.style.transition =
      'right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    panel.style.transform = '';
    const deltaX = touchRef.current.moveX - touchRef.current.startX;
    if (deltaX > panel.offsetWidth * 0.3) onClose();
    touchRef.current.isDragging = false;
  };

  return (
    <>
      <div className={`overlay${open ? ' active' : ''}`} onClick={onClose} />
      <div
        ref={panelRef}
        id="panelArbitre"
        className={`panel${open ? ' active' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="header-panel">
          <h2 id="settings-title">Configuration</h2>
          <button className="fermer-panel" onClick={onClose} aria-label="Fermer le menu">
            &times;
          </button>
        </div>
        <div ref={contentRef} className="panel-content">
          <div className="section-panel">
            <h3>Joueurs</h3>
            <PlayerNameField
              label="Joueur 1"
              nameId="p1Name"
              colorId="p1Color"
              name={config.p1Name}
              color={config.p1Color}
              onNameChange={(p1Name) => patch({ p1Name: p1Name || 'P1' })}
              onColorChange={(p1Color) => patch({ p1Color })}
            />
            <PlayerNameField
              label="Joueur 2"
              nameId="p2Name"
              colorId="p2Color"
              name={config.p2Name}
              color={config.p2Color}
              onNameChange={(p2Name) => patch({ p2Name: p2Name || 'P2' })}
              onColorChange={(p2Color) => patch({ p2Color })}
            />
          </div>

          <div className="section-panel">
            <h3>Paramètres de Jeu</h3>
            <NumberStepper
              label="Temps de base (sec)"
              htmlId="tempsBase"
              value={config.tempsBase}
              min={CONFIG_LIMITS.tempsBase.min}
              max={CONFIG_LIMITS.tempsBase.max}
              suffix="s"
              onChange={(tempsBase) => patch({ tempsBase }, true)}
            />
            <NumberStepper
              label={`Temps après casse (${formatSecondsClock(config.tempsApresCasse)})`}
              htmlId="tempsApresCasse"
              value={config.tempsApresCasse}
              min={CONFIG_LIMITS.tempsApresCasse.min}
              max={CONFIG_LIMITS.tempsApresCasse.max}
              suffix="s"
              onChange={(tempsApresCasse) => patch({ tempsApresCasse }, true)}
            />
            <NumberStepper
              label="Temps d'extension (sec)"
              htmlId="tempsExtension"
              value={config.tempsExtension}
              min={CONFIG_LIMITS.tempsExtension.min}
              max={CONFIG_LIMITS.tempsExtension.max}
              suffix="s"
              onChange={(tempsExtension) => patch({ tempsExtension })}
            />
            <NumberStepper
              label="Seuil Alerte Orange (sec)"
              htmlId="seuilAlerte"
              value={config.seuilAlerte}
              min={CONFIG_LIMITS.seuilAlerte.min}
              max={CONFIG_LIMITS.seuilAlerte.max}
              suffix="s"
              onChange={(seuilAlerte) => patch({ seuilAlerte })}
            />
            <NumberStepper
              label="Seuil Alerte Rouge (sec)"
              htmlId="seuilCritique"
              value={config.seuilCritique}
              min={CONFIG_LIMITS.seuilCritique.min}
              max={CONFIG_LIMITS.seuilCritique.max}
              suffix="s"
              onChange={(seuilCritique) => patch({ seuilCritique })}
            />
            <button
              type="button"
              className="bouton-menu"
              onClick={() => onChange(applyFfbPreset(config), { resetShot: true })}
            >
              Preset FFB Blackball (45s / 1:30 / +45s)
            </button>
          </div>

          <div className="section-panel">
            <h3>Interface & Audio</h3>
            <SelectField
              label="Thème visuel"
              htmlId="themeVisuel"
              value={config.theme}
              options={THEME_OPTIONS}
              onChange={(theme) => patch({ theme: theme as Theme })}
            />
            <SelectField
              label="Mode d'interface"
              htmlId="modeInterface"
              value={config.modeInterface}
              options={INTERFACE_OPTIONS}
              onChange={(modeInterface) => patch({ modeInterface: modeInterface as InterfaceMode })}
            />
            <SelectField
              label="Affichage millisecondes (sous 10s)"
              htmlId="affichageMs"
              value={String(config.affichageMs)}
              options={YES_NO}
              onChange={(value) => patch({ affichageMs: parseBooleanSelect(value) })}
            />
            <VolumeSlider
              label="Volume général"
              htmlId="volumeSonore"
              gain={dbToGain(config.volume)}
              onChange={(gain) => patch({ volume: gainToDb(gain) })}
            />
            <SelectField
              label="Sons d'alerte (timer)"
              htmlId="sonAlertes"
              value={String(config.sonAlertes)}
              options={ON_OFF}
              onChange={(value) => patch({ sonAlertes: parseBooleanSelect(value) })}
            />
            <SelectField
              label="Sons des clics (interface)"
              htmlId="sonClics"
              value={String(config.sonClics)}
              options={ON_OFF}
              onChange={(value) => patch({ sonClics: parseBooleanSelect(value) })}
            />
            <SelectField
              label="Vibration mobile"
              htmlId="vibrationMobile"
              value={String(config.vibration)}
              options={VIBRATION}
              onChange={(value) => patch({ vibration: parseBooleanSelect(value) })}
            />
          </div>

          <div className="section-panel">
            <h3>Automatisation</h3>
            <SelectField
              label="Redémarrage auto après reset / après casse"
              htmlId="autoStartOnReset"
              value={String(config.autoStartOnReset)}
              options={YES_NO}
              onChange={(value) => patch({ autoStartOnReset: parseBooleanSelect(value) })}
            />
          </div>

          <div className="section-panel">
            <button type="button" className="bouton-menu" onClick={onShowHelp}>
              Mode d'emploi
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
