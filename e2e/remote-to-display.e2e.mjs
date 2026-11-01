#!/usr/bin/env node
/**
 * Bout en bout : télécommande → relais (wrangler dev) → écran Visuel /d/CODE et overlay OBS /o/CODE.
 *   npm run test:e2e
 * Démarre le Worker local (8787) et Vite (5199, .env.development -> ws://localhost:8787).
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = 'http://localhost:5199';
const children = [];

function start(command, args, env = {}) {
  const child = spawn(command, args, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false', ...env },
    detached: true,
  });
  children.push(child);
  return child;
}

async function waitFor(url, timeoutMs = 60_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // pas encore prêt
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`timeout: ${url}`);
}

function stopAll() {
  for (const child of children) {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      // déjà arrêté
    }
  }
}

async function uncoveredTapTargets(page) {
  const count = await page.locator('.match-bar button').count();
  if (count < 6) return [`seulement ${count} bouton(s) de score trouvé(s)`];
  return page.evaluate(() =>
    [...document.querySelectorAll('.match-bar button')]
      .filter((button) => {
        const box = button.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return box.width < 44 || box.height < 44 || !(hit === button || button.contains(hit));
      })
      .map((button) => button.getAttribute('aria-label')),
  );
}

/** Boutons d'action (APRÈS CASSE, EXTENSION) et commandes : entiers à l'écran et non recouverts. */
async function hiddenActions(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('.timer-action-bar, .control-panel .bouton-sport')]
      .filter((element) => getComputedStyle(element).display !== 'none')
      .filter((element) => {
        const box = element.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return box.height < 44 || box.bottom > innerHeight || box.top < 0 || !(hit === element || element.contains(hit));
      })
      .map((element) => element.getAttribute('aria-label') ?? element.textContent?.trim()),
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(`ÉCHEC : ${message}`);
  console.log(`  ✓ ${message}`);
}

async function main() {
  start('npx', ['wrangler', 'dev', '--config', 'worker/wrangler.jsonc', '--port', '8787', '--ip', '127.0.0.1']);
  start('npx', ['vite', '--port', '5199', '--strictPort']);
  await waitFor('http://127.0.0.1:8787/health');
  await waitFor(APP);

  const browser = await chromium.launch();
  try {
    // Petits écrans : score + blanche + casses fermes ne doivent jamais masquer EXTENSION ni les commandes.
    for (const [width, height] of [[360, 640], [360, 780], [412, 915]]) {
      const small = await (await browser.newContext({ viewport: { width, height } })).newPage();
      await small.goto(APP);
      await small.evaluate(() =>
        localStorage.setItem(
          'billiardTimerConfig',
          JSON.stringify({ defaultsVersion: 2, matchOptions: { enabled: true, showFerme: true, showBreaker: true } }),
        ),
      );
      await small.reload();
      await small.locator('.match-bar').waitFor();
      const hidden = await hiddenActions(small);
      assert(hidden.length === 0, `${width}×${height}, score + blanche + F : EXTENSION et commandes visibles ${hidden.join(', ')}`);
      await small.context().close();
    }

    const remote = await (await browser.newContext({ viewport: { width: 360, height: 780 } })).newPage();
    await remote.goto(APP);
    await remote.evaluate(() => localStorage.clear());
    await remote.reload();
    await remote.locator('#timerDisplay').waitFor();
    assert((await remote.locator('.match-bar').count()) === 0, 'installation neuve : le chrono seul, pas de score');
    await remote.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('h8timer.beta.mirror', '1');
      localStorage.setItem(
        'billiardTimerConfig',
        JSON.stringify({
          defaultsVersion: 2,
          p1Name: 'Dupont',
          p2Name: 'Martin',
          matchOptions: { enabled: true, showFerme: true, frameRestartsTimer: true, targetScore: 2 },
        }),
      );
    });
    await remote.reload();
    await remote.waitForTimeout(400);
    const classic = await uncoveredTapTargets(remote);
    assert(classic.length === 0, `scoreur grand (vue classique) sur 360 px : boutons ≥ 44 px et accessibles ${classic.join(', ')}`);
    await remote.getByRole('button', { name: 'Ouvrir le menu' }).click();
    await remote.getByRole('tab', { name: 'Appareil & partage' }).click();
    await remote.getByText('Miroir télécommande', { exact: true }).first().click();
    await remote.getByRole('button', { name: /Ouvrir une salle/ }).click();
    await remote.waitForFunction(() => localStorage.getItem('h8timer.mirror.room'));
    const room = await remote.evaluate(() => localStorage.getItem('h8timer.mirror.room'));
    assert(/^[A-Z2-9]{6}$/.test(room), `salle ouverte (${room}), conservée sur l’appareil`);
    await remote.getByRole('button', { name: 'Fermer le menu' }).click();
    await remote.waitForTimeout(400);
    const covered = await uncoveredTapTargets(remote);
    assert(covered.length === 0, `scoreur compact sur 360 px : tous les boutons font ≥ 44 px et sont accessibles ${covered.join(', ')}`);

    const display = await (await browser.newContext({ viewport: { width: 1000, height: 560 } })).newPage();
    await display.goto(`${APP}/d/${room}`);
    await display.getByRole('img', { name: /Synchronisation OK/ }).waitFor({ timeout: 15_000 });
    assert(true, 'écran Visuel : voyant vert');
    const displayText = await display.locator('.display-top').textContent();
    assert(!/Miroir|Sync|lecture seule/.test(displayText ?? ''), 'écran Visuel : aucun texte de statut, juste le voyant');
    await remote.getByRole('img', { name: /Synchronisation OK/ }).waitFor({ timeout: 10_000 });
    assert(true, 'télécommande : voyant vert');

    const t0 = Date.now();
    await remote.getByLabel('Ajouter une manche à Dupont').click();
    await display.getByLabel('Score Dupont').filter({ hasText: '1' }).waitFor({ timeout: 10_000 });
    const latency = Date.now() - t0;
    assert(latency < 1_000, `le score marqué arrive sur l’écran Visuel en ${latency} ms (relais local)`);
    const active = (await remote.locator('.player-status.active').textContent()) ?? '';
    assert(active.includes('Martin'), 'marquer la manche relance le chrono avec le joueur qui casse (Martin)');

    await remote.locator('#btnPlayPause').click();
    await display.waitForTimeout(2_500);
    const shown = Number((await display.locator('.timer-officiel').textContent())?.trim());
    assert(shown > 0 && shown < 45, `le chrono défile sur l’écran Visuel (${shown} s)`);

    const overlay = await (await browser.newContext({ viewport: { width: 1280, height: 300 } })).newPage();
    await overlay.goto(`${APP}/o/${room}`);
    await overlay.locator('.overlay-timer').waitFor({ timeout: 10_000 });
    const look = await overlay.evaluate(() => ({
      body: getComputedStyle(document.body).backgroundColor,
      html: getComputedStyle(document.documentElement).backgroundColor,
      root: getComputedStyle(document.getElementById('root')).backgroundColor,
      classes: `${document.documentElement.className} | body: ${document.body.className}`,
      inline: document.body.getAttribute('style') ?? '',
    }));
    const transparent = [look.body, look.html, look.root].every((value) => value === 'rgba(0, 0, 0, 0)');
    assert(transparent, `overlay OBS : fond transparent ${transparent ? '' : JSON.stringify(look)}`);
    assert((await overlay.getByLabel('Score Dupont').textContent()) === '1', 'overlay OBS : score affiché');
    await remote.getByLabel('Ajouter une manche à Dupont').click();
    const end = remote.getByRole('dialog', { name: /Victoire de Dupont/ });
    await end.waitFor({ timeout: 5_000 });
    assert(((await end.textContent()) ?? '').includes('Dupont 2 – 0 Martin'), 'fin de match : victoire et résumé partageable');
    await end.getByRole('button', { name: /Fermer/ }).click();
    await remote.getByRole('button', { name: 'Ouvrir le menu' }).click();
    await remote.getByRole('tab', { name: 'Appareil & partage' }).click();
    await remote.getByText('Diagnostic', { exact: true }).first().click();
    const median = await remote.locator('.diagnostics-row', { hasText: 'Aller-retour médiane' }).locator('dd').textContent();
    assert(/\d+ ms/.test(median ?? ''), `diagnostic : aller-retour médian mesuré (${median})`);
    const [download] = await Promise.all([
      remote.waitForEvent('download'),
      remote.getByRole('button', { name: /Télécharger le journal/ }).click(),
    ]);
    const file = await download.path();
    const { readFile } = await import('node:fs/promises');
    const log = await readFile(file, 'utf8');
    const secret = await remote.evaluate(() => localStorage.getItem('h8timer.mirror.secret'));
    assert(download.suggestedFilename().endsWith('.log'), `journal téléchargé : ${download.suggestedFilename()}`);
    assert(log.includes('rôle: télécommande') && /synchro/.test(log), 'journal : en-tête et événements de synchro');
    assert(Boolean(secret) && !log.includes(secret), 'journal : le secret de salle n’y figure pas');
    console.log('e2e OK');
  } finally {
    await browser.close();
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(stopAll);
