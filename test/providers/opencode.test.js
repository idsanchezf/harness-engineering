'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const opencode = require('../../bin/lib/providers/opencode');
const { AGENTS_DIR } = require('../../bin/lib/source-paths');
const { makeTmpDir, cleanup } = require('../helpers/tmp-dir');

test('scaffold copia todos los agentes/skills tal cual y genera opencode.json', () => {
  const dir = makeTmpDir();
  try {
    const { copied } = opencode.scaffold(dir);
    const realAgentCount = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md')).length;

    const generatedAgents = fs.readdirSync(path.join(dir, '.opencode', 'agents'));
    assert.equal(generatedAgents.length, realAgentCount);
    assert.ok(generatedAgents.includes('leader.md'), 'leader SI se copia tal cual para opencode (formato nativo)');

    const config = JSON.parse(fs.readFileSync(path.join(dir, 'opencode.json'), 'utf8'));
    assert.equal(config.default_agent, 'leader');
    assert.ok(config.agent.tracking, 'regresion del bug de deriva: falta el agente tracking');

    assert.ok(copied.includes('opencode.json'));
    assert.ok(copied.includes('.opencode/agents/leader.md'));
    assert.ok(copied.every((p) => !p.includes('\\')), 'las rutas en `copied` deben ser posix, no backslash de Windows');
  } finally {
    cleanup(dir);
  }
});

test('no escribe AGENTS.md (lo maneja el modulo compartido agents-md.js)', () => {
  const dir = makeTmpDir();
  try {
    opencode.scaffold(dir);
    assert.equal(fs.existsSync(path.join(dir, 'AGENTS.md')), false);
  } finally {
    cleanup(dir);
  }
});

test('genera .opencode/.gitignore, package.json y package-lock.json', () => {
  const dir = makeTmpDir();
  try {
    opencode.scaffold(dir);
    assert.ok(fs.existsSync(path.join(dir, '.opencode', '.gitignore')));
    assert.ok(fs.existsSync(path.join(dir, '.opencode', 'package.json')));
    assert.ok(fs.existsSync(path.join(dir, '.opencode', 'package-lock.json')));
  } finally {
    cleanup(dir);
  }
});
