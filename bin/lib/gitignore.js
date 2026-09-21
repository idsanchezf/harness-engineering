'use strict';

const path = require('node:path');
const { ensureBlock } = require('./block-file');

const START_MARKER = '# --- harness-engineering:start ---';
const END_MARKER = '# --- harness-engineering:end ---';

// selectedProviders: cada uno puede declarar `gitignoreNotes` (lineas de comentario
// adicionales, ej. la nota de opencode sobre .opencode/.gitignore) — antes esa nota
// se incluia siempre, incluso si opencode no habia sido seleccionado.
function ensureGitignore(destDir, selectedProviders = []) {
  const extraNotes = selectedProviders.flatMap((p) => p.gitignoreNotes || []);
  const block = [
    START_MARKER,
    '# Generado por @idsanchezf/harness-engineering.',
    ...extraNotes,
    'node_modules/',
    END_MARKER,
    '',
  ].join('\n');

  return ensureBlock(path.join(destDir, '.gitignore'), { startMarker: START_MARKER, block });
}

module.exports = { ensureGitignore };
