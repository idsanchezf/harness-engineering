'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PACKAGE_ROOT = path.join(__dirname, '..', '..', '..');

// npm descarta archivos llamados literalmente ".gitignore"/".npmignore" durante la
// instalacion real (aunque si queden incluidos en el tarball publicado) — es un
// comportamiento documentado de npm/pacote, no un bug de este paquete. Por eso el
// contenido de .opencode/.gitignore se genera aqui como constante en vez de copiarse
// como archivo shippeado (ver .opencode/.gitignore en la raiz del repo, que es la
// fuente de verdad para el desarrollo de ESTE repo; debe mantenerse en sync a mano).
const OPENCODE_GITIGNORE_CONTENT = ['node_modules', 'package.json', 'package-lock.json', '.gitignore', ''].join('\n');

const REQUIRED_ENTRIES = ['.opencode/agents', '.opencode/skills', '.opencode/package.json', 'templates', 'AGENTS.md', 'opencode.json'];

const OPTIONAL_ENTRIES = ['.opencode/package-lock.json'];

function copyEntry(entry, destDir) {
  const src = path.join(PACKAGE_ROOT, entry);
  const dest = path.join(destDir, entry);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
}

function scaffold(destDir) {
  const copied = [];

  for (const entry of REQUIRED_ENTRIES) {
    copyEntry(entry, destDir);
    copied.push(entry);
  }

  for (const entry of OPTIONAL_ENTRIES) {
    if (!fs.existsSync(path.join(PACKAGE_ROOT, entry))) continue;
    copyEntry(entry, destDir);
    copied.push(entry);
  }

  const gitignorePath = path.join(destDir, '.opencode', '.gitignore');
  fs.mkdirSync(path.dirname(gitignorePath), { recursive: true });
  fs.writeFileSync(gitignorePath, OPENCODE_GITIGNORE_CONTENT, 'utf8');
  copied.push('.opencode/.gitignore');

  return { copied };
}

module.exports = {
  id: 'opencode',
  label: 'opencode',
  detectBinary: 'opencode',
  status: 'supported',
  usageHint: 'Corre "opencode" en el directorio para iniciar la fase de inception',
  scaffold,
};
