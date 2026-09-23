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

// El bloque `tracking` (tokens, sessionsMatched[], warnings) es para reportes, nunca
// para decisiones de orquestacion — se omite en los resumenes para no inflar el
// contexto del leader con datos que no necesita para decidir el siguiente paso.
function stripTrackingFromPhases(phases) {
  const out = {};
  for (const [name, phase] of Object.entries(phases || {})) {
    const { tracking, ...rest } = phase;
    out[name] = rest;
  }
  return out;
}

// Las features `done` quedan como stub (sin fases/HUs/tracking): una vez cerradas, el
// leader solo necesita saber que existen y su nombre, no su historial completo de
// fases — ese detalle sigue disponible via `feature show {id}` si hace falta.
function summarizeFeature(feature) {
  if (feature.status === 'done') {
    return {
      id: feature.id,
      name: feature.name ?? null,
      slug: feature.slug ?? null,
      status: feature.status,
      completedAt: feature.completedAt ?? null,
    };
  }
  return {
    ...feature,
    phases: stripTrackingFromPhases(feature.phases),
    userStories: (feature.userStories || []).map((hu) => ({
      ...hu,
      phases: stripTrackingFromPhases(hu.phases),
    })),
  };
}

// Resumen por defecto de `resume`/`status`: conteos por status (para saber cuanto hay
// sin cargarlo todo) + detalle completo SOLO de las features activas, sin tracking. El
// volcado historico completo (incluidas las `done` con su detalle y tracking) sigue
// disponible via `--full` para los pocos casos que de verdad lo necesiten.
function summarizeState(state) {
  const features = state.features || [];
  const featureCounts = features.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {});

  return {
    project: state.project,
    updatedAt: state.updatedAt,
    humanInTheLoop: state.humanInTheLoop,
    harnessEngineeringVersion: state.harnessEngineeringVersion,
    inception: state.inception,
    featureCounts,
    features: features.map(summarizeFeature),
  };
}

function filterFeatures(state, { status } = {}) {
  const features = state.features || [];
  if (!status) return features;
  return features.filter((f) => f.status === status);
}

module.exports = {
  statePath,
  initialState,
  loadState,
  saveState,
  mutate,
  findFeature,
  findHu,
  stripTrackingFromPhases,
  summarizeFeature,
  summarizeState,
  filterFeatures,
  INCEPTION_PHASES,
  HU_PHASES,
  FEATURE_PHASES,
};
