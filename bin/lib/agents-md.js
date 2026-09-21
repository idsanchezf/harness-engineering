'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { parseAgentFile } = require('./agent-frontmatter');

// AGENTS.md depende del CONJUNTO de providers seleccionados en la corrida (que CLIs
// lo leen, cual necesita el bloque del leader), no de un provider individual — por
// eso vive en un modulo compartido en vez de que cada provider lo escriba por su
// cuenta. Un provider participa via dos hooks opcionales en su propia interfaz
// (providers/*.js): `describeStructure()` (informativo, cualquiera puede declararlo)
// y `usesAgentsMd`/`needsAgentsMdLeaderBlock` + `buildAgentsMdLeaderBlock(parsedLeader)`
// (solo quien lo necesite). Esto preserva "agregar CLI nuevo = un archivo en
// providers/ + registrarlo", sin tocar este modulo ni cli.js.

function renderStructureTable(selectedProviders) {
  const rows = [];
  for (const provider of selectedProviders) {
    if (typeof provider.describeStructure !== 'function') continue;
    for (const entry of provider.describeStructure()) {
      rows.push(`| ${provider.label} | \`${entry.path}\` | ${entry.note} |`);
    }
  }
  if (rows.length === 0) return '';
  return ['| CLI | Ruta | Contenido |', '|-----|------|-----------|', ...rows].join('\n');
}

function buildAgentsMd(selectedProviders, { agentsDir }) {
  const sections = [
    '# AGENTS.md',
    '',
    'Este archivo es generado por `@idsanchezf/harness-engineering`. La referencia completa del proceso (pipeline, agentes, comandos, archivo de estado, reglas de git), agnostica al CLI que uses, vive en [`HARNESS.md`](./HARNESS.md) — leelo antes de operar.',
  ];

  const table = renderStructureTable(selectedProviders);
  if (table) {
    sections.push('', '## Estructura', '', table);
  }

  // Solo los providers sin concepto de "agente por defecto" (hoy, Codex) necesitan
  // el bloque completo del leader aqui: es el unico canal que leen automaticamente
  // al iniciar sesion. opencode ya tiene su propio mecanismo (default_agent en
  // opencode.json + mode: primary en .opencode/agents/leader.md).
  const leaderProvider = selectedProviders.find((p) => p.needsAgentsMdLeaderBlock);
  if (leaderProvider) {
    const parsedLeader = parseAgentFile(fs.readFileSync(path.join(agentsDir, 'leader.md'), 'utf8'));
    sections.push('', leaderProvider.buildAgentsMdLeaderBlock(parsedLeader).trimEnd());
  }

  sections.push('');
  return sections.join('\n');
}

// El archivo se reescribe entero en cada corrida (no es contenido de usuario como
// CLAUDE.md, ya se sobrescribia por completo antes de esta refactorizacion).
function writeAgentsMd(destDir, selectedProviders, { agentsDir }) {
  if (!selectedProviders.some((p) => p.usesAgentsMd)) return { copied: [] };
  fs.writeFileSync(path.join(destDir, 'AGENTS.md'), buildAgentsMd(selectedProviders, { agentsDir }), 'utf8');
  return { copied: ['AGENTS.md'] };
}

module.exports = { buildAgentsMd, writeAgentsMd };
