'use strict';

const fs = require('node:fs');
const path = require('node:path');

const STATE_FILE = '.harness-state.json';

const INCEPTION_PHASES = ['context', 'discovery', 'ddd', 'architecture', 'scaffold', 'environments'];
const HU_PHASES = ['develop', 'test', 'quality', 'deploy', 'tracking'];
const FEATURE_PHASES = ['analysis', 'design'];

function statePath(projectDir) {
  return path.join(projectDir, STATE_FILE);
}

function initialState() {
  return {
    project: '',
    createdAt: null,
    updatedAt: null,
    humanInTheLoop: false,
    harnessEngineeringVersion: null,
    inception: {
      status: 'pending',
      approved: false,
      phases: Object.fromEntries(
        INCEPTION_PHASES.map((p) => [p, { status: 'pending', startedAt: null, completedAt: null }])
      ),
    },
    features: [],
  };
}

function loadState(projectDir) {
  const p = statePath(projectDir);
  if (!fs.existsSync(p)) return initialState();
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveState(projectDir, state) {
  state.updatedAt = new Date().toISOString();
  if (!state.createdAt) state.createdAt = state.updatedAt;
  fs.writeFileSync(statePath(projectDir), JSON.stringify(state, null, 2) + '\n', 'utf8');
  return state;
}

// Recarga desde disco, aplica la mutacion sobre la version mas reciente, y guarda —
// evita pisar cambios de una escritura anterior (ver "Reglas de integridad" en
// agents/features.md, portadas aca en vez de depender de que un LLM las respete).
function mutate(projectDir, fn) {
  const state = loadState(projectDir);
  fn(state);
  return saveState(projectDir, state);
}

function findFeature(state, featureId) {
  const feature = (state.features || []).find((f) => f.id === featureId);
  if (!feature) throw new Error(`Feature no encontrada: ${featureId}`);
  return feature;
}

function findHu(feature, huId) {
  const hu = (feature.userStories || []).find((h) => h.id === huId);
  if (!hu) throw new Error(`HU no encontrada: ${huId} en ${feature.id}`);
  return hu;
}

module.exports = {
  statePath,
  initialState,
  loadState,
  saveState,
  mutate,
  findFeature,
  findHu,
  INCEPTION_PHASES,
  HU_PHASES,
  FEATURE_PHASES,
};
