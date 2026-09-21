'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { parseAgentFile } = require('../agent-frontmatter');
const { ensureBlock } = require('../block-file');

const PACKAGE_ROOT = path.join(__dirname, '..', '..', '..');
const AGENTS_DIR = path.join(PACKAGE_ROOT, '.opencode', 'agents');
const SKILLS_DIR = path.join(PACKAGE_ROOT, '.opencode', 'skills');

const CLAUDE_MD_START_MARKER = '<!-- harness-engineering:leader:start -->';
const CLAUDE_MD_END_MARKER = '<!-- harness-engineering:leader:end -->';

// Traduce referencias literales de ruta/nombre especificas de opencode al equivalente
// de Claude Code. El contenido de los agentes es en su mayoria prosa agnostica de
// runtime (describe el PROCESO, no sintaxis de opencode), asi que esto cubre los
// pocos puntos reales de acoplamiento encontrados en .opencode/agents/*.md.
//
// Tambien quita la seccion final "## Permisos y herramientas": en los 10 agentes de
// opencode es siempre la ultima seccion del archivo (verificado), y describe la tabla
// de permisos especifica de opencode (edit/bash granular) que aqui ya se tradujo de
// forma equivalente al frontmatter `tools:` de Claude Code (o, para el lider, no aplica
// en CLAUDE.md ya que la sesion principal no tiene ese mecanismo de restriccion).
function adaptBodyForClaude(body) {
  const withoutPermissionsSection = body.replace(/\n## Permisos y herramientas[\s\S]*$/, '\n');
  return withoutPermissionsSection
    .replaceAll('.opencode/skills/', '.claude/skills/')
    .replaceAll('.opencode/agents/', '.claude/agents/')
    .replace('cargan **automaticamente** por opencode cuando el contexto coincide', 'cargan **automaticamente** cuando el contexto coincide')
    .trimEnd();
}

// Mapeo de mejor esfuerzo, no 1:1: opencode declara permisos granulares por patron de
// comando bash (ej. "git *": allow, "*": ask), algo que el frontmatter de subagentes de
// Claude Code no puede expresar (alli "tools" es una lista de herramientas permitidas,
// no de comandos). Reglas aplicadas:
//   - edit: "ask" (agentes de solo analisis, ej. quality) -> tools explicito sin
//     Write/Edit, para preservar la intencion de "no deberia modificar codigo".
//   - edit: "allow" (el resto) -> se omite `tools` (hereda todas las herramientas del
//     sistema, incluida Task para delegar a otros subagentes) — es la aproximacion mas
//     cercana a la postura de opencode, generalmente permisiva salvo por bash arbitrario.
function mapToolsForClaude(parsed) {
  if (parsed.edit === 'ask') {
    return 'Read, Grep, Glob, Bash';
  }
  return undefined;
}

function buildClaudeAgentFile(name, parsed) {
  const lines = ['---', `name: ${name}`, `description: ${parsed.description}`];
  const tools = mapToolsForClaude(parsed);
  if (tools) lines.push(`tools: ${tools}`);
  lines.push('---', '');
  return lines.join('\n') + adaptBodyForClaude(parsed.body) + '\n';
}

function buildClaudeMdBlock(leaderParsed) {
  return [
    CLAUDE_MD_START_MARKER,
    '',
    '# Harness Engineering — rol de orquestador',
    '',
    'Las instrucciones siguientes definen tu rol por defecto en este proyecto: sos el orquestador unico del pipeline de ingenieria (inception -> analysis/design por feature -> develop/test/quality/deploy por HU), delegando en subagentes puros via la herramienta Task. Equivalen al agente `leader` (mode: primary) de opencode, adaptadas aqui porque Claude Code no tiene el concepto de agente por defecto de proyecto. El detalle completo de comandos, estados y reglas de git vive en `HARNESS.md` — leelo antes de operar.',
    '',
    adaptBodyForClaude(leaderParsed.body),
    '',
    CLAUDE_MD_END_MARKER,
    '',
  ].join('\n');
}

function copySkills(destDir) {
  const copied = [];
  const skillNames = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const skillName of skillNames) {
    const src = path.join(SKILLS_DIR, skillName, 'SKILL.md');
    const dest = path.join(destDir, '.claude', 'skills', skillName, 'SKILL.md');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    copied.push(`.claude/skills/${skillName}/SKILL.md`);
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
      // El agente "primary" de opencode (leader) no tiene equivalente 1:1 en Claude
      // Code (no existe un concepto de "agente por defecto" seleccionable por
      // proyecto): en su lugar, sus instrucciones se inyectan en CLAUDE.md para que
      // la sesion principal de Claude Code adopte ese rol de orquestador por defecto.
      const claudeMdPath = path.join(destDir, 'CLAUDE.md');
      ensureBlock(claudeMdPath, { startMarker: CLAUDE_MD_START_MARKER, block: buildClaudeMdBlock(parsed) });
      copied.push('CLAUDE.md');
      continue;
    }

    const destPath = path.join(destDir, '.claude', 'agents', `${name}.md`);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buildClaudeAgentFile(name, parsed), 'utf8');
    copied.push(`.claude/agents/${name}.md`);
  }

  return { copied };
}

module.exports = {
  id: 'claude',
  label: 'claude',
  detectBinary: 'claude',
  status: 'supported',
  usageHint: 'Abre el directorio con Claude Code: el rol de orquestador ya esta cargado en CLAUDE.md',
  scaffold,
};
