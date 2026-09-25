'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { readUsageAndRange, newTokens, processedTokens } = require('../../bin/lib/track/sources/claude-transcript');
const { makeTmpDir, cleanup } = require('../helpers/tmp-dir');

function usage(input, output, cacheCreation, cacheRead) {
  return {
    input_tokens: input,
    output_tokens: output,
    cache_creation_input_tokens: cacheCreation,
    cache_read_input_tokens: cacheRead,
  };
}

function writeJsonl(dir, entries) {
  const file = path.join(dir, 'agent-x.jsonl');
  fs.writeFileSync(file, entries.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf8');
  return file;
}

test('readUsageAndRange cuenta una sola vez un mensaje repartido en varias lineas', () => {
  const dir = makeTmpDir();
  try {
    // Claude Code escribe una linea por bloque (thinking, text, tool_use) con el mismo usage.
    const file = writeJsonl(dir, [
      { timestamp: '2026-01-01T00:00:00Z', message: { id: 'msg_1', usage: usage(3, 10, 1000, 20000) } },
      { timestamp: '2026-01-01T00:00:01Z', message: { id: 'msg_1', usage: usage(3, 10, 1000, 20000) } },
      { timestamp: '2026-01-01T00:00:02Z', message: { id: 'msg_1', usage: usage(3, 40, 1000, 20000) } },
      { timestamp: '2026-01-01T00:00:03Z', message: { id: 'msg_2', usage: usage(1, 5, 200, 21000) } },
    ]);

    const { totals, messageCount, firstTimestamp, lastTimestamp } = readUsageAndRange(file);

    assert.equal(messageCount, 2);
    assert.deepEqual(totals, { input: 4, output: 45, cacheCreationInput: 1200, cacheReadInput: 41000 });
    assert.equal(firstTimestamp, '2026-01-01T00:00:00Z');
    assert.equal(lastTimestamp, '2026-01-01T00:00:03Z');
  } finally {
    cleanup(dir);
  }
});

test('readUsageAndRange agrupa por requestId cuando el mensaje no trae id', () => {
  const dir = makeTmpDir();
  try {
    const file = writeJsonl(dir, [
      { requestId: 'req_1', message: { usage: usage(2, 7, 0, 500) } },
      { requestId: 'req_1', message: { usage: usage(2, 7, 0, 500) } },
    ]);

    const { totals } = readUsageAndRange(file);

    assert.deepEqual(totals, { input: 2, output: 7, cacheCreationInput: 0, cacheReadInput: 500 });
  } finally {
    cleanup(dir);
  }
});

test('newTokens excluye la relectura de cache y processedTokens la incluye', () => {
  const totals = { input: 4, output: 45, cacheCreationInput: 1200, cacheReadInput: 41000 };

  assert.equal(newTokens(totals), 1249);
  assert.equal(processedTokens(totals), 42249);
});
