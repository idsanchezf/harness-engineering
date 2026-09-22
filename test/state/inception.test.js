'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const inception = require('../../bin/lib/state/inception');
const { makeTmpDir, cleanup } = require('../helpers/tmp-dir');

test('ciclo feliz de inception: start -> phase-start -> phase-complete -> complete', () => {
  const dir = makeTmpDir();
  try {
    inception.start(dir);
    assert.equal(inception.status(dir).status, 'in_progress');

    inception.phaseStart(dir, 'context');
    assert.equal(inception.phaseStatus(dir, 'context').status, 'in_progress');

    inception.phaseComplete(dir, 'context');
    assert.equal(inception.phaseStatus(dir, 'context').status, 'completed');
    assert.ok(inception.phaseStatus(dir, 'context').completedAt);

    const final = inception.complete(dir);
    assert.equal(final.inception.status, 'completed');
    for (const fase of ['context', 'discovery', 'ddd', 'architecture', 'scaffold', 'environments']) {
      assert.equal(final.inception.phases[fase].status, 'completed');
    }
  } finally {
    cleanup(dir);
  }
});

test('rechaza fases invalidas', () => {
  const dir = makeTmpDir();
  try {
    assert.throws(() => inception.phaseStart(dir, 'no-existe'), /Fase de inception invalida/);
  } finally {
    cleanup(dir);
  }
});
