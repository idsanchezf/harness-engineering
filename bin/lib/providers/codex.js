'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { parseAgentFile } = require('../agent-frontmatter');
const { adaptBody } = require('./adapt-body');
const { serializeAgentToml } = require('./toml');
const { AGENTS_DIR, SKILLS_DIR } = require('../source-paths');

// Investigado en esta sesion (developers.openai.com/codex, redirige a
// learn.chatgpt.com/docs/...): Codex CLI soporta subagentes por proyecto en
// `.codex/agents/*.toml` (formato TOML, campos requeridos name/description/
// developer_instructions, mas sandbox_mode opcional read-only|workspace-write).
// Codex NO tiene concepto de "agente por defecto de proyecto" (igual que Claude
// Code) — el unico canal que lee automaticamente al iniciar sesion es AGENTS.md.
//
// Limitacion conocida (runtime, no bloquea el scaffolding): la documentacion oficial
// no describe una auto-delegacion confiable a subagentes; el disparador principal es
// prompting manual guiado por AGENTS.md. Se documenta en HARNESS.md/README.
const CODEX_AGENTS_DIR = '.codex/agents';
const CODEX_SKILLS_DIR = '.codex/skills';

const AGENTS_MD_START_MARKER = '<!-- harness-engineering:leader:codex:start -->';
const AGENTS_MD_END_MARKER = '<!-- harness-engineering:leader:codex:end -->';

function adaptBodyForCodex(body) {
  return adaptBody(body, {
    agentsDir: CODEX_AGENTS_DIR,
    skillsDir: CODEX_SKILLS_DIR,
    autoloadPhrase:
      'NO se cargan automaticamente en Codex (sin mecanismo nativo de autocarga de skills); quedan disponibles como referencia',
  });
}

// Mapeo best-effort: Codex no tiene permisos granulares por patron de comando bash a
// nivel de agente individual (solo sandbox_mode, mas coarse) — mismo espiritu que
// mapToolsForClaude en providers/claude.js.
function sandboxModeFor(parsed) {
  return parsed.edit === 'ask' ? 'read-only' : 'workspace-write';
}

function copySkills(destDir) {
  const copied = [];
  const skillNames = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const skillName of skillNames) {
    const src = path.join(SKILLS_DIR, skillName, 'SKILL.md');
    const dest = path.join(destDir, '.codex', 'skills', skillName, 'SKILL.md');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    copied.push(`.codex/skills/${skillName}/SKILL.md`);
  }

  return copied;
}

function scaffold(destDir) {
  const copied = [...copySkills(destDir)];

  const agentFiles = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'));

  for (const file of agentFiles) {
    const name = path.basename(file, '.md');
    const raw = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
    const parsed = parseAgentFile(raw);

    if (parsed.mode === 'primary') {
      // El leader no genera un .toml individual (Codex no tiene agente por defecto):
      // sus instrucciones se inyectan en AGENTS.md (ver buildAgentsMdLeaderBlock).
      continue;
    }

    const toml = serializeAgentToml({
      name,
      description: parsed.description,
      developerInstructions: adaptBodyForCodex(parsed.body),
      sandboxMode: sandboxModeFor(parsed),
    });

    const destPath = path.join(destDir, '.codex', 'agents', `${name}.toml`);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, toml, 'utf8');
    copied.push(`.codex/agents/${name}.toml`);
  }

  return { copied };
}

function buildAgentsMdLeaderBlock(parsedLeader) {
  return [
    AGENTS_MD_START_MARKER,
    '',
    '# Harness Engineering — rol de orquestador (Codex)',
    '',
    'Codex no tiene concepto de agente por defecto de proyecto; las instrucciones siguientes definen tu rol de orquestador al iniciar sesion en este repo. Equivalen al agente `leader` (mode: primary) de opencode. El detalle completo de comandos, estados y reglas de git vive en `HARNESS.md` — leelo antes de operar.',
    '',
    adaptBodyForCodex(parsedLeader.body),
    '',
    AGENTS_MD_END_MARKER,
    '',
  ].join('\n');
}

function describeStructure() {
  return [
    { path: '.codex/agents/*.toml', note: 'Subagentes (el leader vive en AGENTS.md, no como archivo)' },
    { path: '.codex/skills/*/SKILL.md', note: 'Skills tecnologicas (referencia; Codex no las autocarga)' },
    { path: 'AGENTS.md', note: 'Incluye el rol de orquestador del leader' },
  ];
}

module.exports = {
  id: 'codex',
  label: 'codex',
  detectBinary: 'codex',
  status: 'supported',
  usageHint: 'Abre el directorio con Codex CLI: el rol de orquestador ya esta cargado en AGENTS.md',
  usesAgentsMd: true,
  needsAgentsMdLeaderBlock: true,
  describeStructure,
  buildAgentsMdLeaderBlock,
  // No se investigo un mecanismo de logs/transcript de Codex en esta sesion; el
  // sistema ya soporta tokensSource: "unavailable" para este caso.
  trackingSource: null,
  scaffold,
};
