'use strict';

const { mutate, findFeature, findHu, HU_PHASES } = require('./store');

function nowIso() {
  return new Date().toISOString();
}

function assertValidPhase(fase) {
  if (!HU_PHASES.includes(fase)) {
    throw new Error(`Fase de HU invalida: "${fase}". Validas: ${HU_PHASES.join(', ')}`);
  }
}

function create(projectDir, featureId, huId, title) {
  if (!featureId || !huId) throw new Error('hu create requiere featureId y huId');
  return mutate(projectDir, (state) => {
    const feature = findFeature(state, featureId);
    if (feature.userStories.some((h) => h.id === huId)) {
      throw new Error(`La HU ${huId} ya existe en ${featureId}`);
    }
    feature.userStories.push({
      id: huId,
      title: title || null,
      status: 'pending',
      branch: null,
      prUrl: null,
      docsPath: feature.docsPath ? `${feature.docsPath}${huId}/` : null,
      phases: Object.fromEntries(HU_PHASES.map((p) => [p, { status: 'pending', approved: false }])),
    });
  });
}

function phaseStart(projectDir, featureId, huId, fase) {
  assertValidPhase(fase);
  return mutate(projectDir, (state) => {
    const hu = findHu(findFeature(state, featureId), huId);
    hu.phases[fase].status = 'in_progress';
    hu.phases[fase].startedAt = nowIso();
    if (fase === 'develop' && hu.status === 'pending') hu.status = 'in_progress';
  });
}

function phaseComplete(projectDir, featureId, huId, fase) {
  assertValidPhase(fase);
  return mutate(projectDir, (state) => {
    const hu = findHu(findFeature(state, featureId), huId);
    hu.phases[fase].status = 'completed';
    hu.phases[fase].completedAt = nowIso();
  });
}

function block(projectDir, featureId, huId, motivo) {
  return mutate(projectDir, (state) => {
    const hu = findHu(findFeature(state, featureId), huId);
    hu.status = 'blocked';
    hu.blockedReason = motivo || null;
  });
}

// Llamado por `features` tras crear la rama `hu/*` (git checkout -b) — persiste el
// nombre de rama sin que `features` tenga que editar el JSON a mano.
function markStarted(projectDir, featureId, huId, branch) {
  return mutate(projectDir, (state) => {
    const hu = findHu(findFeature(state, featureId), huId);
    hu.status = 'in_progress';
    if (branch) hu.branch = branch;
  });
}

function markInReview(projectDir, featureId, huId, prUrl) {
  return mutate(projectDir, (state) => {
    const hu = findHu(findFeature(state, featureId), huId);
    hu.status = 'in_review';
    hu.prUrl = prUrl || null;
  });
}

function markDone(projectDir, featureId, huId) {
  return mutate(projectDir, (state) => {
    const hu = findHu(findFeature(state, featureId), huId);
    hu.status = 'done';
  });
}

module.exports = { create, phaseStart, phaseComplete, block, markStarted, markInReview, markDone };
