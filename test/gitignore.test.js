'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { ensureGitignore } = require('../bin/lib/gitignore');
const { makeTmpDir, cleanup } = require('./helpers/tmp-dir');

const fakeOpencode = { id: 'opencode', gitignoreNotes: ['# nota de opencode'] };
const fakeClaude = { id: 'claude' };

test('la nota de opencode solo aparece si opencode fue seleccionado', () => {
  const dir = makeTmpDir();
  try {
    ensureGitignore(dir, [fakeClaude]);
    const withoutOpencode = fs.readFileSync(path.join(dir, '.gitignore'), 'utf8');
    assert.ok(!withoutOpencode.includes('# nota de opencode'));
  } finally {
    cleanup(dir);
  }
});

test('la nota de opencode aparece si opencode esta entre los seleccionados', () => {
  const dir = makeTmpDir();
  try {
    ensureGitignore(dir, [fakeOpencode, fakeClaude]);
    const withOpencode = fs.readFileSync(path.join(dir, '.gitignore'), 'utf8');
    assert.ok(withOpencode.includes('# nota de opencode'));
  } finally {
    cleanup(dir);
  }
});

test('ensureGitignore es idempotente (segunda corrida no duplica el bloque)', () => {
  const dir = makeTmpDir();
  try {
    const first = ensureGitignore(dir, [fakeOpencode]);
    const second = ensureGitignore(dir, [fakeOpencode]);
    assert.equal(first, 'created');
    assert.equal(second, 'unchanged');
    const content = fs.readFileSync(path.join(dir, '.gitignore'), 'utf8');
    assert.equal(content.split('node_modules/').length - 1, 1);
  } finally {
    cleanup(dir);
  }
});
