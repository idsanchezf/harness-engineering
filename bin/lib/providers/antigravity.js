'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { parseAgentFile } = require('../agent-frontmatter');
const { adaptBody } = require('./adapt-body');
const { AGENTS_DIR, SKILLS_DIR } = require('../source-paths');

// Investigado en esta sesion (antigravity.google/docs/subagents, /docs/skills,
// /docs/rules, /docs/agent-settings): Google Antigravity (app de escritorio 2.0 y CLI
// `agy`) define agentes propios en `.agents/agents/<name>.md` — markdown con
// frontmatter YAML (name, description, tools, mainAgent, subagent, model,
// commandExecutionPolicy). Las skills viven en `.agents/skills/<name>/SKILL.md` y se
// autocargan por su description. AGENTS.md en la raiz se mantiene siempre activo.
//
// A diferencia de Claude Code y Codex, Antigravity SI tiene concepto de agente
// principal (`mainAgent: true`, seleccionable en el desplegable o con
// `agy --agent leader`), asi que el leader se genera como un agente mas en vez de
// inyectarse en AGENTS.md — AGENTS.md le llegaria tambien a cada subagente. Lo que no
// existe es un agente por defecto por proyecto: hay que elegir `leader` al abrirlo.
const ANTIGRAVITY_AGENTS_DIR = '.agents/agents';
const ANTIGRAVITY_SKILLS_DIR = '.agents/skills';

const DELEGATION_NOTE =
  '> En Antigravity, delegar en un subagente (lo que este documento llama `Task`) se hace con la herramienta `invoke_subagent`.';

function adaptBodyForAntigravity(body) {
  return adaptBody(body, {
    agentsDir: ANTIGRAVITY_AGENTS_DIR,
    skillsDir: ANTIGRAVITY_SKILLS_DIR,
    autoloadPhrase: 'cargan **automaticamente** cuando su description coincide con el contexto',
  });
}

// Mapeo de mejor esfuerzo, mismo espiritu que mapToolsForClaude en providers/claude.js:
//   - edit: "allow" -> herramientas de escritura; edit: "ask" -> solo lectura + comandos.
//   - task: "allow" (leader, inception) -> invoke_subagent. Se usa el permiso declarado
//     en el frontmatter fuente en vez de una lista hardcodeada de agentes.
function mapToolsForAntigravity(parsed) {
  const tools = ['view_file', 'grep_search', 'list_dir', 'run_command'];
  if (parsed.edit === 'allow') tools.push('write_to_file', 'replace_file_content');
  if (parsed.task === 'allow') tools.push('invoke_subagent');
  return tools;
}

// commandExecutionPolicy: "off" ("Request Review") pide aprobacion en cada comando salvo
// la allow list del usuario — la traduccion fiel de `bash: "*": ask`. El default de
// Antigravity ("sandbox") corre sin red, lo que rompe git push / gh / npx. Los patrones
// por comando de opencode (ej. `git *: allow`) no se pueden expresar por agente: van en
// la allow list global de Antigravity.
function buildAntigravityAgentFile(name, parsed) {
  const isMain = parsed.mode === 'primary';
  const lines = [
    '---',
    `name: ${name}`,
    // JSON.stringify produce un string YAML valido entre comillas dobles: varias
    // descripciones llevan ":" o backticks que romperian un escalar plano.
    `description: ${JSON.stringify(parsed.description)}`,
    'tools:',
    ...mapToolsForAntigravity(parsed).map((tool) => `  - ${tool}`),
    `mainAgent: ${isMain}`,
    `subagent: ${!isMain}`,
    'commandExecutionPolicy: off',
    '---',
    '',
  ];
  const body = adaptBodyForAntigravity(parsed.body);
  const withNote = parsed.task === 'allow' ? `${DELEGATION_NOTE}\n\n${body.trimStart()}` : body;
  return lines.join('\n') + withNote + '\n';
}

function copySkills(destDir) {
  const copied = [];
  const skillNames = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const skillName of skillNames) {
    const src = path.join(SKILLS_DIR, skillName, 'SKILL.md');
    const dest = path.join(destDir, '.agents', 'skills', skillName, 'SKILL.md');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    copied.push(`.agents/skills/${skillName}/SKILL.md`);
  }

  return copied;
}

function scaffold(destDir) {
  const copied = [...copySkills(destDir)];

  const agentFiles = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md'));

  for (const file of agentFiles) {
    const name = path.basename(file, '.md');
    const parsed = parseAgentFile(fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8'));

    const destPath = path.join(destDir, '.agents', 'agents', `${name}.md`);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buildAntigravityAgentFile(name, parsed), 'utf8');
    copied.push(`.agents/agents/${name}.md`);
  }

  return { copied };
}

function describeStructure() {
  return [
    { path: '.agents/agents/*.md', note: 'Agentes: `leader` es el agente principal (elegirlo al abrir), el resto son subagentes' },
    { path: '.agents/skills/*/SKILL.md', note: 'Skills tecnologicas (autocarga nativa por description)' },
  ];
}

module.exports = {
  id: 'antigravity',
  label: 'antigravity',
  detectBinary: 'agy',
  status: 'supported',
  usageHint: 'Abre el directorio con Antigravity y elige el agente `leader` (o `agy --agent leader` desde la terminal)',
  usesAgentsMd: true,
  describeStructure,
  // Sin fuente de uso de tokens investigada: las fases quedan como
  // tokensSource: "unavailable", igual que con Codex.
  trackingSource: null,
  scaffold,
  buildAntigravityAgentFile,
};
