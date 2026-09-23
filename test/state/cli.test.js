'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const state = require('../../bin/lib/state');
const store = require('../../bin/lib/state/store');
const { makeTmpDir, cleanup } = require('../helpers/tmp-dir');

function runInDir(dir, argv) {
  const originalCwd = process.cwd();
  const originalLog = console.log;
  const originalError = console.error;
  const logs = [];
  const errors = [];
  process.chdir(dir);
  console.log = (msg) => logs.push(msg);
  console.error = (msg) => errors.push(msg);
  try {
    state.run(argv);
  } finally {
    process.chdir(originalCwd);
    console.log = originalLog;
    console.error = originalError;
  }
  return { logs, errors, exitCode: process.exitCode };
}

test('CLI: feature phase-start/phase-complete via el dispatcher completo', () => {
  const dir = makeTmpDir();
  try {
    runInDir(dir, ['feature', 'register', '--id', 'F001', '--slug', 'a']);
    const { logs } = runInDir(dir, ['feature', 'phase-start', 'F001', 'analysis']);
    const result = JSON.parse(logs[0]);
    assert.equal(result.features[0].phases.analysis.status, 'in_progress');
  } finally {
    process.exitCode = undefined;
    cleanup(dir);
  }
});

test('CLI: hu create -> phase-start -> phase-complete', () => {
  const dir = makeTmpDir();
  try {
    runInDir(dir, ['feature', 'register', '--id', 'F001', '--slug', 'a']);
    runInDir(dir, ['hu', 'create', 'F001', 'US-001', 'Titulo de la HU']);
    runInDir(dir, ['hu', 'phase-start', 'F001', 'US-001', 'develop']);
    const { logs } = runInDir(dir, ['hu', 'phase-complete', 'F001', 'US-001', 'develop']);
    const result = JSON.parse(logs[0]);
    const hu = result.features[0].userStories[0];
    assert.equal(hu.title, 'Titulo de la HU');
    assert.equal(hu.phases.develop.status, 'completed');
  } finally {
    process.exitCode = undefined;
    cleanup(dir);
  }
});

test('CLI: subcomando desconocido devuelve {ok:false} y exitCode 1', () => {
  const dir = makeTmpDir();
  try {
    const { errors, exitCode } = runInDir(dir, ['no-existe']);
    assert.equal(exitCode, 1);
    const parsed = JSON.parse(errors[0]);
    assert.equal(parsed.ok, false);
  } finally {
    process.exitCode = undefined;
    cleanup(dir);
  }
});

test('CLI: resume devuelve el resumen (summarizeState) por defecto', () => {
  const dir = makeTmpDir();
  try {
    store.saveState(dir, store.initialState());
    const { logs } = runInDir(dir, ['resume']);
    const result = JSON.parse(logs[0]);
    assert.equal(result.inception.status, 'pending');
    assert.deepEqual(result.featureCounts, {});
  } finally {
    process.exitCode = undefined;
    cleanup(dir);
  }
});

test('CLI: resume --full devuelve el estado crudo, sin resumir', () => {
  const dir = makeTmpDir();
  try {
    runInDir(dir, ['feature', 'register', '--id', 'F001', '--slug', 'a']);
    runInDir(dir, ['hu', 'create', 'F001', 'US-001', 'titulo']);
    runInDir(dir, ['hu', 'mark-done', 'F001', 'US-001']);
    runInDir(dir, ['feature', 'mark-done', 'F001']);

    const { logs: summaryLogs } = runInDir(dir, ['resume']);
    const summary = JSON.parse(summaryLogs[0]);
    assert.equal(summary.features[0].userStories, undefined, 'la feature done queda como stub, sin userStories');

    const { logs: fullLogs } = runInDir(dir, ['resume', '--full']);
    const full = JSON.parse(fullLogs[0]);
    assert.equal(full.features[0].userStories[0].id, 'US-001');
  } finally {
    process.exitCode = undefined;
    cleanup(dir);
  }
});

test('CLI: list-features devuelve campos minimos por defecto y filtra por --status', () => {
  const dir = makeTmpDir();
  try {
    runInDir(dir, ['feature', 'register', '--id', 'F001', '--slug', 'a', '--name', 'Uno']);
    runInDir(dir, ['feature', 'register', '--id', 'F002', '--slug', 'b', '--name', 'Dos']);
    runInDir(dir, ['feature', 'mark-done', 'F001']);

    const { logs: allLogs } = runInDir(dir, ['list-features']);
    const all = JSON.parse(allLogs[0]);
    assert.deepEqual(Object.keys(all[0]).sort(), ['docsPath', 'id', 'name', 'status']);

    const { logs: filteredLogs } = runInDir(dir, ['list-features', '--status', 'done']);
    const filtered = JSON.parse(filteredLogs[0]);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, 'F001');
  } finally {
    process.exitCode = undefined;
    cleanup(dir);
  }
});

test('CLI: feature show devuelve el detalle completo de una sola feature', () => {
  const dir = makeTmpDir();
  try {
    runInDir(dir, ['feature', 'register', '--id', 'F001', '--slug', 'a']);
    runInDir(dir, ['hu', 'create', 'F001', 'US-001', 'titulo']);
    const { logs } = runInDir(dir, ['feature', 'show', 'F001']);
    const result = JSON.parse(logs[0]);
    assert.equal(result.id, 'F001');
    assert.equal(result.userStories[0].id, 'US-001');
  } finally {
    process.exitCode = undefined;
    cleanup(dir);
  }
});
