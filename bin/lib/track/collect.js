'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { collectClaudeTokens } = require('./sources/claude-transcript');
const { collectOpencodeTokens } = require('./sources/opencode-source');
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

// Intenta Claude Code primero (mecanismo mas preciso, confirmado empiricamente), y
// cae a opencode si Claude no esta disponible o no devolvio datos. Nunca inventa un
// numero si ninguna fuente real esta disponible.
function collectForWindow(projectDir, expectedTokens, window) {
  if (isOnPath('claude')) {
    const result = collectClaudeTokens(projectDir, expectedTokens, window);
    if (result.tokens) return result;
  }
  if (isOnPath('opencode')) {
    const result = collectOpencodeTokens(projectDir, {});
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

module.exports = { collect, collectHu, collectFeature, HU_PHASES, FEATURE_PHASES };
