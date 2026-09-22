'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const claude = require('../../bin/lib/providers/claude');
const { AGENTS_DIR } = require('../../bin/lib/source-paths');
const { makeTmpDir, cleanup } = require('../helpers/tmp-dir');

test('scaffold traduce subagentes a .claude/agents/, sin archivo individual para el leader', () => {
  const dir = makeTmpDir();
  try {
    claude.scaffold(dir);
    const realSubagentCount = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md')).length - 1; // -1: leader

    const generated = fs.readdirSync(path.join(dir, '.claude', 'agents'));
    assert.equal(generated.length, realSubagentCount);
    assert.ok(!generated.includes('leader.md'), 'el agente mode: primary no debe generar un archivo aparte');
  } finally {
    cleanup(dir);
  }
});

test('inyecta el bloque leader en CLAUDE.md, sin rutas .opencode/ colgadas', () => {
  const dir = makeTmpDir();
  try {
    claude.scaffold(dir);
    const claudeMd = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
    assert.ok(claudeMd.includes('<!-- harness-engineering:leader:start -->'));
    assert.ok(claudeMd.includes('.claude/agents/'));
    assert.ok(!claudeMd.includes('.opencode/'), 'no deberia quedar ninguna ruta de opencode sin traducir');
  } finally {
    cleanup(dir);
  }
});

test('una referencia a un agente especifico (ej. tracking.md) se traduce a .claude/agents/tracking.md (misma extension)', () => {
  const dir = makeTmpDir();
  try {
    claude.scaffold(dir);
    const claudeMd = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
    assert.ok(claudeMd.includes('.claude/agents/tracking.md'));
  } finally {
    cleanup(dir);
  }
});

test('un agente edit:ask (ej. quality) genera tools: sin Write/Edit; edit:allow los incluye — ninguno de los dos incluye Task', () => {
  const dir = makeTmpDir();
  try {
    claude.scaffold(dir);
    const quality = fs.readFileSync(path.join(dir, '.claude', 'agents', 'quality.md'), 'utf8');
    assert.ok(quality.includes('tools: Read, Grep, Glob, Bash'));
    assert.ok(!quality.includes('Write'));
    assert.ok(!/tools:.*Task/.test(quality));

    const develop = fs.readFileSync(path.join(dir, '.claude', 'agents', 'develop.md'), 'utf8');
    assert.ok(develop.includes('tools: Read, Grep, Glob, Bash, Write, Edit'));
    assert.ok(!/tools:.*Task/.test(develop));
  } finally {
    cleanup(dir);
  }
});

test('inception es el unico subagente que conserva Task (delega en architect/scaffold)', () => {
  const dir = makeTmpDir();
  try {
    claude.scaffold(dir);
    const inception = fs.readFileSync(path.join(dir, '.claude', 'agents', 'inception.md'), 'utf8');
    assert.ok(!inception.includes('tools:'), 'inception hereda todas las herramientas (sin restriccion), incluida Task');
  } finally {
    cleanup(dir);
  }
});

test('no escribe AGENTS.md (Claude Code no lo usa)', () => {
  const dir = makeTmpDir();
  try {
    claude.scaffold(dir);
    assert.equal(fs.existsSync(path.join(dir, 'AGENTS.md')), false);
  } finally {
    cleanup(dir);
  }
});
