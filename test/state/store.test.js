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
