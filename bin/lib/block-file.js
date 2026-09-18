'use strict';

const fs = require('node:fs');

// Crea el archivo con el bloque si no existe, o le hace append una sola vez (idempotente,
// detectado via `startMarker`) si ya existe y todavia no lo tiene. El marcador cambia segun
// el tipo de archivo (comentario "#" en .gitignore, comentario HTML "<!-- -->" en Markdown),
// por eso lo recibe como parametro en vez de asumir un formato fijo.
function ensureBlock(filePath, { startMarker, block }) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, block, 'utf8');
    return 'created';
  }

  const current = fs.readFileSync(filePath, 'utf8');
  if (current.includes(startMarker)) {
    return 'unchanged';
  }

  const separator = current.endsWith('\n') ? '\n' : '\n\n';
  fs.appendFileSync(filePath, `${separator}${block}`, 'utf8');
  return 'appended';
}

module.exports = { ensureBlock };
