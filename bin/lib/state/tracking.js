'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { mutate, loadState, findFeature, findHu } = require('./store');

// Extrae solo el bloque de tracking (ver schema en templates/state/harness-state.json)
// de una entrada `phases[]`/`tasks[]` devuelta por `track collect`.
function pickTrackingBlock(entry) {
  return {
    tokens: entry.tokens,
    tokensSource: entry.tokensSource,
    sessionsMatched: entry.sessionsMatched,
    costUsd: entry.costUsd,
    collectedAt: entry.collectedAt,
    warnings: entry.warnings,
  };
}

// Persiste el JSON crudo que devuelve `track collect` (via el subagente `tracking`):
// un bloque `tracking` por fase dentro de `.harness-state.json`, y un bloque `tracking`
// por tarea dentro del `tasks.json` de la HU correspondiente. Nunca recalcula numeros —
// solo copia lo que `track collect` ya devolvio (agents/features.md:285).
function record(projectDir, data, { version } = {}) {
  mutate(projectDir, (state) => {
    for (const p of data.phases || []) {
      const feature = findFeature(state, p.featureId);
      const target = p.huId ? findHu(feature, p.huId).phases[p.fase] : feature.phases[p.fase];
      if (!target) {
        throw new Error(`Fase no encontrada para persistir tracking: ${p.fase} ${p.featureId} ${p.huId || ''}`);
      }
      target.tracking = pickTrackingBlock(p);
    }
    if (version && !state.harnessEngineeringVersion) {
      state.harnessEngineeringVersion = version;
    }
  });

  const byHu = new Map();
  for (const t of data.tasks || []) {
    const key = `${t.featureId}:${t.huId}`;
    if (!byHu.has(key)) byHu.set(key, []);
    byHu.get(key).push(t);
  }

  if (byHu.size > 0) {
    const state = loadState(projectDir);
    for (const [key, entries] of byHu) {
      const [featureId, huId] = key.split(':');
      const hu = findHu(findFeature(state, featureId), huId);
      if (!hu.docsPath) continue;
      const tasksPath = path.join(projectDir, hu.docsPath, 'tasks.json');
      if (!fs.existsSync(tasksPath)) continue;
      const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
      for (const entry of entries) {
        const task = tasksData.tasks.find((t) => t.id === entry.taskId);
        if (task) task.tracking = pickTrackingBlock(entry);
      }
      fs.writeFileSync(tasksPath, JSON.stringify(tasksData, null, 2) + '\n', 'utf8');
    }
  }

  return { ok: true, phasesRecorded: (data.phases || []).length, tasksRecorded: (data.tasks || []).length };
}

module.exports = { record };
