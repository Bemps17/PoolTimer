import { useCallback, useEffect, useState } from 'react';
import { HelpPanel } from './components/HelpPanel';
import { Scoreboard } from './components/Scoreboard';
import { SettingsPanel } from './components/SettingsPanel';
import { Toast } from './components/Toast';
import { useBilliardTimer } from './hooks/useBilliardTimer';
import { useFullscreen } from './hooks/useFullscreen';
import type { TimerConfig } from './timer/types';

export default function App() {
  const timer = useBilliardTimer();
  const { isFullscreen, toggle } = useFullscreen();
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (!toastVisible) return undefined;
    const id = window.setTimeout(() => setToastVisible(false), 2000);
    return () => window.clearTimeout(id);
  }, [toastVisible]);

  const handleConfigChange = useCallback(
    (next: TimerConfig, options?: { resetShot?: boolean }) => {
      timer.updateConfig(next, options);
      setToastVisible(true);
    },
    [timer.updateConfig],
  );

  return (
    <>
      <Scoreboard
        config={timer.config}
        state={timer.state}
        menuOpen={menuOpen}
        isFullscreen={isFullscreen}
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
        onToggleFullscreen={toggle}
      />
      <SettingsPanel
        open={menuOpen}
        config={timer.config}
        onClose={() => setMenuOpen(false)}
        onChange={handleConfigChange}
        onShowHelp={() => setHelpOpen(true)}
      />
      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
      <Toast visible={toastVisible} />
    </>
  );
}
