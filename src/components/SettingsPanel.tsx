import { useRef, useState, type ReactNode, type TouchEvent } from 'react';
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
import type { CompetitionMode, InterfaceMode, Theme, TimerConfig } from '../timer/types';
import { previewAlertSound } from '../audio/toneAudio';
import type { VolumeMode } from '../audio/loudness';
import { dbToGain, gainToDb } from '../timer/volume';
import { NumberStepper, parseBooleanSelect, SelectField, VolumeSlider } from './NumberStepper';
import { ImportPanel } from './ImportPanel';
import { PresetManager } from './PresetManager';
import { ThemeLibrary } from './ThemeLibrary';
import type { ThemesController } from '../hooks/useThemes';
import type { ShareEnvelope } from '../share/envelope';
import type { CustomPreset } from '../timer/presets';
import type { CustomTheme } from '../timer/themes';
import type { PresetsController } from '../hooks/usePresets';
import { PlayerNameField } from './PlayerNameField';
import { SettingsSection } from './SettingsSection';
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
  presetsController: PresetsController;
  themesController: ThemesController;
  onNotify: (message: string) => void;
  onSharePreset: (preset: CustomPreset) => void;
  onShareTheme: (theme: CustomTheme) => void;
  onImportEnvelope: (envelope: ShareEnvelope) => void;
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

type SettingsTab = 'match' | 'apparence' | 'appareil';

const SETTINGS_TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: 'match', label: 'Match' },
  { id: 'apparence', label: 'Apparence' },
  { id: 'appareil', label: 'Appareil & partage' },
];

const SIDES_OPTIONS = [
  { value: 'players', label: 'Joueurs (1 contre 1)' },
  { value: 'teams', label: 'Équipes (A contre B)' },
];

const VOLUME_MODE_OPTIONS = [
  { value: 'max', label: 'Maximum (recommandé)' },
  { value: 'custom', label: 'Réglable' },
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

const REMOTE_LAYOUT_OPTIONS = [
  { value: 'remote', label: 'Télécommande (chrono en vedette)' },
  { value: 'classic', label: 'Classique' },
];

const REMOTE_SCORE_OPTIONS = [
  { value: 'compact', label: 'Bandeau compact' },
  { value: 'full', label: 'Grand' },
  { value: 'hidden', label: 'Masqué' },
];

const DISPLAY_LAYOUT_OPTIONS = [
  { value: 'timer', label: 'Chrono en grand (score discret)' },
  { value: 'balanced', label: 'Équilibré' },
  { value: 'score', label: 'Score en grand' },
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
  presetsController,
  themesController,
  onNotify,
  onSharePreset,
  onShareTheme,
  onImportEnvelope,
}: SettingsPanelProps) {
  const [tab, setTab] = useState<SettingsTab>('match');
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
                aria-selected={tab === entry.id}
                aria-controls="settings-tabpanel"
                className={`settings-tab${tab === entry.id ? ' active' : ''}`}
                onClick={() => setTab(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" id="settings-tabpanel" aria-labelledby={`settings-tab-${tab}`}>
          {tab === 'match' ? (
            <>
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

            <SettingsSection title="Score" defaultOpen>
              <SelectField
                label="Scoreur (1 contre 1)"
                htmlId="matchEnabled"
                value={String(config.matchOptions.enabled)}
                options={YES_NO}
                onChange={(value) => patchMatch({ enabled: parseBooleanSelect(value) })}
              />
              <SelectField
                label="Tirage à la bande au début du match"
                htmlId="matchLagAtStart"
                value={String(config.matchOptions.lagAtStart)}
                options={YES_NO}
                onChange={(value) => patchMatch({ lagAtStart: parseBooleanSelect(value) })}
              />
              <p className="install-hint">
                Sert à désigner le premier casseur (joueur ou équipe), une seule fois par match. Ensuite la casse alterne
                à chaque manche marquée. Désactivé : la casse commence au joueur 1.
              </p>
              <SelectField
                label="Joueurs ou équipes"
                htmlId="matchSides"
                value={config.matchOptions.sides}
                options={SIDES_OPTIONS}
                onChange={(sides) => patchMatch({ sides: sides as MatchOptions['sides'] })}
              />
              <SelectField
                label="Marquer une manche relance le chrono"
                htmlId="matchFrameRestartsTimer"
                value={String(config.matchOptions.frameRestartsTimer)}
                options={YES_NO}
                onChange={(value) => patchMatch({ frameRestartsTimer: parseBooleanSelect(value) })}
              />
              <p className="install-hint">
                Oui : un + au score lance la nouvelle manche du chrono (temps de base, extensions remises à zéro) avec le
                joueur qui casse.
              </p>
              <NumberStepper
                label="Course à (0 = sans limite)"
                htmlId="matchTargetScore"
                value={config.matchOptions.targetScore}
                min={MATCH_LIMITS.targetScore.min}
                max={MATCH_LIMITS.targetScore.max}
                suffix=""
                onChange={(targetScore) => patchMatch({ targetScore })}
              />
              <SelectField
                label="Afficher les casses fermes (F)"
                htmlId="matchShowFerme"
                value={String(config.matchOptions.showFerme)}
                options={YES_NO}
                onChange={(value) => patchMatch({ showFerme: parseBooleanSelect(value) })}
              />
              <SelectField
                label="Afficher la blanche (qui casse)"
                htmlId="matchShowBreaker"
                value={String(config.matchOptions.showBreaker)}
                options={YES_NO}
                onChange={(value) => patchMatch({ showBreaker: parseBooleanSelect(value) })}
              />
              <p className="install-hint">
                Score et casses fermes sont deux compteurs séparés. Appui sur la blanche : inverser le casseur.
              </p>
              <button type="button" className="bouton-menu" onClick={onUndoMatch} disabled={!canUndoMatch}>
                Annuler la dernière action du score
              </button>
              <button type="button" className="bouton-menu bouton-menu-secondary" onClick={onNewMatch}>
                Nouveau match (tout remettre à zéro)
              </button>
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
              <PresetManager
                config={config}
                controller={presetsController}
                onApply={(next) => onChange(next, { resetShot: true })}
                onNotify={onNotify}
                onShare={onSharePreset}
              />
              <p className="install-hint">
                Presets de chronométrage uniquement. Changer le thème ou les couleurs ne change pas le preset. Ultimate
                FBEP : pas d’après casse. Les autres gardent le bouton si le temps post-casse est distinct.
              </p>
              <NumberStepper
                label="Temps de base (sec)"
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
                  label={`Temps après casse (${formatSecondsClock(config.tempsApresCasse)})`}
                  htmlId="tempsApresCasse"
                  value={config.tempsApresCasse}
                  min={CONFIG_LIMITS.tempsApresCasse.min}
                  max={CONFIG_LIMITS.tempsApresCasse.max}
                  suffix="s"
                  onChange={(tempsApresCasse) => patchTimings({ tempsApresCasse }, true)}
                />
              )}
              <NumberStepper
                label="Temps d'extension (sec)"
                htmlId="tempsExtension"
                value={config.tempsExtension}
                min={CONFIG_LIMITS.tempsExtension.min}
                max={CONFIG_LIMITS.tempsExtension.max}
                suffix="s"
                onChange={(tempsExtension) => patchTimings({ tempsExtension })}
              />
              <NumberStepper
                label="Seuil Alerte Orange (sec)"
                htmlId="seuilAlerte"
                value={config.seuilAlerte}
                min={CONFIG_LIMITS.seuilAlerte.min}
                max={CONFIG_LIMITS.seuilAlerte.max}
                suffix="s"
                onChange={(seuilAlerte) => patchTimings({ seuilAlerte })}
              />
              <NumberStepper
                label="Seuil Alerte Rouge (sec)"
                htmlId="seuilCritique"
                value={config.seuilCritique}
                min={CONFIG_LIMITS.seuilCritique.min}
                max={CONFIG_LIMITS.seuilCritique.max}
                suffix="s"
                onChange={(seuilCritique) => patchTimings({ seuilCritique })}
              />
              <p className="install-hint">+/− ou saisie au clavier (pavé numérique).</p>
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

            </>
          ) : null}
          {tab === 'apparence' ? (
            <>
            <SettingsSection title="Apparence">
              <SelectField
                label="Thème visuel"
                htmlId="themeVisuel"
                value={config.theme}
                options={THEME_OPTIONS}
                onChange={(theme) => onChange(applyNamedTheme(config, theme as Theme))}
              />
              <p className="install-hint">
                Un thème remplit toutes les couleurs de zone. Vous pouvez ensuite les modifier sans toucher au preset de
                compétition (FFB, Ultimate, TD/TN, Master).
              </p>
              <ThemeColorEditor colors={config.colors} onChange={(colors) => patch({ colors })} />
              <button
                type="button"
                className="bouton-menu bouton-menu-secondary"
                onClick={() => onChange(applyNamedTheme(config, config.theme))}
              >
                Réinitialiser les couleurs du thème
              </button>
              <ThemeLibrary
                config={config}
                controller={themesController}
                onApply={(next) => onChange(next)}
                onShare={onShareTheme}
                onNotify={onNotify}
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

            <SettingsSection title="Affichage télécommande & écran">
              <SelectField
                label="Vue du téléphone quand une salle est ouverte"
                htmlId="remoteLayout"
                value={config.viewOptions.remoteLayout}
                options={REMOTE_LAYOUT_OPTIONS}
                onChange={(remoteLayout) => patchView({ remoteLayout: remoteLayout as RemoteLayout })}
              />
              <SelectField
                label="Score sur la télécommande"
                htmlId="remoteScore"
                value={config.viewOptions.remoteScore}
                options={REMOTE_SCORE_OPTIONS}
                onChange={(remoteScore) => patchView({ remoteScore: remoteScore as RemoteScoreMode })}
              />
              <SelectField
                label="Garder l’écran du téléphone allumé"
                htmlId="remoteWakeLock"
                value={String(config.viewOptions.remoteWakeLock)}
                options={YES_NO}
                onChange={(value) => patchView({ remoteWakeLock: parseBooleanSelect(value) })}
              />
              <SelectField
                label="Mise en page de l’écran Visuel"
                htmlId="displayLayout"
                value={config.viewOptions.displayLayout}
                options={DISPLAY_LAYOUT_OPTIONS}
                onChange={(displayLayout) => patchView({ displayLayout: displayLayout as DisplayLayout })}
              />
              <p className="install-hint">
                Le chrono reste toujours l’élément principal. « Chrono en grand » réduit le score à un bandeau discret ;
                le choix s’applique à tous les écrans Visuel de la salle.
              </p>
            </SettingsSection>

            </>
          ) : null}
          {tab === 'appareil' ? (
            <>
            <SettingsSection title="Sons & vibration">
              <SelectField
                label="Volume des alertes"
                htmlId="volumeMode"
                value={config.volumeMode}
                options={VOLUME_MODE_OPTIONS}
                onChange={(volumeMode) => patch({ volumeMode: volumeMode as VolumeMode })}
              />
              {config.volumeMode === 'custom' ? (
                <VolumeSlider
                  label="Niveau réglable"
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
                Tester le volume
              </button>
              <p className="install-hint">
                Maximum : l’application pousse le son au plus fort (gain + limiteur anti-saturation). Elle ne peut pas
                dépasser le volume média du téléphone : montez-le au maximum avec les boutons de volume, et sur iPhone
                désactivez le mode silencieux.
              </p>
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

            {extraSections ? <SettingsSection title="Miroir télécommande">{extraSections}</SettingsSection> : null}

            {streamSection ? (
              <SettingsSection title="Streaming (OBS / Streamlabs)">{streamSection}</SettingsSection>
            ) : null}

            <SettingsSection title="Partage & import">
              <ImportPanel onImport={onImportEnvelope} />
            </SettingsSection>

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

            </>
          ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
