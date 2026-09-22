'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const feature = require('../../bin/lib/state/feature');
const hu = require('../../bin/lib/state/hu');
const hitl = require('../../bin/lib/state/hitl');
const { makeTmpDir, cleanup } = require('../helpers/tmp-dir');

function setupHuAtCompletedPhase(dir) {
  feature.register(dir, { id: 'F001', slug: 'a' });
  hu.create(dir, 'F001', 'US-001', 'titulo');
  hu.phaseStart(dir, 'F001', 'US-001', 'develop');
  hu.phaseComplete(dir, 'F001', 'US-001', 'develop');
}

test('enable/disable/status', () => {
  const dir = makeTmpDir();
  try {
    assert.equal(hitl.enable(dir).humanInTheLoop, true);
    assert.equal(hitl.disable(dir).humanInTheLoop, false);
    assert.equal(hitl.status(dir).humanInTheLoop, false);
  } finally {
    cleanup(dir);
  }
});

test('status reporta fases completadas pendientes de aprobacion', () => {
  const dir = makeTmpDir();
  try {
    setupHuAtCompletedPhase(dir);
    const status = hitl.status(dir);
    assert.deepEqual(status.pending, [{ featureId: 'F001', huId: 'US-001', fase: 'develop' }]);
  } finally {
    cleanup(dir);
  }
});

test('approve marca approved=true y sale de la lista de pendientes', () => {
  const dir = makeTmpDir();
  try {
    setupHuAtCompletedPhase(dir);
    hitl.approve(dir, 'F001', 'US-001', 'develop');
    assert.deepEqual(hitl.status(dir).pending, []);
  } finally {
    cleanup(dir);
  }
});

test('reject vuelve la fase a in_progress y registra lastRejection', () => {
  const dir = makeTmpDir();
  try {
    setupHuAtCompletedPhase(dir);
    const after = hitl.reject(dir, 'F001', 'US-001', 'develop', 'falta manejo de error 409');
    const phase = after.features[0].userStories[0].phases.develop;
    assert.equal(phase.status, 'in_progress');
    assert.equal(phase.approved, false);
    assert.equal(phase.lastRejection.motivo, 'falta manejo de error 409');
  } finally {
    cleanup(dir);
  }
});

test('disable auto-aprueba fases completadas pendientes', () => {
  const dir = makeTmpDir();
  try {
    setupHuAtCompletedPhase(dir);
    hitl.disable(dir);
    assert.deepEqual(hitl.status(dir).pending, []);
  } finally {
    cleanup(dir);
  }
});

test('approveInception / rejectInception operan sobre inception, no sobre una feature', () => {
  const dir = makeTmpDir();
  try {
    const afterApprove = hitl.approveInception(dir);
    assert.equal(afterApprove.inception.approved, true);

    const afterReject = hitl.rejectInception(dir, 'discovery', 'falta backlog priorizado');
    assert.equal(afterReject.inception.phases.discovery.lastRejection.motivo, 'falta backlog priorizado');
  } finally {
    cleanup(dir);
  }
});
