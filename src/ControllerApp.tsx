import { useCallback, useEffect, useState } from 'react';
import { minionsToggleMessage, toggleMinionsMode } from './audio/minions';
import { APP_VERSION } from './changelog';
import { ChangelogPanel } from './components/ChangelogPanel';
import { StreamSettings } from './components/StreamSettings';
import { HelpPanel } from './components/HelpPanel';
import { LagPrompt } from './components/LagPrompt';
import { MatchEndDialog } from './components/MatchEndDialog';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { SyncDot } from './components/SyncDot';
import { breakerAfterScoreDelta, MATCH_LIMITS, matchSummary, matchWinner } from './timer/match';
import { displayPlayerName } from './timer/playerName';
import type { PlayerId } from './timer/types';
import { MatchScore } from './components/MatchScore';
import { MirrorSettings } from './components/MirrorSettings';
import { Scoreboard } from './components/Scoreboard';
import { SettingsPanel } from './components/SettingsPanel';
import { Toast } from './components/Toast';
import { TutorialSlideshow } from './components/TutorialSlideshow';
import { UpdateBanner } from './components/UpdateBanner';
import { useBilliardTimer } from './hooks/useBilliardTimer';
import { useFullscreen } from './hooks/useFullscreen';
import { useMatch } from './hooks/useMatch';
import { usePresets } from './hooks/usePresets';
import { useThemes } from './hooks/useThemes';
import { ImportDialog } from './components/ImportDialog';
import { ShareDialog, type ShareTarget } from './components/ShareDialog';
import { decodeShareText, SHARE_HASH_KEY, type ShareEnvelope } from './share/envelope';
import { applyPreset, type CustomPreset } from './timer/presets';
import { applyCustomTheme } from './timer/themes';
import { useKeepAwake } from './hooks/useKeepAwake';
import { useControllerMirror } from './hooks/useMirror';
import { usePwaInstall } from './hooks/usePwaInstall';
import { usePwaUpdate } from './hooks/usePwaUpdate';
import { displayUrl, toMirrorMatch } from './mirror/protocol';
import { loadMirrorEnabled, saveMirrorEnabled } from './mirror/storage';
import { isRemoteViewActive } from './timer/viewOptions';
import type { TimerConfig } from './timer/types';

export default function ControllerApp() {
  const timer = useBilliardTimer();
  const matchControl = useMatch(timer.config.matchOptions);
  const presetsController = usePresets();
  const themesController = useThemes();
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const [pendingImport, setPendingImport] = useState<ShareEnvelope | null>(null);
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
    match: matchControl.match,
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

  // Lien de partage ouvert (#h8=…) : aperçu + confirmation, puis on nettoie l'URL.
  useEffect(() => {
    if (!window.location.hash.includes(`${SHARE_HASH_KEY}=`)) return;
    const result = decodeShareText(window.location.hash);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    if (result.ok) {
      setPendingImport(result.envelope);
    } else {
      setToastMessage(result.error);
      setToastVisible(true);
    }
  }, []);

  const handleImportConfirm = useCallback(
    (apply: boolean) => {
      const envelope = pendingImport;
      if (!envelope) return;
      let next = timer.config;
      if (envelope.preset) {
        const { name, raceTo, ...timings } = envelope.preset;
        presetsController.create(name, timings, raceTo);
        if (apply) {
          const asPreset: CustomPreset = { id: 'import', name, raceTo, createdAt: 0, ...timings };
          next = applyPreset(next, asPreset);
        }
      }
      if (envelope.theme) {
        themesController.create(envelope.theme.name, envelope.theme.base, envelope.theme.colors);
        if (apply) next = applyCustomTheme(next, envelope.theme);
      }
      if (apply && next !== timer.config) timer.updateConfig(next, { resetShot: Boolean(envelope.preset) });
      setPendingImport(null);
      setToastMessage(apply ? 'Importé et appliqué' : 'Importé');
      setToastVisible(true);
    },
    [pendingImport, timer.config, timer.updateConfig, presetsController.create, themesController.create],
  );

  const handleNewMatch = useCallback(() => {
    if (!window.confirm('Remettre le score, les casses fermes et le tirage à zéro (nouveau match) ?')) return;
    matchControl.newMatch();
    setToastMessage('Nouveau match');
    setToastVisible(true);
  }, [matchControl.newMatch]);

  const viewOptions = timer.config.viewOptions;
  const remoteActive = isRemoteViewActive(Boolean(mirror.room), viewOptions);
  // Télécommande : écran allumé dès qu'une salle est ouverte (pas seulement en vue « télécommande »).
  useKeepAwake(Boolean(mirror.room) && viewOptions.remoteWakeLock);
  const matchOptions = timer.config.matchOptions;
  const mirrorMatch = toMirrorMatch(matchControl.match, matchOptions);
  const lagPrompt = matchOptions.enabled && matchOptions.lagAtStart && matchControl.match.lagPending;

  // Marquer une manche : score + (option) nouvelle manche du chrono avec le casseur suivant.
  const handleScore = useCallback(
    (player: PlayerId, delta: number) => {
      const current = matchControl.match;
      const accepted =
        delta > 0 ? current.scores[player] < MATCH_LIMITS.score.max : current.scores[player] > MATCH_LIMITS.score.min;
      matchControl.addScore(player, delta);
      if (accepted && delta > 0 && matchOptions.frameRestartsTimer) {
        timer.newGame(breakerAfterScoreDelta(current.breaker, delta));
      }
    },
    [matchControl.match, matchControl.addScore, matchOptions.frameRestartsTimer, timer.newGame],
  );

  // Fin de match : affichée une fois par score final (fermer = garder la main pour corriger).
  const winner = matchOptions.enabled ? matchWinner(matchControl.match, matchOptions.targetScore) : null;
  const endKey = winner ? `${matchControl.match.scores[1]}-${matchControl.match.scores[2]}` : null;
  const [dismissedEndKey, setDismissedEndKey] = useState<string | null>(null);
  const summary = matchSummary(matchControl.match, {
    p1: timer.config.p1Name,
    p2: timer.config.p2Name,
    targetScore: matchOptions.targetScore,
    sides: matchOptions.sides,
  });
  const handleShareSummary = useCallback(async (text: string) => {
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'Résultat du match', text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setToastMessage('Résultat copié');
    } catch {
      setToastMessage('Partage annulé');
    }
    setToastVisible(true);
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

  return (
    <>
      {mirror.room && !remoteActive ? (
        <aside className="mirror-live-dot">
          <SyncDot level={mirror.level} />
        </aside>
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
        remote={remoteActive ? { level: mirror.level, scorePlacement: viewOptions.remoteScore } : undefined}
        matchBar={
          matchOptions.enabled && !(remoteActive && viewOptions.remoteScore === 'hidden') ? (
            <MatchScore
              match={mirrorMatch}
              p1Name={timer.config.p1Name}
              p2Name={timer.config.p2Name}
              p1Color={timer.config.p1Color}
              p2Color={timer.config.p2Color}
              size={remoteActive && viewOptions.remoteScore === 'compact' ? 'compact' : 'full'}
              controls={{
                onScore: handleScore,
                onFerme: matchControl.addFerme,
                onToggleBreaker: matchControl.swapBreaker,
              }}
            />
          ) : null
        }
      />
      {winner && endKey !== dismissedEndKey && !lagPrompt ? (
        <MatchEndDialog
          winnerName={displayPlayerName(winner === 1 ? timer.config.p1Name : timer.config.p2Name, winner, matchOptions.sides)}
          summary={summary}
          onShare={(text) => void handleShareSummary(text)}
          onNewMatch={() => {
            matchControl.newMatch();
            timer.newGame();
            setDismissedEndKey(null);
          }}
          onClose={() => setDismissedEndKey(endKey)}
        />
      ) : null}
      {lagPrompt ? (
        <LagPrompt
          p1Name={timer.config.p1Name}
          p2Name={timer.config.p2Name}
          p1Color={timer.config.p1Color}
          p2Color={timer.config.p2Color}
          onChoose={matchControl.chooseFirstBreaker}
          onSkip={matchControl.dismissLag}
          sides={matchOptions.sides}
        />
      ) : null}
      <SettingsPanel
        open={menuOpen}
        config={timer.config}
        isFullscreen={isFullscreen}
        onClose={() => setMenuOpen(false)}
        onChange={handleConfigChange}
        onShowHelp={() => setHelpOpen(true)}
        onShowChangelog={() => setChangelogOpen(true)}
        onShowTutorial={openTutorial}
        presetsController={presetsController}
        themesController={themesController}
        onSharePreset={(preset) => setShareTarget({ kind: 'preset', preset })}
        onShareTheme={(theme) => setShareTarget({ kind: 'theme', theme })}
        onImportEnvelope={setPendingImport}
        onNotify={(message) => {
          setToastMessage(message);
          setToastVisible(true);
        }}
        onNewMatch={handleNewMatch}
        onUndoMatch={matchControl.undoLast}
        canUndoMatch={matchControl.canUndo}
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
        diagnosticsSection={
          menuOpen ? (
            mirror.room ? (
              <DiagnosticsPanel
                level={mirror.level}
                rows={mirror.diagnostics().rows}
                buildLog={mirror.diagnostics().buildLog}
                fileName={`h8timer-telecommande-${mirror.room}.log`}
                onClear={() => {
                  mirror.clearLog();
                  setToastMessage('Journal effacé');
                  setToastVisible(true);
                }}
              />
            ) : (
              <p className="install-hint">
                Ouvrez une salle (Miroir télécommande) pour mesurer la synchro. Voyant : vert = OK, orange = latence,
                rouge = interrompu.
              </p>
            )
          ) : null
        }
        streamSection={
          <StreamSettings
            room={mirror.room}
            onCopied={(message) => {
              setToastMessage(message);
              setToastVisible(true);
            }}
          />
        }
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
      {shareTarget ? (
        <ShareDialog
          target={shareTarget}
          config={timer.config}
          onClose={() => setShareTarget(null)}
          onNotify={(message) => {
            setToastMessage(message);
            setToastVisible(true);
          }}
        />
      ) : null}
      {pendingImport ? (
        <ImportDialog
          envelope={pendingImport}
          config={timer.config}
          onAdd={handleImportConfirm}
          onCancel={() => setPendingImport(null)}
        />
      ) : null}
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
