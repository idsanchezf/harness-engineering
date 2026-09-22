'use strict';

const { mutate, loadState, INCEPTION_PHASES } = require('./store');

function nowIso() {
  return new Date().toISOString();
}

function assertValidPhase(fase) {
  if (!INCEPTION_PHASES.includes(fase)) {
    throw new Error(`Fase de inception invalida: "${fase}". Validas: ${INCEPTION_PHASES.join(', ')}`);
  }
}

function start(projectDir) {
  return mutate(projectDir, (state) => {
    state.inception.status = 'in_progress';
    state.inception.startedAt = nowIso();
  });
}

function complete(projectDir) {
  return mutate(projectDir, (state) => {
    state.inception.status = 'completed';
    for (const phase of INCEPTION_PHASES) {
      state.inception.phases[phase].status = 'completed';
    }
    state.inception.completedAt = nowIso();
  });
}

function status(projectDir) {
  return loadState(projectDir).inception;
}

function phaseStart(projectDir, fase) {
  assertValidPhase(fase);
  return mutate(projectDir, (state) => {
    state.inception.phases[fase].status = 'in_progress';
    state.inception.phases[fase].startedAt = nowIso();
  });
}

function phaseComplete(projectDir, fase) {
  assertValidPhase(fase);
  return mutate(projectDir, (state) => {
    state.inception.phases[fase].status = 'completed';
    state.inception.phases[fase].completedAt = nowIso();
  });
}

function phaseStatus(projectDir, fase) {
  assertValidPhase(fase);
  return loadState(projectDir).inception.phases[fase];
}

module.exports = { start, complete, status, phaseStart, phaseComplete, phaseStatus };
