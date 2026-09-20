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
import { UpdateBanner } from './components/UpdateBanner';
import { useBilliardTimer } from './hooks/useBilliardTimer';
import { useFullscreen } from './hooks/useFullscreen';
import { useControllerMirror } from './hooks/useMirror';
import { usePwaInstall } from './hooks/usePwaInstall';
import { usePwaUpdate } from './hooks/usePwaUpdate';
import { displayUrl, parseDisplayRoom } from './mirror/protocol';
import { loadBetaMirrorEnabled, saveBetaMirrorEnabled } from './mirror/storage';
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
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('Paramètres sauvegardés !');
  const [betaMirror, setBetaMirror] = useState(() => loadBetaMirrorEnabled());
  const mirror = useControllerMirror({
    enabled: betaMirror,
    state: timer.state,
    config: timer.config,
  });

  useEffect(() => {
    if (!toastVisible) return undefined;
    const id = window.setTimeout(() => setToastVisible(false), 2200);
    return () => window.clearTimeout(id);
  }, [toastVisible]);

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

  const handleBetaMirror = useCallback((enabled: boolean) => {
    saveBetaMirrorEnabled(enabled);
    setBetaMirror(enabled);
  }, []);

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

  const handleCopyLogs = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToastMessage('Logs miroir copiés');
    } catch {
      setToastMessage('Impossible de copier les logs');
    }
    setToastVisible(true);
  }, []);

  return (
    <>
      {mirror.room ? (
        <div
          className={`mirror-live-chip mirror-live-chip-${mirror.sync.health}`}
          aria-live="polite"
        >
          {mirror.sync.chip || `Bêta · ${mirror.room}`}
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
        onToggleFullscreen={toggle}
        installStatus={pwaInstall.status}
        onInstall={() => {
          void pwaInstall.install();
        }}
        onCheckUpdates={() => {
          void handleCheckUpdates();
        }}
        extraSections={
          <MirrorSettings
            betaEnabled={betaMirror}
            onBetaChange={handleBetaMirror}
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
            onCopyLogs={(text) => {
              void handleCopyLogs(text);
            }}
          />
        }
      />
      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ChangelogPanel open={changelogOpen} onClose={() => setChangelogOpen(false)} />
      <Toast visible={toastVisible} message={toastMessage} />
      <UpdateBanner
        visible={pwaUpdate.updateAvailable}
        incomingVersion={pwaUpdate.incomingVersion}
        onUpdate={pwaUpdate.applyUpdate}
      />
    </>
  );
}
