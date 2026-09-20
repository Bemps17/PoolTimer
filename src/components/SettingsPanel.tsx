import { useRef, type ReactNode, type TouchEvent } from 'react';
import { APP_VERSION } from '../changelog';
import { installButtonCopy, type PwaInstallStatus } from '../pwa/installStatus';
import { rollbackCopy } from '../pwa/updateChoice';
import { applyCompetitionPreset, CONFIG_LIMITS, matchesCompetitionPreset } from '../timer/config';
import { formatSecondsClock } from '../timer/format';
import type { CompetitionMode, InterfaceMode, Theme, TimerConfig } from '../timer/types';
import { dbToGain, gainToDb } from '../timer/volume';
import { NumberStepper, parseBooleanSelect, SelectField, VolumeSlider } from './NumberStepper';
import { PlayerNameField } from './PlayerNameField';
import { SettingsSection } from './SettingsSection';
import { SoundLibrarySettings } from './SoundLibrarySettings';

interface SettingsPanelProps {
  open: boolean;
  config: TimerConfig;
  isFullscreen: boolean;
  onClose: () => void;
  onChange: (next: TimerConfig, options?: { resetShot?: boolean }) => void;
  onShowHelp: () => void;
  onShowChangelog: () => void;
  onShowTutorial: () => void;
  onToggleFullscreen: () => void;
  installStatus: PwaInstallStatus;
  onInstall: () => void;
  onCheckUpdates: () => void;
  updateAvailable?: boolean;
  incomingVersion?: string;
  updateSnoozed?: boolean;
  onApplyUpdate?: () => void;
  onSnoozeUpdate?: () => void;
  extraSections?: ReactNode;
}

const THEME_OPTIONS = [
  { value: 'sombre', label: 'Sombre' },
  { value: 'light', label: 'Clair' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'ffb', label: 'FFB Blackball (bleu)' },
  { value: 'fbep', label: 'Ultimate FBEP (vert canard)' },
];

const INTERFACE_OPTIONS = [
  { value: 'boutons', label: 'Boutons Visibles' },
  { value: 'tactile', label: 'Boutons invisibles' },
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

const COMPETITION_PRESET_CARDS: Array<{
  mode: CompetitionMode;
  label: string;
  detail: string;
  cardClass: string;
}> = [
  { mode: 'ffb', label: 'FFB Blackball', detail: '45s · 1:30 · +15s', cardClass: 'preset-ffb' },
  { mode: 'ffbTdTn', label: 'FFB TD/TN', detail: '45s · 1:30 · +45s', cardClass: 'preset-ffb' },
  { mode: 'ffbMaster', label: 'FFB Blackball Master', detail: '30s · 1:00 · +30s', cardClass: 'preset-ffb-master' },
  { mode: 'fbep', label: 'Ultimate FBEP', detail: '45s · +15s · sans après casse', cardClass: 'preset-fbep' },
];

export function SettingsPanel({
  open,
  config,
  isFullscreen,
  onClose,
  onChange,
  onShowHelp,
  onShowChangelog,
  onShowTutorial,
  onToggleFullscreen,
  installStatus,
  onInstall,
  onCheckUpdates,
  updateAvailable = false,
  incomingVersion,
  updateSnoozed = false,
  onApplyUpdate,
  onSnoozeUpdate,
  extraSections,
}: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef({ startX: 0, startY: 0, moveX: 0, moveY: 0, isDragging: false });

  const patch = (partial: Partial<TimerConfig>, resetShot = false) => {
    onChange({ ...config, ...partial }, { resetShot });
  };

  const applyMode = (mode: CompetitionMode) => {
    onChange(applyCompetitionPreset(config, mode), { resetShot: true });
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

  const installCopy = installButtonCopy(installStatus);

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
          <div className="header-panel-actions">
            <button type="button" className="header-tutorial-btn" onClick={onShowTutorial}>
              Tutoriel
            </button>
            <button className="fermer-panel" onClick={onClose} aria-label="Fermer le menu">
              &times;
            </button>
          </div>
        </div>
        <div ref={contentRef} className="panel-content">
          <SettingsSection title="Joueurs" defaultOpen>
            <PlayerNameField
              label="Joueur 1"
              nameId="p1Name"
              colorId="p1Color"
              name={config.p1Name}
              color={config.p1Color}
              seat={1}
              onNameChange={(p1Name) => patch({ p1Name })}
              onColorChange={(p1Color) => patch({ p1Color })}
            />
            <PlayerNameField
              label="Joueur 2"
              nameId="p2Name"
              colorId="p2Color"
              name={config.p2Name}
              color={config.p2Color}
              seat={2}
              onNameChange={(p2Name) => patch({ p2Name })}
              onColorChange={(p2Color) => patch({ p2Color })}
            />
            <p className="install-hint">Nom vide autorisé (affichage « Joueur 1 / 2 » à l’écran, sans réécrire P1).</p>
          </SettingsSection>

          <SettingsSection title="Compétition & temps" defaultOpen>
            <div className="preset-row" role="group" aria-label="Presets de compétition">
              {COMPETITION_PRESET_CARDS.map((preset) => {
                const active = matchesCompetitionPreset(config, preset.mode);
                return (
                  <button
                    key={preset.mode}
                    type="button"
                    className={`preset-card ${preset.cardClass}${active ? ' active' : ''}`}
                    aria-pressed={active}
                    onClick={() => applyMode(preset.mode)}
                  >
                    {preset.label}
                    <small>{preset.detail}</small>
                  </button>
                );
              })}
            </div>
            <p className="install-hint">
              Presets appliqués tout de suite. Ultimate FBEP : pas d’après casse. Les autres gardent le bouton si le
              temps post-casse est distinct.
            </p>
            <NumberStepper
              label="Temps de base (sec)"
              htmlId="tempsBase"
              value={config.tempsBase}
              min={CONFIG_LIMITS.tempsBase.min}
              max={CONFIG_LIMITS.tempsBase.max}
              suffix="s"
              onChange={(tempsBase) =>
                patch(config.theme === 'fbep' ? { tempsBase, tempsApresCasse: tempsBase } : { tempsBase }, true)
              }
            />
            {config.theme === 'fbep' ? null : (
              <NumberStepper
                label={`Temps après casse (${formatSecondsClock(config.tempsApresCasse)})`}
                htmlId="tempsApresCasse"
                value={config.tempsApresCasse}
                min={CONFIG_LIMITS.tempsApresCasse.min}
                max={CONFIG_LIMITS.tempsApresCasse.max}
                suffix="s"
                onChange={(tempsApresCasse) => patch({ tempsApresCasse }, true)}
              />
            )}
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
            <p className="install-hint">+/− ou saisie au clavier (pavé numérique).</p>
          </SettingsSection>

          <SettingsSection title="Apparence">
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
            <NumberStepper
              label="Taille des chiffres"
              htmlId="tailleChiffres"
              value={config.tailleChiffres}
              min={CONFIG_LIMITS.tailleChiffres.min}
              max={CONFIG_LIMITS.tailleChiffres.max}
              step={10}
              suffix="%"
              onChange={(tailleChiffres) => patch({ tailleChiffres })}
            />
            <SelectField
              label="Affichage millisecondes (sous 10s)"
              htmlId="affichageMs"
              value={String(config.affichageMs)}
              options={YES_NO}
              onChange={(value) => patch({ affichageMs: parseBooleanSelect(value) })}
            />
            <button
              type="button"
              className="bouton-menu"
              id="btnFullScreen"
              aria-pressed={isFullscreen}
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? 'Quitter le plein écran' : 'Activer le plein écran'}
            </button>
            <p className="install-hint">Utile dans le navigateur. En app installée, c’est déjà plein écran.</p>
          </SettingsSection>

          <SettingsSection title="Sons & vibration">
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
            <SoundLibrarySettings config={config} onChange={(next) => onChange(next)} />
          </SettingsSection>

          <SettingsSection title="Automatisation">
            <SelectField
              label="Redémarrage auto après nouveau coup"
              htmlId="autoStartOnReset"
              value={String(config.autoStartOnReset)}
              options={YES_NO}
              onChange={(value) => patch({ autoStartOnReset: parseBooleanSelect(value) })}
            />
            <p className="install-hint">
              Après un nouveau coup (double appui ou reset). Désactivé : le chrono reste figé.
            </p>
            <SelectField
              label="Relancer le chrono au clic joueur"
              htmlId="autoStartOnPlayerSelect"
              value={String(config.autoStartOnPlayerSelect)}
              options={YES_NO}
              onChange={(value) => patch({ autoStartOnPlayerSelect: parseBooleanSelect(value) })}
            />
            {config.minionsUnlocked ? (
              <>
                <SelectField
                  label="Mode Minions"
                  htmlId="minionsMode"
                  value={String(config.minionsMode)}
                  options={YES_NO}
                  onChange={(value) => patch({ minionsMode: parseBooleanSelect(value) })}
                />
                <p className="install-hint">
                  Cri Arghh historique à la première alerte orange. Même raccourci : appui long sur NEW.
                </p>
              </>
            ) : null}
          </SettingsSection>

          {extraSections ? <SettingsSection title="Miroir télécommande">{extraSections}</SettingsSection> : null}

          <SettingsSection title="Application">
            <p className="app-version">H8timer v{APP_VERSION}</p>
            <button
              type="button"
              className="bouton-menu"
              onClick={onInstall}
              disabled={installCopy.disabled}
            >
              {installCopy.label}
            </button>
            <p className="install-hint">{installCopy.hint}</p>
            <button type="button" className="bouton-menu" onClick={onCheckUpdates}>
              Vérifier les mises à jour
            </button>
            <p className="install-hint">Compare la version installée avec le serveur.</p>
            {updateAvailable && onApplyUpdate && onSnoozeUpdate ? (
              <div className="update-settings">
                <p className="install-hint">
                  {incomingVersion
                    ? `Nouvelle version détectée : v${incomingVersion}.`
                    : 'Une nouvelle version est prête.'}{' '}
                  {rollbackCopy({ updateAvailable: true, snoozed: updateSnoozed }).message}
                </p>
                <button type="button" className="bouton-menu" onClick={onApplyUpdate}>
                  Mettre à jour
                </button>
                <button type="button" className="bouton-menu bouton-menu-secondary" onClick={onSnoozeUpdate}>
                  Rester sur cette version
                </button>
              </div>
            ) : (
              <p className="install-hint">{rollbackCopy({ updateAvailable: false, snoozed: false }).message}</p>
            )}
            <button type="button" className="bouton-menu" onClick={onShowChangelog}>
              Historique des versions
            </button>
            <button type="button" className="bouton-menu" onClick={onShowHelp}>
              Mode d'emploi
            </button>
          </SettingsSection>
        </div>
      </div>
    </>
  );
}
