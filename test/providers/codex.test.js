'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const codex = require('../../bin/lib/providers/codex');
const { AGENTS_DIR } = require('../../bin/lib/source-paths');
const { makeTmpDir, cleanup } = require('../helpers/tmp-dir');

test('scaffold genera un .toml por subagente, sin archivo para el leader', () => {
  const dir = makeTmpDir();
  try {
    codex.scaffold(dir);
    const realSubagentCount = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md')).length - 1; // -1: leader

    const generated = fs.readdirSync(path.join(dir, '.codex', 'agents'));
    assert.equal(generated.length, realSubagentCount);
    assert.ok(generated.every((f) => f.endsWith('.toml')));
    assert.ok(!generated.includes('leader.toml'));
  } finally {
    cleanup(dir);
  }
});

test('mapea permission.edit a sandbox_mode (ask -> read-only, allow -> workspace-write)', () => {
  const dir = makeTmpDir();
  try {
    codex.scaffold(dir);
    const quality = fs.readFileSync(path.join(dir, '.codex', 'agents', 'quality.toml'), 'utf8');
    assert.ok(quality.includes('sandbox_mode = "read-only"'));

    const develop = fs.readFileSync(path.join(dir, '.codex', 'agents', 'develop.toml'), 'utf8');
    assert.ok(develop.includes('sandbox_mode = "workspace-write"'));
  } finally {
    cleanup(dir);
  }
});

test('el .toml generado tiene name/description/developer_instructions, sin rutas .opencode/', () => {
  const dir = makeTmpDir();
  try {
    codex.scaffold(dir);
    const toml = fs.readFileSync(path.join(dir, '.codex', 'agents', 'develop.toml'), 'utf8');
    assert.ok(toml.includes('name = "develop"'));
    assert.ok(toml.startsWith('name ='));
    assert.ok(/developer_instructions = '''/.test(toml));
    assert.ok(!toml.includes('.opencode/'), 'no deberia quedar ninguna ruta de opencode sin traducir');
  } finally {
    cleanup(dir);
  }
});

test('copia skills a .codex/skills/', () => {
  const dir = makeTmpDir();
  try {
    const { copied } = codex.scaffold(dir);
    assert.ok(copied.some((p) => p.startsWith('.codex/skills/') && p.endsWith('SKILL.md')));
  } finally {
    cleanup(dir);
  }
});

test('buildAgentsMdLeaderBlock produce el bloque delimitado del leader', () => {
  const { parseAgentFile } = require('../../bin/lib/agent-frontmatter');
  const parsedLeader = parseAgentFile(fs.readFileSync(path.join(AGENTS_DIR, 'leader.md'), 'utf8'));
  const block = codex.buildAgentsMdLeaderBlock(parsedLeader);
  assert.ok(block.includes('<!-- harness-engineering:leader:codex:start -->'));
  assert.ok(block.includes('<!-- harness-engineering:leader:codex:end -->'));
  assert.ok(!block.includes('.opencode/'));
});
