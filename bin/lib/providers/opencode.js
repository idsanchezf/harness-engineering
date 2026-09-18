'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { packageJsonContent, packageLockJsonContent } = require('./opencode-manifest');

const PACKAGE_ROOT = path.join(__dirname, '..', '..', '..');

// npm descarta (o al menos no garantiza incluir) archivos anidados llamados
// literalmente ".gitignore", "package.json" o "package-lock.json" al empaquetar o
// instalar — confirmado empiricamente: el `npm pack` local los incluia, pero el
// tarball publicado en GitHub Packages via CI no. Por eso el contenido de
// .opencode/.gitignore y .opencode/package(-lock).json se genera aqui como
// constantes (ver ./opencode-manifest.js) en vez de copiarse como archivos
// shippeados. Las fuentes reales en la raiz de ESTE repo (usadas solo para el
// desarrollo del propio harness) deben mantenerse en sync a mano si cambian.
const OPENCODE_GITIGNORE_CONTENT = ['node_modules', 'package.json', 'package-lock.json', '.gitignore', ''].join('\n');

// "templates" y "AGENTS.md" son comunes a cualquier CLI y se copian de forma
// incondicional desde cli.js, no desde este provider (ver copyCommonFiles en cli.js).
// Aqui solo va lo exclusivo de opencode.
const REQUIRED_ENTRIES = ['.opencode/agents', '.opencode/skills', 'opencode.json'];

function copyEntry(entry, destDir) {
  const src = path.join(PACKAGE_ROOT, entry);
  const dest = path.join(destDir, entry);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
}

function writeFile(relativePath, content, destDir, copied) {
  const dest = path.join(destDir, relativePath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
  copied.push(relativePath);
}

function scaffold(destDir) {
  const copied = [];

  for (const entry of REQUIRED_ENTRIES) {
    copyEntry(entry, destDir);
    copied.push(entry);
  }

  writeFile('.opencode/.gitignore', OPENCODE_GITIGNORE_CONTENT, destDir, copied);
  writeFile('.opencode/package.json', packageJsonContent, destDir, copied);
  writeFile('.opencode/package-lock.json', packageLockJsonContent, destDir, copied);

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
