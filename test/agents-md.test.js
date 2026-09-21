'use strict';

const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { buildAgentsMd, writeAgentsMd } = require('../bin/lib/agents-md');
const { AGENTS_DIR } = require('../bin/lib/source-paths');
const { makeTmpDir, cleanup } = require('./helpers/tmp-dir');

// Providers "falsos" minimos: no dependen de I/O real salvo cuando declaran
// needsAgentsMdLeaderBlock (ahi si se lee agents/leader.md, real, para el caso de
// integracion final).
const fakeOpencode = {
  id: 'opencode',
  label: 'opencode',
  usesAgentsMd: true,
  describeStructure: () => [{ path: '.opencode/agents/*.md', note: 'Agentes' }],
};

const fakeClaude = {
  id: 'claude',
  label: 'claude',
  describeStructure: () => [{ path: '.claude/agents/*.md', note: 'Subagentes' }],
};

const fakeCodex = {
  id: 'codex',
  label: 'codex',
  usesAgentsMd: true,
  needsAgentsMdLeaderBlock: true,
  describeStructure: () => [{ path: '.codex/agents/*.toml', note: 'Subagentes' }],
  buildAgentsMdLeaderBlock: (parsedLeader) =>
    ['<!-- fake-leader-start -->', parsedLeader.description, '<!-- fake-leader-end -->'].join('\n'),
};

test('solo opencode seleccionado: no agrega bloque leader', () => {
  const md = buildAgentsMd([fakeOpencode], { agentsDir: AGENTS_DIR });
  assert.ok(md.includes('.opencode/agents/*.md'));
  assert.ok(!md.includes('fake-leader-start'));
});

test('solo claude seleccionado: writeAgentsMd no escribe nada', () => {
  const dir = makeTmpDir();
  try {
    const result = writeAgentsMd(dir, [fakeClaude], { agentsDir: AGENTS_DIR });
    assert.deepEqual(result.copied, []);
    assert.equal(require('node:fs').existsSync(path.join(dir, 'AGENTS.md')), false);
  } finally {
    cleanup(dir);
  }
});

test('solo codex seleccionado: agrega el bloque leader (via buildAgentsMdLeaderBlock real)', () => {
  const md = buildAgentsMd([fakeCodex], { agentsDir: AGENTS_DIR });
  assert.ok(md.includes('.codex/agents/*.toml'));
  assert.ok(md.includes('fake-leader-start'));
});

test('opencode+claude: tabla incluye ambos, sin bloque leader', () => {
  const md = buildAgentsMd([fakeOpencode, fakeClaude], { agentsDir: AGENTS_DIR });
  assert.ok(md.includes('.opencode/agents/*.md'));
  assert.ok(md.includes('.claude/agents/*.md'));
  assert.ok(!md.includes('fake-leader-start'));
});

test('opencode+codex: tabla completa Y bloque leader', () => {
  const md = buildAgentsMd([fakeOpencode, fakeCodex], { agentsDir: AGENTS_DIR });
  assert.ok(md.includes('.opencode/agents/*.md'));
  assert.ok(md.includes('.codex/agents/*.toml'));
  assert.ok(md.includes('fake-leader-start'));
});

test('los 3 juntos: tabla con los 3, un solo bloque leader (codex)', () => {
  const md = buildAgentsMd([fakeOpencode, fakeClaude, fakeCodex], { agentsDir: AGENTS_DIR });
  assert.ok(md.includes('.opencode/agents/*.md'));
  assert.ok(md.includes('.claude/agents/*.md'));
  assert.ok(md.includes('.codex/agents/*.toml'));
  assert.equal(md.split('fake-leader-start').length - 1, 1);
});

test('writeAgentsMd escribe AGENTS.md cuando algun provider usesAgentsMd', () => {
  const dir = makeTmpDir();
  try {
    const result = writeAgentsMd(dir, [fakeOpencode], { agentsDir: AGENTS_DIR });
    assert.deepEqual(result.copied, ['AGENTS.md']);
    assert.ok(require('node:fs').existsSync(path.join(dir, 'AGENTS.md')));
  } finally {
    cleanup(dir);
  }
});
