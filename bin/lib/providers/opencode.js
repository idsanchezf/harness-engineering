'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { packageJsonContent, packageLockJsonContent } = require('./opencode-manifest');
const { buildOpencodeJson } = require('./opencode-config');
const { AGENTS_DIR, SKILLS_DIR } = require('../source-paths');
const { collectOpencodeTokens } = require('../track/sources/opencode-source');

// npm descarta (o al menos no garantiza incluir) archivos anidados llamados
// literalmente ".gitignore", "package.json" o "package-lock.json" al empaquetar o
// instalar — confirmado empiricamente: el `npm pack` local los incluia, pero el
// tarball publicado en GitHub Packages via CI no. Por eso el contenido de
// .opencode/.gitignore y .opencode/package(-lock).json se genera aqui como
// constantes (ver ./opencode-manifest.js) en vez de copiarse como archivos
// shippeados.
const OPENCODE_GITIGNORE_CONTENT = ['node_modules', 'package.json', 'package-lock.json', '.gitignore', ''].join('\n');

// relativePath siempre en formato posix ("a/b/c"), igual convencion que claude.js/
// codex.js -- solo se traduce a separador nativo del SO al resolver la ruta real de
// escritura, nunca al registrarla en `copied`.
function writeFile(relativePath, content, destDir, copied) {
  const dest = path.join(destDir, ...relativePath.split('/'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
  copied.push(relativePath);
}

// opencode es el formato nativo de agents/*.md y skills/*/SKILL.md: se copian tal
// cual (sin traduccion) a .opencode/agents/ y .opencode/skills/ en el destino.
function copyAgentsAndSkills(destDir, copied) {
  const agentFiles = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'));
  for (const file of agentFiles) {
    writeFile(`.opencode/agents/${file}`, fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8'), destDir, copied);
  }

  const skillNames = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  for (const skillName of skillNames) {
    const src = path.join(SKILLS_DIR, skillName, 'SKILL.md');
    writeFile(`.opencode/skills/${skillName}/SKILL.md`, fs.readFileSync(src, 'utf8'), destDir, copied);
  }
}

function scaffold(destDir) {
  const copied = [];

  copyAgentsAndSkills(destDir, copied);
  writeFile('opencode.json', buildOpencodeJson(AGENTS_DIR), destDir, copied);
  writeFile('.opencode/.gitignore', OPENCODE_GITIGNORE_CONTENT, destDir, copied);
  writeFile('.opencode/package.json', packageJsonContent, destDir, copied);
  writeFile('.opencode/package-lock.json', packageLockJsonContent, destDir, copied);

  return { copied };
}

function describeStructure() {
  return [
    { path: '.opencode/agents/*.md', note: 'Agentes del pipeline (leader incluido, mode: primary)' },
    { path: '.opencode/skills/*/SKILL.md', note: 'Skills tecnologicas (autocarga nativa de opencode)' },
    { path: 'opencode.json', note: 'default_agent, mapa de agentes e instructions (generado)' },
  ];
}

module.exports = {
  id: 'opencode',
  label: 'opencode',
  detectBinary: 'opencode',
  status: 'supported',
  usageHint: 'Corre "opencode" en el directorio para iniciar la fase de inception',
  usesAgentsMd: true,
  describeStructure,
  gitignoreNotes: ['# .opencode/node_modules queda cubierto por .opencode/.gitignore (copiado junto con la plantilla).'],
  // Claude Code primero (mecanismo mas preciso, confirmado empiricamente); opencode
  // como fallback (ver bin/lib/track/collect.js).
  trackingSource: {
    priority: 10,
    collect: (projectDir) => collectOpencodeTokens(projectDir, {}),
  },
  scaffold,
};
