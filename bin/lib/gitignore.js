'use strict';

const path = require('node:path');
const { ensureBlock } = require('./block-file');

const START_MARKER = '# --- harness-engineering:start ---';
const END_MARKER = '# --- harness-engineering:end ---';

const BLOCK = [
  START_MARKER,
  '# Generado por @idsanchezf/harness-engineering.',
  '# .opencode/node_modules queda cubierto por .opencode/.gitignore (copiado junto con la plantilla).',
  'node_modules/',
  END_MARKER,
  '',
].join('\n');

function ensureGitignore(destDir) {
  return ensureBlock(path.join(destDir, '.gitignore'), { startMarker: START_MARKER, block: BLOCK });
}

module.exports = { ensureGitignore };
