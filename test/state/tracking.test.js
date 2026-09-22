'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const feature = require('../../bin/lib/state/feature');
const hu = require('../../bin/lib/state/hu');
const store = require('../../bin/lib/state/store');
const tracking = require('../../bin/lib/state/tracking');
const { makeTmpDir, cleanup } = require('../helpers/tmp-dir');

function setupHu(dir) {
  feature.register(dir, { id: 'F001', slug: 'registro-oauth2' });
  hu.create(dir, 'F001', 'US-001', 'titulo');
  hu.phaseStart(dir, 'F001', 'US-001', 'develop');
  hu.phaseComplete(dir, 'F001', 'US-001', 'develop');

  const tasksPath = path.join(dir, 'docs/features/F001-registro-oauth2/US-001/tasks.json');
  fs.mkdirSync(path.dirname(tasksPath), { recursive: true });
  fs.writeFileSync(
    tasksPath,
    JSON.stringify({ featureId: 'F001', huId: 'US-001', tasks: [{ id: 'T001', status: 'done' }] }),
    'utf8'
  );
  return tasksPath;
}

test('record persiste el bloque tracking en la fase de la HU y en la tarea', () => {
  const dir = makeTmpDir();
  try {
    const tasksPath = setupHu(dir);

    const data = {
      phases: [
        {
          fase: 'develop',
          featureId: 'F001',
          huId: 'US-001',
          tokens: { input: 100, output: 200, cacheCreationInput: 0, cacheReadInput: 0, total: 300 },
          tokensSource: 'claude-transcript',
          sessionsMatched: [{ cli: 'claude', agentId: 'abc', tokens: 300 }],
          costUsd: null,
          collectedAt: '2026-05-26T03:05:00Z',
          warnings: [],
        },
      ],
      tasks: [
        {
          taskId: 'T001',
          featureId: 'F001',
          huId: 'US-001',
          tokens: { input: 10, output: 20, cacheCreationInput: 0, cacheReadInput: 0, total: 30 },
          tokensSource: 'claude-transcript',
          sessionsMatched: [],
          costUsd: null,
          collectedAt: '2026-05-26T03:05:00Z',
          warnings: [],
        },
      ],
    };

    const result = tracking.record(dir, data, { version: '0.7.0' });
    assert.equal(result.phasesRecorded, 1);
    assert.equal(result.tasksRecorded, 1);

    const state = store.loadState(dir);
    const phaseTracking = state.features[0].userStories[0].phases.develop.tracking;
    assert.equal(phaseTracking.tokens.total, 300);
    assert.equal(phaseTracking.tokensSource, 'claude-transcript');
    assert.equal(state.harnessEngineeringVersion, '0.7.0');

    const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
    assert.equal(tasksData.tasks[0].tracking.tokens.total, 30);
  } finally {
    cleanup(dir);
  }
});

test('record no pisa harnessEngineeringVersion si ya estaba fijada', () => {
  const dir = makeTmpDir();
  try {
    setupHu(dir);
    store.mutate(dir, (state) => {
      state.harnessEngineeringVersion = '0.6.0';
    });

    tracking.record(dir, { phases: [], tasks: [] }, { version: '0.9.0' });
    assert.equal(store.loadState(dir).harnessEngineeringVersion, '0.6.0');
  } finally {
    cleanup(dir);
  }
});
