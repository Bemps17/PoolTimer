import { useRef, useState, type ReactNode, type TouchEvent } from 'react';
import { Ellipsis, MonitorSmartphone, Palette, Timer, Volume2, type LucideIcon } from 'lucide-react';
import { APP_VERSION } from '../changelog';
import { installButtonCopy, type PwaInstallStatus } from '../pwa/installStatus';
import { rollbackCopy } from '../pwa/updateChoice';
import {
  applyCompetitionPreset,
  applyNamedTheme,
  CONFIG_LIMITS,
  matchesCompetitionPreset,
  showsApresCasseControl,
  withSyncedCompetitionMode,
} from '../timer/config';
import { MATCH_LIMITS, type MatchOptions } from '../timer/match';
import type { DisplayLayout, RemoteLayout, RemoteScoreMode, ViewOptions } from '../timer/viewOptions';
import { formatSecondsClock } from '../timer/format';
import { colorsForTheme } from '../timer/theme';
import type { CompetitionMode, InterfaceMode, Theme, TimerConfig } from '../timer/types';
import { previewAlertSound } from '../audio/toneAudio';
import type { VolumeMode } from '../audio/loudness';
import { dbToGain, gainToDb } from '../timer/volume';
import { FitText } from './FitText';
import { NumberStepper, VolumeSlider } from './NumberStepper';
import { SegmentedField, SettingsCard, SettingsDisclosure, ToggleField } from './SettingsControls';
import { ImportPanel } from './ImportPanel';
import { PresetManager } from './PresetManager';
import { ThemeLibrary } from './ThemeLibrary';
import type { ThemesController } from '../hooks/useThemes';
import type { ShareEnvelope } from '../share/envelope';
import type { CustomPreset } from '../timer/presets';
import type { CustomTheme } from '../timer/themes';
import type { PresetsController } from '../hooks/usePresets';
import { PlayerNameField } from './PlayerNameField';
import { SoundLibrarySettings } from './SoundLibrarySettings';
import { ThemeColorEditor } from './ThemeColorEditor';

interface SettingsPanelProps {
  open: boolean;
  config: TimerConfig;
  isFullscreen: boolean;
  onClose: () => void;
  onChange: (next: TimerConfig, options?: { resetShot?: boolean }) => void;
  onShowHelp: () => void;
  onShowChangelog: () => void;
  onShowTutorial: () => void;
  onNewMatch: () => void;
  onUndoMatch: () => void;
  canUndoMatch: boolean;
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
  streamSection?: ReactNode;
  diagnosticsSection?: ReactNode;
  presetsController: PresetsController;
  themesController: ThemesController;
  onNotify: (message: string) => void;
  onSharePreset: (preset: CustomPreset) => void;
  onShareTheme: (theme: CustomTheme) => void;
  onImportEnvelope: (envelope: ShareEnvelope) => void;
}

const THEME_OPTIONS: Array<{ value: Theme; label: string }> = [
  { value: 'sombre', label: 'Sombre' },
  { value: 'light', label: 'Clair' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'ffb', label: 'FFB' },
  { value: 'fbep', label: 'Ultimate' },
];

const INTERFACE_OPTIONS: Array<{ value: InterfaceMode; label: string }> = [
  { value: 'boutons', label: 'Boutons visibles' },
  { value: 'tactile', label: 'Boutons invisibles' },
];

type SettingsTab = 'match' | 'affichage' | 'apparence' | 'son' | 'plus';

/** Libellés courts (≤ 5 lettres) + icônes Lucide : lisibles et sans débordement, même police système agrandie. */
const SETTINGS_TABS: Array<{ id: SettingsTab; label: string; Icon: LucideIcon }> = [
  { id: 'match', label: 'Match', Icon: Timer },
  { id: 'affichage', label: 'Écran', Icon: MonitorSmartphone },
  { id: 'apparence', label: 'Thème', Icon: Palette },
  { id: 'son', label: 'Son', Icon: Volume2 },
  { id: 'plus', label: 'Plus', Icon: Ellipsis },
];

const TAB_STORAGE_KEY = 'h8timer.settings.tab';

function loadTab(): SettingsTab {
  try {
    const saved = localStorage.getItem(TAB_STORAGE_KEY);
    return SETTINGS_TABS.some((entry) => entry.id === saved) ? (saved as SettingsTab) : 'match';
  } catch {
    return 'match';
  }
}

const SIDES_OPTIONS: Array<{ value: MatchOptions['sides']; label: string }> = [
  { value: 'players', label: 'Joueurs' },
  { value: 'teams', label: 'Équipes' },
];

const VOLUME_MODE_OPTIONS: Array<{ value: VolumeMode; label: string }> = [
  { value: 'max', label: 'Maximum' },
  { value: 'custom', label: 'Réglable' },
];

const REMOTE_LAYOUT_OPTIONS: Array<{ value: RemoteLayout; label: string }> = [
  { value: 'remote', label: 'Télécommande' },
  { value: 'classic', label: 'Classique' },
];

const REMOTE_SCORE_OPTIONS: Array<{ value: RemoteScoreMode; label: string }> = [
  { value: 'compact', label: 'Compact' },
  { value: 'full', label: 'Grand' },
  { value: 'hidden', label: 'Masqué' },
];

const DISPLAY_LAYOUT_OPTIONS: Array<{ value: DisplayLayout; label: string }> = [
  { value: 'timer', label: 'Chrono' },
  { value: 'balanced', label: 'Équilibré' },
  { value: 'score', label: 'Score' },
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
  onNewMatch,
  onUndoMatch,
  canUndoMatch,
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
  streamSection,
  diagnosticsSection,
  presetsController,
  themesController,
  onNotify,
  onSharePreset,
  onShareTheme,
  onImportEnvelope,
}: SettingsPanelProps) {
  const [tab, setTab] = useState<SettingsTab>(() => loadTab());
  const selectTab = (next: SettingsTab) => {
    setTab(next);
    try {
      localStorage.setItem(TAB_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef({ startX: 0, startY: 0, moveX: 0, moveY: 0, isDragging: false });

  const patch = (partial: Partial<TimerConfig>, resetShot = false) => {
    onChange({ ...config, ...partial }, { resetShot });
  };

  const applyMode = (mode: CompetitionMode) => {
    onChange(applyCompetitionPreset(config, mode), { resetShot: true });
  };

  const patchTimings = (partial: Partial<TimerConfig>, resetShot = false) => {
    onChange(withSyncedCompetitionMode({ ...config, ...partial }), { resetShot });
  };

  const patchMatch = (partial: Partial<MatchOptions>) => {
    onChange({ ...config, matchOptions: { ...config.matchOptions, ...partial } });
  };

  const patchView = (partial: Partial<ViewOptions>) => {
    onChange({ ...config, viewOptions: { ...config.viewOptions, ...partial } });
  };

  const hideApresCasse = !showsApresCasseControl(config);

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
          <div className="settings-tabs" role="tablist" aria-label="Catégories de réglages">
            {SETTINGS_TABS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                id={`settings-tab-${entry.id}`}
                aria-label={entry.label}
                aria-selected={tab === entry.id}
                aria-controls="settings-tabpanel"
                className={`settings-tab${tab === entry.id ? ' active' : ''}`}
                onClick={() => selectTab(entry.id)}
              >
                <entry.Icon className="settings-tab-icon" aria-hidden size={20} strokeWidth={1.75} />
                <FitText className="settings-tab-label" singleLine minFontPx={8}>
                  {entry.label}
                </FitText>
              </button>
            ))}
          </div>
          <div role="tabpanel" id="settings-tabpanel" aria-labelledby={`settings-tab-${tab}`}>
            {tab === 'match' ? (
              <>
                <SettingsCard title="Joueurs">
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
                </SettingsCard>

                <SettingsCard title="Chrono">
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
                  <NumberStepper
                    label="Temps de base"
                    htmlId="tempsBase"
                    value={config.tempsBase}
                    min={CONFIG_LIMITS.tempsBase.min}
                    max={CONFIG_LIMITS.tempsBase.max}
                    suffix="s"
                    onChange={(tempsBase) =>
                      patchTimings(hideApresCasse ? { tempsBase, tempsApresCasse: tempsBase } : { tempsBase }, true)
                    }
                  />
                  {hideApresCasse ? null : (
                    <NumberStepper
                      label={`Après casse (${formatSecondsClock(config.tempsApresCasse)})`}
                      htmlId="tempsApresCasse"
                      value={config.tempsApresCasse}
                      min={CONFIG_LIMITS.tempsApresCasse.min}
                      max={CONFIG_LIMITS.tempsApresCasse.max}
                      suffix="s"
                      onChange={(tempsApresCasse) => patchTimings({ tempsApresCasse }, true)}
                    />
                  )}
                  <NumberStepper
                    label="Extension"
                    htmlId="tempsExtension"
                    value={config.tempsExtension}
                    min={CONFIG_LIMITS.tempsExtension.min}
                    max={CONFIG_LIMITS.tempsExtension.max}
                    suffix="s"
                    onChange={(tempsExtension) => patchTimings({ tempsExtension })}
                  />
                  <SettingsDisclosure title="Mes presets">
                    <PresetManager
                      config={config}
                      controller={presetsController}
                      onApply={(next) => onChange(next, { resetShot: true })}
                      onNotify={onNotify}
                      onShare={onSharePreset}
                    />
                  </SettingsDisclosure>
                  <SettingsDisclosure title="Réglages avancés">
                    <NumberStepper
                      label="Seuil alerte orange"
                      htmlId="seuilAlerte"
                      value={config.seuilAlerte}
                      min={CONFIG_LIMITS.seuilAlerte.min}
                      max={CONFIG_LIMITS.seuilAlerte.max}
                      suffix="s"
                      onChange={(seuilAlerte) => patchTimings({ seuilAlerte })}
                    />
                    <NumberStepper
                      label="Seuil alerte rouge"
                      htmlId="seuilCritique"
                      value={config.seuilCritique}
                      min={CONFIG_LIMITS.seuilCritique.min}
                      max={CONFIG_LIMITS.seuilCritique.max}
                      suffix="s"
                      onChange={(seuilCritique) => patchTimings({ seuilCritique })}
                    />
                    <ToggleField
                      label="Redémarrage auto après nouveau coup"
                      checked={config.autoStartOnReset}
                      onChange={(autoStartOnReset) => patch({ autoStartOnReset })}
                    />
                    <ToggleField
                      label="Relancer le chrono au clic joueur"
                      checked={config.autoStartOnPlayerSelect}
                      onChange={(autoStartOnPlayerSelect) => patch({ autoStartOnPlayerSelect })}
                    />
                  </SettingsDisclosure>
                </SettingsCard>

                <SettingsCard title="Score">
                  <ToggleField
                    label="Afficher le score"
                    checked={config.matchOptions.enabled}
                    onChange={(enabled) => patchMatch({ enabled })}
                  />
                  {config.matchOptions.enabled ? (
                    <>
                      <SegmentedField
                        label="Qui joue"
                        value={config.matchOptions.sides}
                        options={SIDES_OPTIONS}
                        onChange={(sides) => patchMatch({ sides })}
                      />
                      <NumberStepper
                        label="Course à (0 = sans limite)"
                        htmlId="matchTargetScore"
                        value={config.matchOptions.targetScore}
                        min={MATCH_LIMITS.targetScore.min}
                        max={MATCH_LIMITS.targetScore.max}
                        suffix=""
                        onChange={(targetScore) => patchMatch({ targetScore })}
                      />
                      <ToggleField
                        label="Casses fermes (F)"
                        checked={config.matchOptions.showFerme}
                        onChange={(showFerme) => patchMatch({ showFerme })}
                      />
                      <ToggleField
                        label="Blanche (qui casse)"
                        checked={config.matchOptions.showBreaker}
                        onChange={(showBreaker) => patchMatch({ showBreaker })}
                        hint="Appui sur la blanche pour inverser le casseur."
                      />
                      <ToggleField
                        label="Tirage à la bande au début du match"
                        checked={config.matchOptions.lagAtStart}
                        onChange={(lagAtStart) => patchMatch({ lagAtStart })}
                      />
                      <ToggleField
                        label="Marquer une manche relance le chrono"
                        checked={config.matchOptions.frameRestartsTimer}
                        onChange={(frameRestartsTimer) => patchMatch({ frameRestartsTimer })}
                      />
                      <div className="settings-actions">
                        <button type="button" className="bouton-menu" onClick={onUndoMatch} disabled={!canUndoMatch}>
                          Annuler la dernière action
                        </button>
                        <button type="button" className="bouton-menu bouton-menu-secondary" onClick={onNewMatch}>
                          Nouveau match
                        </button>
                      </div>
                    </>
                  ) : null}
                </SettingsCard>
              </>
            ) : null}

            {tab === 'affichage' ? (
              <>
                <SettingsCard title="Mode d’interface">
                  <SegmentedField
                    label="Boutons à l’écran"
                    value={config.modeInterface}
                    options={INTERFACE_OPTIONS}
                    onChange={(modeInterface) => patch({ modeInterface })}
                    hint={
                      config.modeInterface === 'tactile'
                        ? 'Commandes au toucher : appui = départ / pause, double appui = nouveau coup.'
                        : undefined
                    }
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
                  <ToggleField
                    label="Dixièmes sous 10 s"
                    checked={config.affichageMs}
                    onChange={(affichageMs) => patch({ affichageMs })}
                  />
                  <button
                    type="button"
                    className="bouton-menu bouton-menu-secondary"
                    id="btnFullScreen"
                    aria-pressed={isFullscreen}
                    onClick={onToggleFullscreen}
                  >
                    {isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
                  </button>
                </SettingsCard>

                <SettingsCard title="Écran distant">
                  <SegmentedField
                    label="Téléphone quand une salle est ouverte"
                    value={config.viewOptions.remoteLayout}
                    options={REMOTE_LAYOUT_OPTIONS}
                    onChange={(remoteLayout) => patchView({ remoteLayout })}
                  />
                  {config.matchOptions.enabled ? (
                    <>
                      <SegmentedField
                        label="Score sur la télécommande"
                        value={config.viewOptions.remoteScore}
                        options={REMOTE_SCORE_OPTIONS}
                        onChange={(remoteScore) => patchView({ remoteScore })}
                      />
                      <SegmentedField
                        label="Écran Visuel"
                        value={config.viewOptions.displayLayout}
                        options={DISPLAY_LAYOUT_OPTIONS}
                        onChange={(displayLayout) => patchView({ displayLayout })}
                      />
                    </>
                  ) : null}
                  <ToggleField
                    label="Garder l’écran du téléphone allumé"
                    checked={config.viewOptions.remoteWakeLock}
                    onChange={(remoteWakeLock) => patchView({ remoteWakeLock })}
                  />
                </SettingsCard>
              </>
            ) : null}

            {tab === 'apparence' ? (
              <>
                <SettingsCard title="Thème">
                  <div className="theme-picker" role="radiogroup" aria-label="Thème">
                    {THEME_OPTIONS.map((option) => {
                      const swatch = colorsForTheme(option.value);
                      const active = config.theme === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          className={`theme-choice${active ? ' active' : ''}`}
                          onClick={() => onChange(applyNamedTheme(config, option.value))}
                        >
                          <span
                            className="theme-swatch"
                            aria-hidden
                            style={{ background: swatch.screen, color: swatch.digitDefault, borderColor: swatch.primary }}
                          >
                            45
                          </span>
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <SettingsDisclosure title="Personnaliser les couleurs">
                    <ThemeColorEditor colors={config.colors} onChange={(colors) => patch({ colors })} />
                    <button
                      type="button"
                      className="bouton-menu bouton-menu-secondary"
                      onClick={() => onChange(applyNamedTheme(config, config.theme))}
                    >
                      Réinitialiser les couleurs du thème
                    </button>
                  </SettingsDisclosure>
                </SettingsCard>
                <SettingsCard title="Mes thèmes">
                  <ThemeLibrary
                    config={config}
                    controller={themesController}
                    onApply={(next) => onChange(next)}
                    onShare={onShareTheme}
                    onNotify={onNotify}
                  />
                </SettingsCard>
              </>
            ) : null}

            {tab === 'son' ? (
              <>
                <SettingsCard title="Volume">
                  <SegmentedField
                    label="Volume des alertes"
                    value={config.volumeMode}
                    options={VOLUME_MODE_OPTIONS}
                    onChange={(volumeMode) => patch({ volumeMode })}
                    hint="Montez aussi le volume média du téléphone ; sur iPhone, désactivez le mode silencieux."
                  />
                  {config.volumeMode === 'custom' ? (
                    <VolumeSlider
                      label="Niveau"
                      htmlId="volumeSonore"
                      gain={dbToGain(config.volume)}
                      onChange={(gain) => patch({ volume: gainToDb(gain) })}
                    />
                  ) : null}
                  <button
                    type="button"
                    className="bouton-menu"
                    onClick={() => previewAlertSound('classic-alert-time', { ...config, sonAlertes: true })}
                  >
                    Tester le son
                  </button>
                </SettingsCard>
                <SettingsCard title="Alertes & vibration">
                  <ToggleField label="Alertes sonores" checked={config.sonAlertes} onChange={(sonAlertes) => patch({ sonAlertes })} />
                  <ToggleField label="Sons des boutons" checked={config.sonClics} onChange={(sonClics) => patch({ sonClics })} />
                  <ToggleField label="Vibration" checked={config.vibration} onChange={(vibration) => patch({ vibration })} />
                  {config.minionsUnlocked ? (
                    <ToggleField
                      label="Mode Minions"
                      checked={config.minionsMode}
                      onChange={(minionsMode) => patch({ minionsMode })}
                      hint="Cri Arghh à la première alerte orange (raccourci : appui long sur NEW)."
                    />
                  ) : null}
                  <SettingsDisclosure title="Bibliothèque d’alertes">
                    <SoundLibrarySettings config={config} onChange={(next) => onChange(next)} />
                  </SettingsDisclosure>
                </SettingsCard>
              </>
            ) : null}

            {tab === 'plus' ? (
              <>
                {extraSections ? <SettingsCard title="Miroir télécommande">{extraSections}</SettingsCard> : null}
                {streamSection ? <SettingsCard title="Streaming (OBS / Streamlabs)">{streamSection}</SettingsCard> : null}
                {diagnosticsSection ? <SettingsCard title="Diagnostic">{diagnosticsSection}</SettingsCard> : null}
                <SettingsCard title="Partage & import">
                  <ImportPanel onImport={onImportEnvelope} />
                </SettingsCard>
                <SettingsCard title="Application">
                  <p className="app-version">H8timer v{APP_VERSION}</p>
                  {updateAvailable && onApplyUpdate && onSnoozeUpdate ? (
                    <div className="update-settings">
                      <p className="settings-hint">
                        {incomingVersion ? `Nouvelle version : v${incomingVersion}.` : 'Une nouvelle version est prête.'}{' '}
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
                    <button type="button" className="bouton-menu" onClick={onCheckUpdates}>
                      Vérifier les mises à jour
                    </button>
                  )}
                  {installCopy.disabled ? null : (
                    <button type="button" className="bouton-menu" onClick={onInstall}>
                      {installCopy.label}
                    </button>
                  )}
                  <div className="settings-actions">
                    <button type="button" className="bouton-menu bouton-menu-secondary" onClick={onShowHelp}>
                      Mode d’emploi
                    </button>
                    <button type="button" className="bouton-menu bouton-menu-secondary" onClick={onShowChangelog}>
                      Nouveautés
                    </button>
                  </div>
                </SettingsCard>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
