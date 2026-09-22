'use strict';

const { mutate, findFeature, FEATURE_PHASES } = require('./store');

function nowIso() {
  return new Date().toISOString();
}

function assertValidPhase(fase) {
  if (!FEATURE_PHASES.includes(fase)) {
    throw new Error(`Fase de feature invalida: "${fase}". Validas: ${FEATURE_PHASES.join(', ')}`);
  }
}

// Registra la feature en el estado (backlog + phases en pending). No crea la rama git
// — eso sigue siendo responsabilidad de `features` (ver agents/features.md), que llama
// a este comando como paso final de su flujo `feature start`.
function register(projectDir, { id, name, slug, description, branch }) {
  if (!id) throw new Error('feature register requiere --id');
  return mutate(projectDir, (state) => {
    if (!state.features) state.features = [];
    if (state.features.some((f) => f.id === id)) {
      throw new Error(`La feature ${id} ya existe`);
    }
    state.features.push({
      id,
      name: name || null,
      slug: slug || null,
      description: description || null,
      status: 'in_progress',
      assignedTo: null,
      docsPath: slug ? `docs/features/${id}-${slug}/` : null,
      branch: branch || null,
      prUrl: null,
      createdAt: nowIso(),
      startedAt: nowIso(),
      completedAt: null,
      phases: Object.fromEntries(FEATURE_PHASES.map((p) => [p, { status: 'pending', approved: false }])),
      userStories: [],
    });
  });
}

function phaseStart(projectDir, featureId, fase) {
  assertValidPhase(fase);
  return mutate(projectDir, (state) => {
    const feature = findFeature(state, featureId);
    feature.phases[fase].status = 'in_progress';
    feature.phases[fase].startedAt = nowIso();
  });
}

function phaseComplete(projectDir, featureId, fase) {
  assertValidPhase(fase);
  return mutate(projectDir, (state) => {
    const feature = findFeature(state, featureId);
    feature.phases[fase].status = 'completed';
    feature.phases[fase].completedAt = nowIso();
  });
}

function block(projectDir, featureId, motivo) {
  return mutate(projectDir, (state) => {
    const feature = findFeature(state, featureId);
    feature.status = 'blocked';
    feature.blockedReason = motivo || null;
  });
}

function markInReview(projectDir, featureId, prUrl) {
  return mutate(projectDir, (state) => {
    const feature = findFeature(state, featureId);
    feature.status = 'in_review';
    feature.prUrl = prUrl || null;
  });
}

function markDone(projectDir, featureId) {
  return mutate(projectDir, (state) => {
    const feature = findFeature(state, featureId);
    feature.status = 'done';
    feature.completedAt = nowIso();
  });
}

module.exports = { register, phaseStart, phaseComplete, block, markInReview, markDone };
