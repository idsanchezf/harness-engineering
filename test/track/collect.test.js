'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { collectForWindow } = require('../../bin/lib/track/collect');

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
