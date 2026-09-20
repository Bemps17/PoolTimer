import { useCallback, useEffect, useState } from 'react';
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

  const handleUnlockMinions = useCallback(() => {
    if (timer.config.minionsUnlocked) return;
    timer.updateConfig({ ...timer.config, minionsUnlocked: true, minionsMode: true });
    setToastMessage('Mode Minions débloqué');
    setToastVisible(true);
  }, [timer.config, timer.updateConfig]);

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
        onUnlockMinions={handleUnlockMinions}
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
      />
      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ChangelogPanel open={changelogOpen} onClose={() => setChangelogOpen(false)} />
      <Toast visible={toastVisible} message={toastMessage} />
      <UpdateBanner
        visible={pwaUpdate.needRefresh}
        incomingVersion={pwaUpdate.incomingVersion}
        onUpdate={pwaUpdate.applyUpdate}
      />
    </>
  );
}
