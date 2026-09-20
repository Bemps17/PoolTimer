import { useCallback, useEffect, useState } from 'react';
import { minionsToggleMessage, toggleMinionsMode } from './audio/minions';
import { APP_VERSION } from './changelog';
import { ChangelogPanel } from './components/ChangelogPanel';
import { HelpPanel } from './components/HelpPanel';
import { Scoreboard } from './components/Scoreboard';
import { SettingsPanel } from './components/SettingsPanel';
import { Toast } from './components/Toast';
import { UpdateBanner } from './components/UpdateBanner';
import { useBilliardTimer } from './hooks/useBilliardTimer';
import { useFullscreen } from './hooks/useFullscreen';
import { usePwaInstall } from './hooks/usePwaInstall';
import { usePwaUpdate } from './hooks/usePwaUpdate';
import type { TimerConfig } from './timer/types';

export default function App() {
  const timer = useBilliardTimer();
  const { isFullscreen, toggle } = useFullscreen();
  const pwaInstall = usePwaInstall();
  const pwaUpdate = usePwaUpdate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('Paramètres sauvegardés !');

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

  return (
    <>
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
