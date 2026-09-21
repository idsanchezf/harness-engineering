'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { tomlBasicString, tomlMultilineLiteral, serializeAgentToml } = require('../bin/lib/providers/toml');

test('tomlBasicString escapes backslashes and double quotes', () => {
  assert.equal(tomlBasicString('a "quoted" \\path\\'), '"a \\"quoted\\" \\\\path\\\\"');
});

test('tomlBasicString collapses newlines defensively', () => {
  assert.equal(tomlBasicString('line1\nline2'), '"line1 line2"');
});

test('tomlMultilineLiteral wraps content in triple-quote literal delimiters', () => {
  const out = tomlMultilineLiteral('# Heading\n\nSome body with `backticks` and *markdown*.');
  assert.ok(out.startsWith("'''\n"));
  assert.ok(out.endsWith("\n'''"));
  assert.ok(out.includes('# Heading'));
});

test('tomlMultilineLiteral rejects content containing the closing delimiter sequence', () => {
  assert.throws(() => tomlMultilineLiteral("text with ''' inside"), /secuencia/);
});

test('serializeAgentToml emits all four required fields', () => {
  const out = serializeAgentToml({
    name: 'quality',
    description: 'Analisis estatico',
    developerInstructions: 'Cuerpo del agente.',
    sandboxMode: 'read-only',
  });
  assert.ok(out.includes('name = "quality"'));
  assert.ok(out.includes('description = "Analisis estatico"'));
  assert.ok(out.includes('sandbox_mode = "read-only"'));
  assert.ok(out.includes("developer_instructions = '''\nCuerpo del agente.\n'''"));
});
