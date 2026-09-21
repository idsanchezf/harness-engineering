'use strict';

const fs = require('node:fs');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { buildOpencodeJson, buildAgentMap } = require('../bin/lib/providers/opencode-config');
const { AGENTS_DIR } = require('../bin/lib/source-paths');

// Corre contra los agents/*.md REALES del repo a proposito: es una guardia
// anti-regresion del bug de deriva encontrado (opencode.json mantenido a mano tenia
// el agente "tracking" sin registrar en su mapa `agent`).
test('buildAgentMap incluye TODOS los agentes presentes en agents/*.md', () => {
  const realNames = fs
    .readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
    .sort();

  const { agent } = buildAgentMap(AGENTS_DIR);
  assert.deepEqual(Object.keys(agent).sort(), realNames);
  assert.ok(realNames.includes('tracking'), 'fixture guard: se esperaba que "tracking" siga siendo un agente real');
});

test('buildAgentMap deriva default_agent del (unico) agente mode: primary', () => {
  const { agent, defaultAgent } = buildAgentMap(AGENTS_DIR);
  assert.equal(defaultAgent, 'leader');
  assert.equal(agent.leader.mode, 'primary');

  const primaryCount = Object.values(agent).filter((a) => a.mode === 'primary').length;
  assert.equal(primaryCount, 1);
});

test('buildOpencodeJson produce JSON valido con $schema, instructions y permission base', () => {
  const parsed = JSON.parse(buildOpencodeJson(AGENTS_DIR));
  assert.equal(parsed.$schema, 'https://opencode.ai/config.json');
  assert.deepEqual(parsed.instructions, ['HARNESS.md', 'AGENTS.md']);
  assert.equal(parsed.default_agent, 'leader');
  assert.equal(parsed.permission.edit, 'ask');
  assert.ok(parsed.agent.tracking, 'el agente tracking debe estar presente en el JSON generado');
});
