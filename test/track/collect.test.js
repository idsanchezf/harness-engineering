'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { collectForWindow, collectPhase, collectTask, loadTasks } = require('../../bin/lib/track/collect');
const { makeTmpDir, cleanup } = require('../helpers/tmp-dir');

function fakeProvider({ id, priority, tokens, available = true }) {
  return {
    id,
    detectBinary: id,
    trackingSource: { priority, collect: () => (tokens ? { tokens, source: id } : { tokens: null, source: id }) },
    __available: available,
  };
}

test('respeta la prioridad: la fuente con menor priority se intenta primero', () => {
  const claudeLike = fakeProvider({ id: 'claude-like', priority: 0, tokens: { total: 100 } });
  const opencodeLike = fakeProvider({ id: 'opencode-like', priority: 10, tokens: { total: 200 } });

  const result = collectForWindow('/tmp/project', [], {}, {
    providers: [opencodeLike, claudeLike],
    isOnPath: () => true,
  });

  assert.equal(result.source, 'claude-like');
});

test('cae a la siguiente fuente si la de mayor prioridad no devuelve tokens', () => {
  const claudeLike = fakeProvider({ id: 'claude-like', priority: 0, tokens: null });
  const opencodeLike = fakeProvider({ id: 'opencode-like', priority: 10, tokens: { total: 200 } });

  const result = collectForWindow('/tmp/project', [], {}, {
    providers: [claudeLike, opencodeLike],
    isOnPath: () => true,
  });

  assert.equal(result.source, 'opencode-like');
});

test('ignora providers sin trackingSource (ej. codex) y sin binario disponible en PATH', () => {
  const codexLike = { id: 'codex-like', detectBinary: 'codex-like', trackingSource: null };
  const claudeLike = fakeProvider({ id: 'claude-like', priority: 0, tokens: { total: 100 } });

  const result = collectForWindow('/tmp/project', [], {}, {
    providers: [codexLike, claudeLike],
    isOnPath: (bin) => bin === 'claude-like',
  });

  assert.equal(result.source, 'claude-like');
});

test('devuelve "unavailable" sin inventar datos si ninguna fuente responde', () => {
  const result = collectForWindow('/tmp/project', [], {}, { providers: [], isOnPath: () => false });
  assert.equal(result.tokens, null);
  assert.equal(result.source, 'unavailable');
});

function phaseWithCachedTracking(overrides = {}) {
  return {
    startedAt: '2026-01-01T00:00:00Z',
    completedAt: '2026-01-01T01:00:00Z',
    tracking: {
      tokens: { input: 1, output: 2, total: 3 },
      tokensSource: 'claude-transcript',
      sessionsMatched: [{ cli: 'claude', agentId: 'x', tokens: 3 }],
      costUsd: null,
      collectedAt: '2026-01-01T01:05:00Z',
      warnings: [],
    },
    ...overrides,
  };
}

test('collectPhase reutiliza el tracking ya persistido sin recalcular', () => {
  const phaseObj = phaseWithCachedTracking();
  const result = collectPhase('/no/existe/este/proyecto', 'develop', 'F001', 'US-001', phaseObj);
  assert.deepEqual(result.tokens, phaseObj.tracking.tokens);
  assert.equal(result.tokensSource, 'claude-transcript');
  assert.equal(result.collectedAt, '2026-01-01T01:05:00Z', 'collectedAt debe ser el original, no uno nuevo');
});

test('collectPhase con --force ignora el cache y recalcula', () => {
  const phaseObj = phaseWithCachedTracking();
  const result = collectPhase('/no/existe/este/proyecto', 'develop', 'F001', 'US-001', phaseObj, { force: true });
  assert.notEqual(result.collectedAt, '2026-01-01T01:05:00Z', 'un recalculo real genera un collectedAt nuevo');
});

test('collectPhase nunca reutiliza un resultado "unavailable" (tokens null), reintenta siempre', () => {
  const phaseObj = phaseWithCachedTracking({
    tracking: { tokens: null, tokensSource: 'unavailable', sessionsMatched: [], costUsd: null, collectedAt: 'viejo', warnings: ['x'] },
  });
  const result = collectPhase('/no/existe/este/proyecto', 'develop', 'F001', 'US-001', phaseObj);
  assert.notEqual(result.collectedAt, 'viejo', 'debio reintentar el calculo en vez de reusar el unavailable cacheado');
});

test('collectTask reutiliza el tracking ya persistido sin recalcular', () => {
  const task = {
    id: 'T001',
    startedAt: '2026-01-01T00:00:00Z',
    completedAt: '2026-01-01T01:00:00Z',
    tracking: {
      tokens: { input: 1, output: 1, total: 2 },
      tokensSource: 'claude-transcript',
      sessionsMatched: [],
      costUsd: null,
      collectedAt: '2026-01-01T01:05:00Z',
      warnings: [],
    },
  };
  const result = collectTask('/no/existe/este/proyecto', 'F001', 'US-001', task);
  assert.deepEqual(result.tokens, task.tracking.tokens);
  assert.equal(result.collectedAt, '2026-01-01T01:05:00Z');
});

test('loadTasks con cache no vuelve a leer el archivo en la segunda llamada', () => {
  const dir = makeTmpDir();
  try {
    const docsPath = 'docs/features/F001-demo/US-001/';
    const tasksPath = path.join(dir, docsPath, 'tasks.json');
    fs.mkdirSync(path.dirname(tasksPath), { recursive: true });
    fs.writeFileSync(tasksPath, JSON.stringify({ tasks: [{ id: 'T001' }] }), 'utf8');

    const cache = new Map();
    const first = loadTasks(dir, docsPath, cache);
    assert.equal(first.length, 1);

    // Corrompe el archivo: si la segunda llamada releyera de disco, el catch de
    // loadTasks devolveria [] en vez de la lista cacheada.
    fs.writeFileSync(tasksPath, 'esto no es JSON valido', 'utf8');
    const second = loadTasks(dir, docsPath, cache);
    assert.deepEqual(second, first, 'debio devolver el resultado cacheado, no releer el archivo corrupto');
  } finally {
    cleanup(dir);
  }
});
