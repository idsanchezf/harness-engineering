'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const feature = require('../../bin/lib/state/feature');
const hu = require('../../bin/lib/state/hu');
const { makeTmpDir, cleanup } = require('../helpers/tmp-dir');

test('ciclo feliz de feature: register -> phase-start -> phase-complete -> mark-in-review -> mark-done', () => {
  const dir = makeTmpDir();
  try {
    feature.register(dir, { id: 'F001', name: 'Registro OAuth2', slug: 'registro-oauth2', description: 'desc' });

    feature.phaseStart(dir, 'F001', 'analysis');
    feature.phaseComplete(dir, 'F001', 'analysis');
    feature.phaseStart(dir, 'F001', 'design');
    const afterDesign = feature.phaseComplete(dir, 'F001', 'design');

    const f = afterDesign.features.find((x) => x.id === 'F001');
    assert.equal(f.phases.analysis.status, 'completed');
    assert.equal(f.phases.design.status, 'completed');

    feature.markInReview(dir, 'F001', 'https://github.com/x/y/pull/1');
    const done = feature.markDone(dir, 'F001');
    const f2 = done.features.find((x) => x.id === 'F001');
    assert.equal(f2.status, 'done');
    assert.ok(f2.completedAt);
  } finally {
    cleanup(dir);
  }
});

test('register rechaza una feature duplicada', () => {
  const dir = makeTmpDir();
  try {
    feature.register(dir, { id: 'F001', slug: 'a' });
    assert.throws(() => feature.register(dir, { id: 'F001', slug: 'b' }), /ya existe/);
  } finally {
    cleanup(dir);
  }
});

test('ciclo feliz de HU: create -> phase-start -> phase-complete (5 fases) -> mark-in-review -> mark-done', () => {
  const dir = makeTmpDir();
  try {
    feature.register(dir, { id: 'F001', slug: 'registro-oauth2' });
    hu.create(dir, 'F001', 'US-001', 'Registro con Google OAuth2');

    for (const fase of ['develop', 'test', 'quality', 'deploy', 'tracking']) {
      hu.phaseStart(dir, 'F001', 'US-001', fase);
      hu.phaseComplete(dir, 'F001', 'US-001', fase);
    }

    hu.markInReview(dir, 'F001', 'US-001', 'https://github.com/x/y/pull/2');
    const done = hu.markDone(dir, 'F001', 'US-001');
    const h = done.features.find((f) => f.id === 'F001').userStories.find((u) => u.id === 'US-001');
    assert.equal(h.status, 'done');
    assert.equal(h.phases.tracking.status, 'completed');
  } finally {
    cleanup(dir);
  }
});

test('hu phase-start de develop marca la HU como in_progress', () => {
  const dir = makeTmpDir();
  try {
    feature.register(dir, { id: 'F001', slug: 'a' });
    hu.create(dir, 'F001', 'US-001', 'titulo');
    const after = hu.phaseStart(dir, 'F001', 'US-001', 'develop');
    const h = after.features[0].userStories[0];
    assert.equal(h.status, 'in_progress');
  } finally {
    cleanup(dir);
  }
});

test('hu block registra el motivo', () => {
  const dir = makeTmpDir();
  try {
    feature.register(dir, { id: 'F001', slug: 'a' });
    hu.create(dir, 'F001', 'US-001', 'titulo');
    const after = hu.block(dir, 'F001', 'US-001', 'depende de otro servicio');
    const h = after.features[0].userStories[0];
    assert.equal(h.status, 'blocked');
    assert.equal(h.blockedReason, 'depende de otro servicio');
  } finally {
    cleanup(dir);
  }
});
