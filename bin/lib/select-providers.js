'use strict';

const readline = require('node:readline/promises');
const pc = require('picocolors');

function supportedOf(providers) {
  return providers.filter((p) => p.status === 'supported');
}

// Parsea el valor de --agent (ej. "opencode", "claude", "opencode,claude", "all").
// Lanza un error con mensaje claro si algun id no es valido — cli.js lo captura y
// lo reporta sin stack trace.
function parseAgentFlag(value, providers) {
  const supported = supportedOf(providers);
  const normalized = (value || '').trim().toLowerCase();

  if (!normalized || normalized === 'all') return supported;

  const ids = normalized
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const selected = [];
  const invalid = [];

  for (const id of ids) {
    const match = supported.find((p) => p.id === id);
    if (!match) {
      invalid.push(id);
    } else if (!selected.includes(match)) {
      selected.push(match);
    }
  }

  if (invalid.length > 0) {
    const validIds = supported.map((p) => p.id).join(', ');
    throw new Error(`--agent: "${invalid.join(', ')}" no es valido. Opciones: ${validIds}, all`);
  }

  return selected;
}

// Prompt interactivo estilo "selecciona tu personaje" (solo se usa si no se paso
// --agent, hay mas de un CLI soportado, y stdin es una terminal interactiva real).
async function promptForProviders(providers) {
  const supported = supportedOf(providers);
  if (supported.length <= 1) return supported;

  const allIndex = supported.length + 1;

  console.log(pc.bold(pc.yellow('★ SELECCIONA TU CLI ★')));
  console.log('');
  supported.forEach((provider, i) => {
    console.log(`  ${pc.cyan(`[${i + 1}]`)} ${provider.label}`);
  });
  console.log(`  ${pc.cyan(`[${allIndex}]`)} Todos (${supported.map((p) => p.label).join(' + ')})`);
  console.log('');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let answer;
  try {
    answer = await rl.question(pc.dim(`Elige una opcion [${allIndex}]: `));
  } finally {
    rl.close();
  }

  const trimmed = answer.trim();
  if (!trimmed) return supported;

  const choices = trimmed
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n));

  if (choices.includes(allIndex)) return supported;

  const selected = choices.map((n) => supported[n - 1]).filter(Boolean);
  return selected.length > 0 ? selected : supported;
}

module.exports = { parseAgentFlag, promptForProviders };
