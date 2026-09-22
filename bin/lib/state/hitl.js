'use strict';

const { mutate, loadState, findFeature, findHu } = require('./store');

function nowIso() {
  return new Date().toISOString();
}

function enable(projectDir) {
  return mutate(projectDir, (state) => {
    state.humanInTheLoop = true;
  });
}

function disable(projectDir) {
  return mutate(projectDir, (state) => {
    state.humanInTheLoop = false;
    // Auto-aprueba fases completadas pendientes de aprobacion (no afecta inception,
    // que siempre requiere aprobacion explicita — ver agents/features.md:264).
    for (const feature of state.features || []) {
      for (const phase of Object.values(feature.phases || {})) {
        if (phase.status === 'completed' && phase.approved === false) phase.approved = true;
      }
      for (const hu of feature.userStories || []) {
        for (const phase of Object.values(hu.phases || {})) {
          if (phase.status === 'completed' && phase.approved === false) phase.approved = true;
        }
      }
    }
  });
}

function status(projectDir) {
  const state = loadState(projectDir);
  const pending = [];
  for (const feature of state.features || []) {
    for (const [fase, data] of Object.entries(feature.phases || {})) {
      if (data.status === 'completed' && data.approved === false) {
        pending.push({ featureId: feature.id, fase });
      }
    }
    for (const hu of feature.userStories || []) {
      for (const [fase, data] of Object.entries(hu.phases || {})) {
        if (data.status === 'completed' && data.approved === false) {
          pending.push({ featureId: feature.id, huId: hu.id, fase });
        }
      }
    }
  }
  return { humanInTheLoop: state.humanInTheLoop, pending };
}

function resolvePhase(state, featureId, huId, fase) {
  const feature = findFeature(state, featureId);
  const phase = huId ? findHu(feature, huId).phases[fase] : feature.phases[fase];
  if (!phase) throw new Error(`Fase no encontrada: ${fase} (${featureId}${huId ? ' ' + huId : ''})`);
  return phase;
}

function approve(projectDir, featureId, huId, fase) {
  return mutate(projectDir, (state) => {
    resolvePhase(state, featureId, huId, fase).approved = true;
  });
}

function reject(projectDir, featureId, huId, fase, motivo) {
  return mutate(projectDir, (state) => {
    const phase = resolvePhase(state, featureId, huId, fase);
    phase.status = 'in_progress';
    phase.approved = false;
    phase.lastRejection = { motivo: motivo || null, at: nowIso() };
  });
}

function approveInception(projectDir) {
  return mutate(projectDir, (state) => {
    state.inception.approved = true;
  });
}

function rejectInception(projectDir, fase, motivo) {
  return mutate(projectDir, (state) => {
    const phase = state.inception.phases[fase];
    if (!phase) throw new Error(`Fase de inception invalida: ${fase}`);
    phase.status = 'in_progress';
    phase.lastRejection = { motivo: motivo || null, at: nowIso() };
  });
}

module.exports = { enable, disable, status, approve, reject, approveInception, rejectInception };
