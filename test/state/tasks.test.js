'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const feature = require('../../bin/lib/state/feature');
const hu = require('../../bin/lib/state/hu');
const tasks = require('../../bin/lib/state/tasks');
const { makeTmpDir, cleanup } = require('../helpers/tmp-dir');

function setupHuWithTasks(dir) {
  feature.register(dir, { id: 'F001', slug: 'registro-oauth2' });
  hu.create(dir, 'F001', 'US-001', 'titulo');

  const tasksPath = path.join(dir, 'docs/features/F001-registro-oauth2/US-001/tasks.json');
  fs.mkdirSync(path.dirname(tasksPath), { recursive: true });
  fs.writeFileSync(
    tasksPath,
    JSON.stringify({
      featureId: 'F001',
      huId: 'US-001',
      huTitle: 'titulo',
      tasks: [
        { id: 'T001', description: 'Crear entidad', layer: 'Domain', status: 'pending' },
        { id: 'T002', description: 'Handler', layer: 'Application', status: 'pending' },
      ],
    }),
    'utf8'
  );
  return tasksPath;
}

test('list / progress reflejan el tasks.json de la HU', () => {
  const dir = makeTmpDir();
  try {
    setupHuWithTasks(dir);
    assert.equal(tasks.list(dir, 'F001', 'US-001').length, 2);
    assert.deepEqual(tasks.progress(dir, 'F001', 'US-001'), { total: 2, done: 0, percent: 0 });
  } finally {
    cleanup(dir);
  }
});

test('taskStart / taskDone actualizan status y timestamps', () => {
  const dir = makeTmpDir();
  try {
    setupHuWithTasks(dir);
    tasks.taskStart(dir, 'F001', 'US-001', 'T001');
    let list = tasks.list(dir, 'F001', 'US-001');
    assert.equal(list.find((t) => t.id === 'T001').status, 'in_progress');
    assert.ok(list.find((t) => t.id === 'T001').startedAt);

    tasks.taskDone(dir, 'F001', 'US-001', 'T001');
    list = tasks.list(dir, 'F001', 'US-001');
    assert.equal(list.find((t) => t.id === 'T001').status, 'done');
    assert.ok(list.find((t) => t.id === 'T001').completedAt);

    assert.deepEqual(tasks.progress(dir, 'F001', 'US-001'), { total: 2, done: 1, percent: 50 });
  } finally {
    cleanup(dir);
  }
});

test('taskBlock registra el motivo', () => {
  const dir = makeTmpDir();
  try {
    setupHuWithTasks(dir);
    tasks.taskBlock(dir, 'F001', 'US-001', 'T002', 'esperando contrato de API');
    const task = tasks.list(dir, 'F001', 'US-001').find((t) => t.id === 'T002');
    assert.equal(task.status, 'blocked');
    assert.equal(task.blockedReason, 'esperando contrato de API');
  } finally {
    cleanup(dir);
  }
});

test('lanza si la tarea no existe', () => {
  const dir = makeTmpDir();
  try {
    setupHuWithTasks(dir);
    assert.throws(() => tasks.taskStart(dir, 'F001', 'US-001', 'T999'), /Tarea no encontrada/);
  } finally {
    cleanup(dir);
  }
});
