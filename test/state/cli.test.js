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

test('CLI: resume devuelve el estado tal cual lo ve store.loadState', () => {
  const dir = makeTmpDir();
  try {
    store.saveState(dir, store.initialState());
    const { logs } = runInDir(dir, ['resume']);
    const result = JSON.parse(logs[0]);
    assert.equal(result.inception.status, 'pending');
  } finally {
    process.exitCode = undefined;
    cleanup(dir);
  }
});
