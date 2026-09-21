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

function loadTasks(projectDir, docsPath) {
  if (!docsPath) return [];
  const tasksPath = path.join(projectDir, docsPath, 'tasks.json');
  if (!fs.existsSync(tasksPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(tasksPath, 'utf8')).tasks || [];
  } catch {
    return [];
  }
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

function collectPhase(projectDir, faseName, featureId, huId, phaseObj) {
  if (!phaseObj || !phaseObj.startedAt || !phaseObj.completedAt) return null;
  const expectedTokens = huId ? [faseName, featureId, huId] : [faseName, featureId];
  const window = { startedAt: phaseObj.startedAt, completedAt: phaseObj.completedAt };
  const result = collectForWindow(projectDir, expectedTokens, window);

  return {
    fase: faseName,
    featureId,
    huId: huId || null,
    durationSeconds: durationSeconds(phaseObj.startedAt, phaseObj.completedAt),
    tokens: result.tokens,
    tokensSource: result.source,
    sessionsMatched: result.sessionsMatched,
    costUsd: result.costUsd || null,
    collectedAt: new Date().toISOString(),
    warnings: result.warnings,
  };
}

function collectTask(projectDir, featureId, huId, task) {
  if (!task.startedAt || !task.completedAt) return null;
  const expectedTokens = [task.id, featureId, huId];
  const window = { startedAt: task.startedAt, completedAt: task.completedAt };
  const result = collectForWindow(projectDir, expectedTokens, window);

  return {
    taskId: task.id,
    featureId,
    huId,
    durationSeconds: durationSeconds(task.startedAt, task.completedAt),
    tokens: result.tokens,
    tokensSource: result.source,
    sessionsMatched: result.sessionsMatched,
    costUsd: result.costUsd || null,
    collectedAt: new Date().toISOString(),
    warnings: result.warnings,
  };
}

function collectHu(projectDir, state, featureId, huId) {
  const feature = (state.features || []).find((f) => f.id === featureId);
  if (!feature) throw new Error(`Feature ${featureId} no encontrada en .harness-state.json`);
  const hu = (feature.userStories || []).find((u) => u.id === huId);
  if (!hu) throw new Error(`HU ${huId} no encontrada en la feature ${featureId}`);

  const phases = [];
  for (const faseName of HU_PHASES) {
    const collected = collectPhase(projectDir, faseName, featureId, huId, (hu.phases || {})[faseName]);
    if (collected) phases.push(collected);
  }

  const tasks = [];
  for (const task of loadTasks(projectDir, hu.docsPath)) {
    const collected = collectTask(projectDir, featureId, huId, task);
    if (collected) tasks.push(collected);
  }

  return { phases, tasks };
}

function collectFeature(projectDir, state, featureId) {
  const feature = (state.features || []).find((f) => f.id === featureId);
  if (!feature) throw new Error(`Feature ${featureId} no encontrada en .harness-state.json`);

  const phases = [];
  for (const faseName of FEATURE_PHASES) {
    const collected = collectPhase(projectDir, faseName, featureId, null, (feature.phases || {})[faseName]);
    if (collected) phases.push(collected);
  }

  let tasks = [];
  for (const hu of feature.userStories || []) {
    const huResult = collectHu(projectDir, state, featureId, hu.id);
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
function collect({ projectDir, hu, feature }) {
  const state = loadState(projectDir);
  let phases = [];
  let tasks = [];

  if (hu) {
    const [featureId, huId] = hu.split(':');
    if (!featureId || !huId) throw new Error('--hu debe tener el formato {featureId}:{huId}, ej. F001:US-001');
    const result = collectHu(projectDir, state, featureId, huId);
    phases = result.phases;
    tasks = result.tasks;
  } else if (feature) {
    const result = collectFeature(projectDir, state, feature);
    phases = result.phases;
    tasks = result.tasks;
  } else {
    for (const f of state.features || []) {
      const result = collectFeature(projectDir, state, f.id);
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
  collectForWindow,
  loadState,
  loadTasks,
  buildPhaseTypeBreakdown,
  buildCoverage,
  HU_PHASES,
  FEATURE_PHASES,
};
