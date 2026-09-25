'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { PROVIDERS } = require('../providers');
const { isOnPath } = require('../detect-agents');

const HU_PHASES = ['develop', 'test', 'quality', 'deploy', 'tracking'];
const FEATURE_PHASES = ['analysis', 'design'];

function loadState(projectDir) {
  const statePath = path.join(projectDir, '.harness-state.json');
  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

// `cache` (opcional, Map de docsPath -> tasks[]) permite que una misma corrida de
// `collect()`/`buildDashboardData()` lea el tasks.json de cada HU una sola vez, aunque
// varias partes del pipeline (collectHu aca, y el indexado de metadata en
// dashboard-data.js) necesiten esa misma lista.
function loadTasks(projectDir, docsPath, cache) {
  if (!docsPath) return [];
  if (cache && cache.has(docsPath)) return cache.get(docsPath);

  const tasksPath = path.join(projectDir, docsPath, 'tasks.json');
  let tasks = [];
  if (fs.existsSync(tasksPath)) {
    try {
      tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8')).tasks || [];
    } catch {
      tasks = [];
    }
  }

  if (cache) cache.set(docsPath, tasks);
  return tasks;
}

// Itera el registro de providers (bin/lib/providers/index.js) en vez de tener un
// CLI hardcodeado por nombre: cada provider declara su propio `trackingSource`
// (`{ priority, collect(projectDir, expectedTokens, window) }`, o `null`/ausente si
// no tiene fuente de tracking, ej. Codex). Prioridad mas baja = se intenta primero
// (Claude Code va primero por ser el mecanismo mas preciso, confirmado
// empiricamente; opencode es el fallback). Nunca inventa un numero si ninguna
// fuente real esta disponible.
//
// `deps` es solo para tests (inyectar un registro de providers/deteccion de PATH
// falsos sin depender de que binarios reales esten instalados); el uso normal nunca
// lo pasa y usa el registro real.
function collectForWindow(projectDir, expectedTokens, window, deps = {}) {
  const providers = deps.providers || PROVIDERS;
  const isProviderAvailable = deps.isOnPath || isOnPath;

  const sources = providers
    .filter((p) => p.trackingSource && isProviderAvailable(p.detectBinary))
    .sort((a, b) => a.trackingSource.priority - b.trackingSource.priority);

  for (const provider of sources) {
    const result = provider.trackingSource.collect(projectDir, expectedTokens, window);
    if (result.tokens) return result;
  }

  return {
    tokens: null,
    source: 'unavailable',
    sessionsMatched: [],
    warnings: ['ningun CLI soportado disponible en PATH, o ninguna fuente devolvio datos reales'],
  };
}

function durationSeconds(startedAt, completedAt) {
  return (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000;
}

// Si la fase/tarea ya tiene un bloque `tracking` persistido con tokens reales (via
// `state tracking record`, ver bin/lib/state/tracking.js), se reutiliza tal cual en vez
// de re-escanear las fuentes de sesion: la ventana startedAt/completedAt de una fase
// COMPLETADA es inmutable, asi que sus tokens no cambian entre corridas. `--force`
// (opts.force) omite este atajo y fuerza el recalculo (ej. si se corrigio un bug en el
// parser de un provider y hace falta reprocesar la historia). Nunca se reutiliza un
// resultado "unavailable" (tokens null) -- ese si se reintenta siempre, por si la fuente
// aparece disponible en una corrida posterior. Tampoco se reutiliza un resultado de
// claude-transcript sin `processed`: lo calculo el parser anterior a v0.8.1, que contaba
// cada mensaje ~2x y sumaba cache read en `total`.
function reuseCachedTracking(cached, duration) {
  if (!cached || !cached.tokens) return null;
  if (cached.tokensSource === 'claude-transcript' && cached.tokens.processed == null) return null;
  return {
    durationSeconds: duration,
    tokens: cached.tokens,
    tokensSource: cached.tokensSource,
    sessionsMatched: cached.sessionsMatched,
    costUsd: cached.costUsd ?? null,
    collectedAt: cached.collectedAt,
    warnings: cached.warnings || [],
  };
}

function collectPhase(projectDir, faseName, featureId, huId, phaseObj, opts = {}) {
  if (!phaseObj || !phaseObj.startedAt || !phaseObj.completedAt) return null;
  const duration = durationSeconds(phaseObj.startedAt, phaseObj.completedAt);

  const reused = !opts.force && reuseCachedTracking(phaseObj.tracking, duration);
  const computed =
    reused ||
    (() => {
      const expectedTokens = huId ? [faseName, featureId, huId] : [faseName, featureId];
      const window = { startedAt: phaseObj.startedAt, completedAt: phaseObj.completedAt };
      const result = collectForWindow(projectDir, expectedTokens, window);
      return {
        durationSeconds: duration,
        tokens: result.tokens,
        tokensSource: result.source,
        sessionsMatched: result.sessionsMatched,
        costUsd: result.costUsd || null,
        collectedAt: new Date().toISOString(),
        warnings: result.warnings,
      };
    })();

  return { fase: faseName, featureId, huId: huId || null, ...computed };
}

function collectTask(projectDir, featureId, huId, task, opts = {}) {
  if (!task.startedAt || !task.completedAt) return null;
  const duration = durationSeconds(task.startedAt, task.completedAt);

  const reused = !opts.force && reuseCachedTracking(task.tracking, duration);
  const computed =
    reused ||
    (() => {
      const expectedTokens = [task.id, featureId, huId];
      const window = { startedAt: task.startedAt, completedAt: task.completedAt };
      const result = collectForWindow(projectDir, expectedTokens, window);
      return {
        durationSeconds: duration,
        tokens: result.tokens,
        tokensSource: result.source,
        sessionsMatched: result.sessionsMatched,
        costUsd: result.costUsd || null,
        collectedAt: new Date().toISOString(),
        warnings: result.warnings,
      };
    })();

  return { taskId: task.id, featureId, huId, ...computed };
}

function collectHu(projectDir, state, featureId, huId, opts = {}) {
  const feature = (state.features || []).find((f) => f.id === featureId);
  if (!feature) throw new Error(`Feature ${featureId} no encontrada en .harness-state.json`);
  const hu = (feature.userStories || []).find((u) => u.id === huId);
  if (!hu) throw new Error(`HU ${huId} no encontrada en la feature ${featureId}`);

  const phases = [];
  for (const faseName of HU_PHASES) {
    const collected = collectPhase(projectDir, faseName, featureId, huId, (hu.phases || {})[faseName], opts);
    if (collected) phases.push(collected);
  }

  const tasks = [];
  for (const task of loadTasks(projectDir, hu.docsPath, opts.taskCache)) {
    const collected = collectTask(projectDir, featureId, huId, task, opts);
    if (collected) tasks.push(collected);
  }

  return { phases, tasks };
}

function collectFeature(projectDir, state, featureId, opts = {}) {
  const feature = (state.features || []).find((f) => f.id === featureId);
  if (!feature) throw new Error(`Feature ${featureId} no encontrada en .harness-state.json`);

  const phases = [];
  for (const faseName of FEATURE_PHASES) {
    const collected = collectPhase(projectDir, faseName, featureId, null, (feature.phases || {})[faseName], opts);
    if (collected) phases.push(collected);
  }

  let tasks = [];
  for (const hu of feature.userStories || []) {
    const huResult = collectHu(projectDir, state, featureId, hu.id, opts);
    phases.push(...huResult.phases);
    tasks = tasks.concat(huResult.tasks);
  }

  return { phases, tasks };
}

function buildPhaseTypeBreakdown(allPhases) {
  const byType = {};
  for (const p of allPhases) {
    if (!byType[p.fase]) byType[p.fase] = { count: 0, durationSeconds: 0, tokens: 0 };
    byType[p.fase].count += 1;
    byType[p.fase].durationSeconds += p.durationSeconds;
    byType[p.fase].tokens += (p.tokens && p.tokens.total) || 0;
  }
  return byType;
}

function buildCoverage(entries) {
  if (entries.length === 0) return 100;
  const withData = entries.filter((e) => e.tokens !== null).length;
  return Math.round((withData / entries.length) * 100);
}

// scope: { hu: "F001:US-001" } | { feature: "F001" } | {} (global, todas las features)
// force: recalcula aunque ya haya un `tracking` persistido (ver reuseCachedTracking).
// taskCache: Map opcional (docsPath -> tasks[]) para compartir las lecturas de
// tasks.json con quien llama (ej. dashboard-data.js) en vez de leerlas de nuevo.
function collect({ projectDir, hu, feature, force, taskCache }) {
  const state = loadState(projectDir);
  const opts = { force: !!force, taskCache: taskCache || new Map() };
  let phases = [];
  let tasks = [];

  if (hu) {
    const [featureId, huId] = hu.split(':');
    if (!featureId || !huId) throw new Error('--hu debe tener el formato {featureId}:{huId}, ej. F001:US-001');
    const result = collectHu(projectDir, state, featureId, huId, opts);
    phases = result.phases;
    tasks = result.tasks;
  } else if (feature) {
    const result = collectFeature(projectDir, state, feature, opts);
    phases = result.phases;
    tasks = result.tasks;
  } else {
    for (const f of state.features || []) {
      const result = collectFeature(projectDir, state, f.id, opts);
      phases = phases.concat(result.phases);
      tasks = tasks.concat(result.tasks);
    }
  }

  const warnings = [];
  for (const p of phases) {
    for (const w of p.warnings) warnings.push(`[${p.fase} ${p.featureId}${p.huId ? ' ' + p.huId : ''}] ${w}`);
  }
  for (const t of tasks) {
    for (const w of t.warnings) warnings.push(`[${t.taskId} ${t.featureId} ${t.huId}] ${w}`);
  }

  return {
    phases,
    tasks,
    phaseTypeBreakdown: buildPhaseTypeBreakdown(phases),
    coverage: buildCoverage(phases.concat(tasks)),
    warnings,
  };
}

module.exports = {
  collect,
  collectHu,
  collectFeature,
  collectPhase,
  collectTask,
  collectForWindow,
  loadState,
  loadTasks,
  buildPhaseTypeBreakdown,
  buildCoverage,
  HU_PHASES,
  FEATURE_PHASES,
};
