'use strict';

const { execFileSync } = require('node:child_process');

function isOnPath(bin) {
  try {
    const finder = process.platform === 'win32' ? 'where' : 'which';
    execFileSync(finder, [bin], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Detecta, por cada provider del registro, si su binario esta disponible en PATH.
// Solo se usa para mostrar informacion en el banner (nunca bloquea ni decide que
// providers se ejecutan). Un provider sin detectBinary queda como null.
function detectAll(providers) {
  const result = {};
  for (const provider of providers) {
    result[provider.id] = provider.detectBinary ? isOnPath(provider.detectBinary) : null;
  }
  return result;
}

module.exports = { detectAll, isOnPath };
