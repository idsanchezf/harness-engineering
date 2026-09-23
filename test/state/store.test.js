'use strict';

const fs = require('node:fs');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const store = require('../../bin/lib/state/store');
const { makeTmpDir, cleanup } = require('../helpers/tmp-dir');

test('loadState devuelve la plantilla inicial si el archivo no existe', () => {
  const dir = makeTmpDir();
  try {
    const state = store.loadState(dir);
    assert.equal(state.inception.status, 'pending');
    assert.deepEqual(state.features, []);
    assert.equal(fs.existsSync(store.statePath(dir)), false, 'loadState no debe crear el archivo por si sola');
  } finally {
    cleanup(dir);
  }
});

test('saveState escribe el archivo y actualiza updatedAt/createdAt', () => {
  const dir = makeTmpDir();
  try {
    const state = store.saveState(dir, store.initialState());
    assert.ok(state.updatedAt);
    assert.equal(state.createdAt, state.updatedAt);
    assert.ok(fs.existsSync(store.statePath(dir)));

    const reloaded = store.loadState(dir);
    assert.equal(reloaded.updatedAt, state.updatedAt);
  } finally {
    cleanup(dir);
  }
});

test('mutate recarga desde disco antes de aplicar el cambio (no pisa escrituras previas)', () => {
  const dir = makeTmpDir();
  try {
    store.mutate(dir, (state) => {
      state.project = 'A';
    });
    store.mutate(dir, (state) => {
      assert.equal(state.project, 'A', 'la segunda mutacion debe ver el resultado de la primera');
      state.humanInTheLoop = true;
    });

    const final = store.loadState(dir);
    assert.equal(final.project, 'A');
    assert.equal(final.humanInTheLoop, true);
  } finally {
    cleanup(dir);
  }
});

test('findFeature / findHu lanzan si no existen', () => {
  const state = store.initialState();
  assert.throws(() => store.findFeature(state, 'F999'));
  state.features.push({ id: 'F001', userStories: [] });
  assert.throws(() => store.findHu(state.features[0], 'US-999'));
});

test('stripTrackingFromPhases quita el bloque tracking sin tocar el resto de la fase', () => {
  const out = store.stripTrackingFromPhases({
    develop: { status: 'completed', startedAt: 'a', completedAt: 'b', tracking: { tokens: { total: 100 } } },
  });
  assert.deepEqual(out, { develop: { status: 'completed', startedAt: 'a', completedAt: 'b' } });
});

test('summarizeFeature colapsa una feature done a un stub, y limpia tracking de una activa', () => {
  const done = store.summarizeFeature({
    id: 'F001',
    name: 'Uno',
    slug: 'uno',
    status: 'done',
    completedAt: '2026-01-01',
    phases: { analysis: { status: 'completed', tracking: { tokens: { total: 1 } } } },
    userStories: [{ id: 'US-001', phases: {} }],
  });
  assert.deepEqual(done, { id: 'F001', name: 'Uno', slug: 'uno', status: 'done', completedAt: '2026-01-01' });

  const active = store.summarizeFeature({
    id: 'F002',
    status: 'in_progress',
    phases: { analysis: { status: 'completed', tracking: { tokens: { total: 1 } } } },
    userStories: [{ id: 'US-001', phases: { develop: { status: 'in_progress', tracking: { tokens: { total: 2 } } } } }],
  });
  assert.equal(active.phases.analysis.tracking, undefined);
  assert.equal(active.userStories[0].phases.develop.tracking, undefined);
});

test('summarizeState cuenta features por status y resume cada una', () => {
  const state = store.initialState();
  state.features.push(
    { id: 'F001', status: 'done', phases: {}, userStories: [] },
    { id: 'F002', status: 'in_progress', phases: {}, userStories: [] },
    { id: 'F003', status: 'in_progress', phases: {}, userStories: [] }
  );
  const summary = store.summarizeState(state);
  assert.deepEqual(summary.featureCounts, { done: 1, in_progress: 2 });
  assert.equal(summary.features.length, 3);
});

test('filterFeatures sin status devuelve todas; con status filtra', () => {
  const state = store.initialState();
  state.features.push({ id: 'F001', status: 'done' }, { id: 'F002', status: 'in_progress' });
  assert.equal(store.filterFeatures(state).length, 2);
  assert.deepEqual(
    store.filterFeatures(state, { status: 'done' }).map((f) => f.id),
    ['F001']
  );
});
