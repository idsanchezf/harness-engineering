'use strict';

const { execFileSync } = require('node:child_process');

// Fuente de tokens para opencode. v1 usa unicamente `opencode stats` (comando
// documentado oficialmente: "Show token usage and cost statistics for your OpenCode
// sessions"). `opencode export <sessionID>` existe y devuelve la sesion completa como
// JSON (mas preciso, analogo al transcript de Claude Code), pero su schema exacto no
// se confirmo empiricamente — queda deshabilitado hasta verificarlo, para no arriesgar
// un parseo incorrecto silencioso.
//
// Limitacion conocida: `opencode stats` es agregado (no acepta una ventana de tiempo
// arbitraria, solo `--days N`), asi que la atribucion a una fase especifica es mucho
// menos precisa que la de Claude Code. Se documenta explicitamente en el resultado.
function collectOpencodeTokens(projectDir, { days = 1 } = {}) {
  let raw;
  try {
    raw = execFileSync('opencode', ['stats', '--days', String(days), '--project', projectDir], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (err) {
    return {
      tokens: null,
      source: 'unavailable',
      sessionsMatched: [],
      warnings: [`no se pudo ejecutar "opencode stats": ${err.message}`],
    };
  }

  const parsed = parseStatsOutput(raw);
  if (!parsed) {
    return {
      tokens: null,
      source: 'unavailable',
      sessionsMatched: [],
      warnings: ['no se pudo interpretar la salida de "opencode stats" (formato inesperado o sin datos para el rango solicitado)'],
    };
  }

  return {
    tokens: parsed.tokens,
    source: 'opencode-stats',
    sessionsMatched: [{ cli: 'opencode', sessionId: null, tokens: parsed.tokens.total }],
    costUsd: parsed.costUsd,
    warnings: [
      `atribucion aproximada: "opencode stats --days ${days}" agrega TODO el uso del proyecto en ese rango de dias, no solo el de esta fase especifica`,
    ],
  };
}

// Best-effort: `opencode stats` no tiene un modo --json documentado al momento de
// escribir esto, asi que se busca un patron de texto razonable ("Input: 12,345",
// "Output: 6,789", "$1.23"). Si el formato de salida cambia, esto debe degradar a
// null, nunca inventar un numero.
function parseStatsOutput(raw) {
  const inputMatch = raw.match(/input[^\d]*([\d,]+)/i);
  const outputMatch = raw.match(/output[^\d]*([\d,]+)/i);
  const costMatch = raw.match(/\$([\d.]+)/);

  if (!inputMatch && !outputMatch) return null;

  const input = inputMatch ? parseInt(inputMatch[1].replace(/,/g, ''), 10) : 0;
  const output = outputMatch ? parseInt(outputMatch[1].replace(/,/g, ''), 10) : 0;

  return {
    tokens: { input, output, cacheCreationInput: 0, cacheReadInput: 0, total: input + output },
    costUsd: costMatch ? parseFloat(costMatch[1]) : null,
  };
}

module.exports = { collectOpencodeTokens, parseStatsOutput };
