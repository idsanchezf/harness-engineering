'use strict';

const path = require('node:path');

const { collect, loadState, loadTasks, buildPhaseTypeBreakdown, buildCoverage } = require('./collect');

function sumTokens(entries) {
  return entries.reduce((acc, e) => acc + ((e.tokens && e.tokens.total) || 0), 0);
}

function sumTime(entries) {
  return entries.reduce((acc, e) => acc + (e.durationSeconds || 0), 0);
}

function indexTasksByHu(projectDir, feature, taskCache) {
  const byHu = {};
  for (const hu of feature.userStories || []) {
    const byId = {};
    for (const task of loadTasks(projectDir, hu.docsPath, taskCache)) {
      byId[task.id] = task;
    }
    byHu[hu.id] = byId;
  }
  return byHu;
}

// Arma la estructura completa que consume el dashboard HTML: reusa `collect()` (scope
// global, misma fuente de verdad que el reporte markdown) y la enriquece con nombres
// legibles (nombre de feature, titulo de HU, descripcion de tarea) que `collect()` no
// incluye porque su contrato es para que los AGENTES lo interpreten, no para render.
// `taskCache` se comparte con `collect()` para que cada tasks.json se lea una sola vez
// por corrida, en vez de una vez dentro de collect() y otra en indexTasksByHu.
function buildDashboardData(projectDir) {
  const state = loadState(projectDir);
  const taskCache = new Map();
  const result = collect({ projectDir, taskCache });

  const byFeatureId = {};
  for (const p of result.phases) {
    if (!byFeatureId[p.featureId]) byFeatureId[p.featureId] = { phases: [], tasks: [] };
    byFeatureId[p.featureId].phases.push(p);
  }
  for (const t of result.tasks) {
    if (!byFeatureId[t.featureId]) byFeatureId[t.featureId] = { phases: [], tasks: [] };
    byFeatureId[t.featureId].tasks.push(t);
  }

  const features = (state.features || []).map((feature) => {
    const entry = byFeatureId[feature.id] || { phases: [], tasks: [] };
    const tasksByHu = indexTasksByHu(projectDir, feature, taskCache);
    const huTitleById = {};
    for (const hu of feature.userStories || []) huTitleById[hu.id] = hu.title || hu.id;

    for (const t of entry.tasks) {
      const meta = (tasksByHu[t.huId] || {})[t.taskId];
      t.description = meta ? meta.description : t.taskId;
      t.layer = meta ? meta.layer : null;
    }

    const huIds = [...new Set(entry.phases.filter((p) => p.huId).map((p) => p.huId))];
    const hus = huIds.map((huId) => {
      const huPhases = entry.phases.filter((p) => p.huId === huId);
      const huTasks = entry.tasks.filter((t) => t.huId === huId);
      return {
        id: huId,
        title: huTitleById[huId] || huId,
        timeSeconds: sumTime(huPhases),
        tokens: sumTokens(huPhases),
        coverage: buildCoverage(huPhases.concat(huTasks)),
        phases: huPhases,
        tasks: huTasks,
      };
    });

    const featurePhases = entry.phases.filter((p) => !p.huId);

    return {
      id: feature.id,
      name: feature.name || feature.id,
      status: feature.status || 'unknown',
      timeSeconds: sumTime(entry.phases),
      tokens: sumTokens(entry.phases),
      huCount: hus.length,
      coverage: buildCoverage(entry.phases.concat(entry.tasks)),
      featurePhases,
      hus,
      phaseTypeBreakdown: buildPhaseTypeBreakdown(entry.phases),
    };
  });

  return {
    project: state.project || path.basename(projectDir),
    generatedAt: new Date().toISOString(),
    features,
    globalPhaseTypeBreakdown: buildPhaseTypeBreakdown(result.phases),
    totals: {
      timeSeconds: sumTime(result.phases),
      tokens: sumTokens(result.phases),
      huCount: features.reduce((acc, f) => acc + f.huCount, 0),
      featureCount: features.length,
      coverage: result.coverage,
    },
    warnings: result.warnings,
  };
}

module.exports = { buildDashboardData };
