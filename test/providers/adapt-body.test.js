'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { adaptBody, replacePaths } = require('../../bin/lib/providers/adapt-body');

test('replacePaths swapea el directorio de skills sin tocar la extension (siempre SKILL.md)', () => {
  const out = replacePaths('ver `.opencode/skills/tdd-dotnet/SKILL.md`', {
    agentsDir: '.codex/agents',
    skillsDir: '.codex/skills',
    agentFileExt: 'toml',
  });
  assert.equal(out, 'ver `.codex/skills/tdd-dotnet/SKILL.md`');
});

test('replacePaths swapea directorio Y extension para una referencia a un agente especifico (Codex usa .toml)', () => {
  const out = replacePaths('ver `.opencode/agents/tracking.md`', {
    agentsDir: '.codex/agents',
    skillsDir: '.codex/skills',
    agentFileExt: 'toml',
  });
  assert.equal(out, 'ver `.codex/agents/tracking.toml`');
});

test('replacePaths con agentFileExt por defecto (md) mantiene la extension para Claude Code', () => {
  const out = replacePaths('ver `.opencode/agents/tracking.md`', {
    agentsDir: '.claude/agents',
    skillsDir: '.claude/skills',
  });
  assert.equal(out, 'ver `.claude/agents/tracking.md`');
});

test('adaptBody aplica replacePaths sobre el body completo, para Codex', () => {
  const body = 'Instrucciones.\n\nVer `.opencode/agents/tracking.md` y `.opencode/skills/tdd-dotnet/SKILL.md`.';
  const out = adaptBody(body, { agentsDir: '.codex/agents', skillsDir: '.codex/skills', agentFileExt: 'toml' });
  assert.ok(out.includes('.codex/agents/tracking.toml'));
  assert.ok(out.includes('.codex/skills/tdd-dotnet/SKILL.md'));
  assert.ok(!out.includes('.opencode/'));
});
