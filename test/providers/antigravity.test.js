'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const antigravity = require('../../bin/lib/providers/antigravity');
const { PROVIDERS } = require('../../bin/lib/providers');
const { parseAgentFlag } = require('../../bin/lib/select-providers');
const { buildAgentsMd } = require('../../bin/lib/agents-md');
const { splitFrontmatter } = require('../../bin/lib/agent-frontmatter');
const { AGENTS_DIR } = require('../../bin/lib/source-paths');
const { makeTmpDir, cleanup } = require('../helpers/tmp-dir');

function readAgent(dir, name) {
  return fs.readFileSync(path.join(dir, '.agents', 'agents', `${name}.md`), 'utf8');
}

test('scaffold genera un .md por agente en .agents/agents/, incluido el leader', () => {
  const dir = makeTmpDir();
  try {
    antigravity.scaffold(dir);
    const source = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md')).sort();
    const generated = fs.readdirSync(path.join(dir, '.agents', 'agents')).sort();
    assert.deepEqual(generated, source);
    assert.ok(generated.includes('leader.md'));
  } finally {
    cleanup(dir);
  }
});

test('el leader es agente principal, delega con invoke_subagent y no edita archivos', () => {
  const dir = makeTmpDir();
  try {
    antigravity.scaffold(dir);
    const leader = readAgent(dir, 'leader');
    assert.ok(leader.includes('mainAgent: true'));
    assert.ok(leader.includes('subagent: false'));
    assert.ok(leader.includes('  - invoke_subagent'));
    assert.ok(!leader.includes('write_to_file'), 'el leader tiene edit: ask en la fuente');
    assert.ok(leader.includes('herramienta `invoke_subagent`'), 'debe aclarar que Task = invoke_subagent');
  } finally {
    cleanup(dir);
  }
});

test('mapea permission.edit y permission.task a tools', () => {
  const dir = makeTmpDir();
  try {
    antigravity.scaffold(dir);
    const quality = readAgent(dir, 'quality');
    assert.ok(!quality.includes('write_to_file'));
    assert.ok(!quality.includes('replace_file_content'));
    assert.ok(!quality.includes('invoke_subagent'));

    const develop = readAgent(dir, 'develop');
    assert.ok(develop.includes('  - write_to_file'));
    assert.ok(develop.includes('  - replace_file_content'));
    assert.ok(develop.includes('mainAgent: false'));
    assert.ok(develop.includes('subagent: true'));

    assert.ok(readAgent(dir, 'inception').includes('  - invoke_subagent'));
  } finally {
    cleanup(dir);
  }
});

test('todos los agentes piden revision de comandos, llevan description entre comillas y no tienen rutas .opencode/', () => {
  const dir = makeTmpDir();
  try {
    antigravity.scaffold(dir);
    for (const file of fs.readdirSync(path.join(dir, '.agents', 'agents'))) {
      const content = readAgent(dir, path.basename(file, '.md'));
      const { frontmatterRaw } = splitFrontmatter(content);
      assert.ok(frontmatterRaw.includes('commandExecutionPolicy: off'), file);
      const descLine = frontmatterRaw.split('\n').find((l) => l.startsWith('description: '));
      assert.doesNotThrow(() => JSON.parse(descLine.slice('description: '.length)), file);
      assert.ok(!content.includes('.opencode/'), `${file} no deberia tener rutas de opencode sin traducir`);
    }
  } finally {
    cleanup(dir);
  }
});

test('copia skills a .agents/skills/', () => {
  const dir = makeTmpDir();
  try {
    const { copied } = antigravity.scaffold(dir);
    assert.ok(copied.some((p) => p.startsWith('.agents/skills/') && p.endsWith('SKILL.md')));
  } finally {
    cleanup(dir);
  }
});

test('--agent antigravity lo selecciona y AGENTS.md no lleva bloque de leader', () => {
  const selected = parseAgentFlag('antigravity', PROVIDERS);
  assert.deepEqual(selected.map((p) => p.id), ['antigravity']);

  const agentsMd = buildAgentsMd(selected, { agentsDir: AGENTS_DIR });
  assert.ok(agentsMd.includes('.agents/agents/*.md'));
  assert.ok(!agentsMd.includes('harness-engineering:leader'));
});
