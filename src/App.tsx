import { useCallback, useEffect, useState } from 'react';
import { minionsToggleMessage, toggleMinionsMode } from './audio/minions';
import { APP_VERSION } from './changelog';
import { ChangelogPanel } from './components/ChangelogPanel';
import { DisplayView } from './components/DisplayView';
import { HelpPanel } from './components/HelpPanel';
import { MirrorSettings } from './components/MirrorSettings';
import { Scoreboard } from './components/Scoreboard';
import { SettingsPanel } from './components/SettingsPanel';
import { Toast } from './components/Toast';
import { TutorialSlideshow } from './components/TutorialSlideshow';
import { UpdateBanner } from './components/UpdateBanner';
import { useBilliardTimer } from './hooks/useBilliardTimer';
import { useFullscreen } from './hooks/useFullscreen';
import { useControllerMirror } from './hooks/useMirror';
import { usePwaInstall } from './hooks/usePwaInstall';
import { usePwaUpdate } from './hooks/usePwaUpdate';
import { displayUrl, parseDisplayRoom } from './mirror/protocol';
import { loadMirrorEnabled, saveMirrorEnabled } from './mirror/storage';
import type { TimerConfig } from './timer/types';

export default function App() {
  const [displayRoom] = useState(() => parseDisplayRoom(window.location.pathname, window.location.search));
  if (displayRoom) {
    return <DisplayView room={displayRoom} />;
  }
  return <ControllerApp />;
}

function ControllerApp() {
  const timer = useBilliardTimer();
  const { isFullscreen, toggle } = useFullscreen();
  const pwaInstall = usePwaInstall();
  const pwaUpdate = usePwaUpdate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('Paramètres sauvegardés !');
  const [mirrorEnabled, setMirrorEnabled] = useState(() => loadMirrorEnabled());
  const mirror = useControllerMirror({
    enabled: mirrorEnabled,
    state: timer.state,
    config: timer.config,
  });

  useEffect(() => {
    if (!toastVisible) return undefined;
    const id = window.setTimeout(() => setToastVisible(false), 2200);
    return () => window.clearTimeout(id);
  }, [toastVisible]);

  const openTutorial = useCallback(() => {
    setMenuOpen(false);
    setHelpOpen(false);
    setChangelogOpen(false);
    setTutorialOpen(true);
  }, []);

  const handleConfigChange = useCallback(
    (next: TimerConfig, options?: { resetShot?: boolean }) => {
      timer.updateConfig(next, options);
      setToastMessage('Paramètres sauvegardés !');
      setToastVisible(true);
    },
    [timer.updateConfig],
  );

  const handleToggleMinions = useCallback(() => {
    const next = toggleMinionsMode(timer.config);
    timer.updateConfig(next);
    setToastMessage(minionsToggleMessage(next.minionsMode));
    setToastVisible(true);
  }, [timer.config, timer.updateConfig]);

  const handleCheckUpdates = useCallback(async () => {
    const result = await pwaUpdate.checkForUpdate();
    switch (result.status) {
      case 'update':
        setToastMessage(`Nouvelle version disponible (v${result.version})`);
        break;
      case 'current':
        setToastMessage(`H8timer est à jour (v${APP_VERSION})`);
        break;
      case 'unknown':
        setToastMessage('Impossible de vérifier les mises à jour');
        break;
      default: {
        const exhaustive: never = result;
        return exhaustive;
      }
    }
    setToastVisible(true);
  }, [pwaUpdate.checkForUpdate]);

  const handleMirrorEnabled = useCallback((enabled: boolean) => {
    saveMirrorEnabled(enabled);
    setMirrorEnabled(enabled);
  }, []);

  const handleSnoozeUpdate = useCallback(() => {
    pwaUpdate.snoozeUpdate();
    setToastMessage(`Vous restez sur H8timer v${APP_VERSION}`);
    setToastVisible(true);
  }, [pwaUpdate.snoozeUpdate]);

  const displayLink = mirror.room ? displayUrl(window.location.origin, mirror.room) : null;

  const handleCopyLink = useCallback(async () => {
    if (!displayLink) return;
    try {
      await navigator.clipboard.writeText(displayLink);
      setToastMessage('Lien de l’écran copié');
    } catch {
      setToastMessage(displayLink);
    }
    setToastVisible(true);
  }, [displayLink]);

  return (
    <>
      {mirror.room ? (
        <div
          className={`mirror-live-chip mirror-live-chip-${mirror.sync.health}`}
          aria-live="polite"
        >
          {mirror.sync.chip || `Miroir · ${mirror.room}`}
        </div>
      ) : null}
      <Scoreboard
        config={timer.config}
        state={timer.state}
        menuOpen={menuOpen}
        onTogglePlayPause={timer.togglePlayPause}
        onResetShot={timer.resetShot}
        onApresCasse={timer.triggerApresCasse}
        onExtension={timer.useExtension}
        onNewGame={timer.newGame}
        onSelectPlayer={timer.selectPlayer}
        onToggleMenu={() => {
          void timer.playClick();
          setMenuOpen(true);
        }}
        onToggleMinions={handleToggleMinions}
      />
      <SettingsPanel
        open={menuOpen}
        config={timer.config}
        isFullscreen={isFullscreen}
        onClose={() => setMenuOpen(false)}
        onChange={handleConfigChange}
        onShowHelp={() => setHelpOpen(true)}
        onShowChangelog={() => setChangelogOpen(true)}
        onShowTutorial={openTutorial}
        onToggleFullscreen={toggle}
        installStatus={pwaInstall.status}
        onInstall={() => {
          void pwaInstall.install();
        }}
        onCheckUpdates={() => {
          void handleCheckUpdates();
        }}
        updateAvailable={pwaUpdate.updateAvailable}
        incomingVersion={pwaUpdate.incomingVersion}
        updateSnoozed={pwaUpdate.snoozed}
        onApplyUpdate={pwaUpdate.applyUpdate}
        onSnoozeUpdate={handleSnoozeUpdate}
        extraSections={
          <MirrorSettings
            enabled={mirrorEnabled}
            onEnabledChange={handleMirrorEnabled}
            room={mirror.room}
            status={mirror.status}
            error={mirror.error}
            displayCount={mirror.displayCount}
            sync={mirror.sync}
            displayLink={displayLink}
            onCreateRoom={mirror.createRoom}
            onCloseRoom={mirror.closeRoom}
            onCopyLink={() => {
              void handleCopyLink();
            }}
          />
        }
      />
      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ChangelogPanel open={changelogOpen} onClose={() => setChangelogOpen(false)} />
      <TutorialSlideshow open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
      <Toast visible={toastVisible} message={toastMessage} />
      <UpdateBanner
        visible={pwaUpdate.bannerVisible}
        incomingVersion={pwaUpdate.incomingVersion}
        onUpdate={pwaUpdate.applyUpdate}
        onLater={handleSnoozeUpdate}
      />
    </>
  );
}
