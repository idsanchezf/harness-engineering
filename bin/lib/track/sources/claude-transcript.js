'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// Codifica una ruta absoluta al mismo esquema que usa Claude Code para nombrar la
// carpeta de un proyecto bajo ~/.claude/projects/ — confirmado empiricamente (no es
// una suposicion): cada caracter que no sea alfanumerico ni guion se reemplaza por un
// guion. Ej: "C:\@idsanchezf\harness-engineering" -> "C---idsanchezf-harness-engineering".
function encodeProjectPath(absPath) {
  return absPath.replace(/[^a-zA-Z0-9-]/g, '-');
}

function claudeProjectsDir() {
  return path.join(os.homedir(), '.claude', 'projects');
}

// Estructura real (confirmada en esta misma sesion): cada invocacion de subagente
// (Task tool) escribe su propio archivo aislado en:
//   <projectsDir>/<encoded>/<sessionId>/subagents/agent-{agentId}.jsonl
// con un {agentId}.meta.json hermano (agentType, description, spawnDepth, ...).
function findSubagentFiles(projectDir) {
  const encoded = encodeProjectPath(projectDir);
  const base = path.join(claudeProjectsDir(), encoded);
  const results = [];

  if (!fs.existsSync(base)) return results;

  for (const sessionEntry of fs.readdirSync(base, { withFileTypes: true })) {
    if (!sessionEntry.isDirectory()) continue;
    const subagentsDir = path.join(base, sessionEntry.name, 'subagents');
    if (!fs.existsSync(subagentsDir)) continue;

    for (const file of fs.readdirSync(subagentsDir)) {
      if (!file.endsWith('.jsonl')) continue;
      const jsonlPath = path.join(subagentsDir, file);
      const metaPath = jsonlPath.replace(/\.jsonl$/, '.meta.json');
      let meta = null;
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      } catch {
        meta = null;
      }
      const agentId = path.basename(file, '.jsonl').replace(/^agent-/, '');
      results.push({ jsonlPath, meta, agentId, sessionId: sessionEntry.name });
    }
  }

  return results;
}

// Lectura defensiva linea-por-linea: una linea corrupta o de un formato inesperado
// nunca debe tirar abajo todo el parseo (el formato es interno de Claude Code y puede
// cambiar entre versiones).
function readUsageAndRange(jsonlPath) {
  const totals = { input: 0, output: 0, cacheCreationInput: 0, cacheReadInput: 0 };
  let firstTimestamp = null;
  let lastTimestamp = null;
  let matchedAny = false;

  let raw;
  try {
    raw = fs.readFileSync(jsonlPath, 'utf8');
  } catch {
    return { totals, firstTimestamp, lastTimestamp, matchedAny };
  }

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    if (entry.timestamp) {
      if (!firstTimestamp || entry.timestamp < firstTimestamp) firstTimestamp = entry.timestamp;
      if (!lastTimestamp || entry.timestamp > lastTimestamp) lastTimestamp = entry.timestamp;
    }

    const usage = entry.message && entry.message.usage;
    if (usage) {
      matchedAny = true;
      totals.input += usage.input_tokens || 0;
      totals.output += usage.output_tokens || 0;
      totals.cacheCreationInput += usage.cache_creation_input_tokens || 0;
      totals.cacheReadInput += usage.cache_read_input_tokens || 0;
    }
  }

  return { totals, firstTimestamp, lastTimestamp, matchedAny };
}

function descriptionMatches(description, expectedTokens) {
  if (!description) return false;
  const normalized = description.toLowerCase();
  return expectedTokens.every((token) => normalized.includes(String(token).toLowerCase()));
}

function windowsOverlap(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart <= bEnd && bStart <= aEnd;
}

// Busca tokens de Claude Code para una fase/tarea especifica.
//   projectDir: directorio del proyecto (cwd de quien invoca `track`)
//   expectedTokens: partes que deben aparecer en la `description` del Task que hizo
//     el leader al delegar (convencion documentada en leader.md), ej. ['develop', 'F001', 'US-001']
//   window: { startedAt, completedAt } de la fase/tarea, usado como fallback si no hay
//     match por description (y como cross-check informativo)
function collectClaudeTokens(projectDir, expectedTokens, window) {
  const files = findSubagentFiles(projectDir);
  if (files.length === 0) {
    return {
      tokens: null,
      source: 'unavailable',
      sessionsMatched: [],
      warnings: ['no se encontraron transcripts de subagentes de Claude Code para este proyecto'],
    };
  }

  let matched = files.filter((f) => descriptionMatches(f.meta && f.meta.description, expectedTokens));
  let matchedBy = 'description';

  if (matched.length === 0 && window && window.startedAt && window.completedAt) {
    matchedBy = 'time-window';
    matched = files.filter((f) => {
      const { firstTimestamp, lastTimestamp } = readUsageAndRange(f.jsonlPath);
      return windowsOverlap(window.startedAt, window.completedAt, firstTimestamp, lastTimestamp);
    });
  }

  if (matched.length === 0) {
    return {
      tokens: null,
      source: 'unavailable',
      sessionsMatched: [],
      warnings: [`ningun transcript de subagente coincidio (ni por description ni por ventana de tiempo) para: ${expectedTokens.join(' ')}`],
    };
  }

  const totals = { input: 0, output: 0, cacheCreationInput: 0, cacheReadInput: 0 };
  const sessionsMatched = [];
  const warnings = [];

  if (matched.length > 1) {
    warnings.push(`se encontraron ${matched.length} transcripts que coinciden (matched por ${matchedBy}) para "${expectedTokens.join(' ')}" — sumando todos, revisar si corresponde`);
  }

  for (const file of matched) {
    const { totals: fileTotals, matchedAny } = readUsageAndRange(file.jsonlPath);
    if (!matchedAny) continue;
    const fileTotal = fileTotals.input + fileTotals.output + fileTotals.cacheCreationInput + fileTotals.cacheReadInput;
    totals.input += fileTotals.input;
    totals.output += fileTotals.output;
    totals.cacheCreationInput += fileTotals.cacheCreationInput;
    totals.cacheReadInput += fileTotals.cacheReadInput;
    sessionsMatched.push({ cli: 'claude', agentId: file.agentId, tokens: fileTotal });
  }

  const total = totals.input + totals.output + totals.cacheCreationInput + totals.cacheReadInput;
  if (total === 0) {
    return {
      tokens: null,
      source: 'unavailable',
      sessionsMatched: [],
      warnings: [...warnings, 'los transcripts encontrados no traian datos de uso (usage)'],
    };
  }

  return {
    tokens: { input: totals.input, output: totals.output, cacheCreationInput: totals.cacheCreationInput, cacheReadInput: totals.cacheReadInput, total },
    source: 'claude-transcript',
    sessionsMatched,
    costUsd: null,
    warnings,
  };
}

module.exports = {
  encodeProjectPath,
  claudeProjectsDir,
  findSubagentFiles,
  readUsageAndRange,
  descriptionMatches,
  windowsOverlap,
  collectClaudeTokens,
};
