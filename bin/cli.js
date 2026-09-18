#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const pc = require('picocolors');

const pkg = require('../package.json');
const { renderBanner } = require('./lib/banner');
const { detectAll } = require('./lib/detect-agents');
const { PROVIDERS } = require('./lib/providers');
const { ensureGitignore } = require('./lib/gitignore');
const { parseAgentFlag, promptForProviders } = require('./lib/select-providers');

const PACKAGE_ROOT = path.join(__dirname, '..');

const HELP = `
${pc.bold('harness-engineering')} - scaffolding de la plantilla de agentes IA (opencode + Claude Code)

Uso:
  npx @idsanchezf/harness-engineering [directorio] [opciones]

Opciones:
  --agent <id>    CLI(s) a instalar: opencode, claude, o "opencode,claude" (o "all"). Sin esta
                  opcion, en terminal interactiva se pregunta; si no, se instalan todos.
  -y, --yes       Continua aunque el directorio destino no este vacio
  -f, --force     Ademas de --yes, permite sobrescribir un .harness-state.json con progreso real
  -v, --version   Muestra la version
  -h, --help      Muestra esta ayuda
`;

function parseArgs(argv) {
  const flags = { yes: false, force: false, help: false, version: false, agent: null };
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-y':
      case '--yes':
        flags.yes = true;
        break;
      case '-f':
      case '--force':
        flags.force = true;
        flags.yes = true;
        break;
      case '-h':
      case '--help':
        flags.help = true;
        break;
      case '-v':
      case '--version':
        flags.version = true;
        break;
      case '--agent':
        flags.agent = argv[++i] || '';
        break;
      default:
        positional.push(arg);
    }
  }

  return { destDir: positional[0] || '.', flags };
}

function isPristineState(statePath) {
  try {
    const raw = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    return (
      !raw.project &&
      raw.inception &&
      raw.inception.status === 'pending' &&
      Array.isArray(raw.features) &&
      raw.features.length === 0
    );
  } catch {
    return false;
  }
}

function isDirEmpty(dir) {
  if (!fs.existsSync(dir)) return true;
  return fs.readdirSync(dir).length === 0;
}

async function resolveSelectedProviders(flags) {
  if (flags.agent !== null) {
    return parseAgentFlag(flags.agent, PROVIDERS);
  }
  if (flags.yes || !process.stdin.isTTY) {
    return PROVIDERS.filter((provider) => provider.status === 'supported');
  }
  return promptForProviders(PROVIDERS);
}

async function main() {
  const { destDir, flags } = parseArgs(process.argv.slice(2));

  if (flags.version) {
    console.log(pkg.version);
    return;
  }

  const detected = detectAll(PROVIDERS);
  console.log(renderBanner({ version: pkg.version, providers: PROVIDERS, detected }));
  console.log('');

  if (flags.help) {
    console.log(HELP);
    return;
  }

  let selectedProviders;
  try {
    selectedProviders = await resolveSelectedProviders(flags);
  } catch (err) {
    console.error(pc.red(err.message));
    process.exitCode = 1;
    return;
  }

  console.log(pc.dim(`CLI(s) seleccionado(s): ${selectedProviders.map((p) => p.label).join(', ')}`));
  console.log('');

  const dest = path.resolve(process.cwd(), destDir);

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  } else if (!isDirEmpty(dest) && !flags.yes) {
    console.error(pc.red(`El directorio "${dest}" no esta vacio.`));
    console.error('Usa --yes para continuar de todas formas, o --force para sobrescribir el estado existente.');
    process.exitCode = 1;
    return;
  }

  const statePath = path.join(dest, '.harness-state.json');
  const hasExistingState = fs.existsSync(statePath);
  const existingIsPristine = hasExistingState ? isPristineState(statePath) : true;

  if (hasExistingState && !existingIsPristine && !flags.force) {
    console.error(pc.red('Se detecto un .harness-state.json con progreso real (inception/features) en el destino.'));
    console.error('No se sobrescribe sin --force, para no perder el estado del proyecto.');
    process.exitCode = 1;
    return;
  }

  try {
    let totalCopied = 0;

    // Comunes a cualquier CLI seleccionado: AGENTS.md (referencia del pipeline,
    // leida tanto por opencode.json como por CLAUDE.md) y templates/ (artefactos
    // que consumen los agentes/subagentes sea cual sea el runtime).
    fs.cpSync(path.join(PACKAGE_ROOT, 'AGENTS.md'), path.join(dest, 'AGENTS.md'), { force: true });
    fs.cpSync(path.join(PACKAGE_ROOT, 'templates'), path.join(dest, 'templates'), { recursive: true, force: true });
    totalCopied += 2;

    for (const provider of selectedProviders) {
      const { copied } = provider.scaffold(dest);
      totalCopied += copied.length;
    }
    fs.copyFileSync(path.join(PACKAGE_ROOT, '.harness-state.json'), statePath);
    totalCopied += 1;
    const gitignoreResult = ensureGitignore(dest);

    console.log(pc.green(`Plantilla copiada a ${dest}`));
    console.log(pc.dim(`  ${totalCopied} entradas escritas · .gitignore ${gitignoreResult}`));
    console.log('');

    const steps = [`cd "${destDir}"`];
    for (const provider of selectedProviders) {
      if (!detected[provider.id]) {
        steps.push(`Instala ${provider.label} (no se detecto en tu PATH)`);
      }
    }
    for (const provider of selectedProviders) {
      if (provider.usageHint) steps.push(provider.usageHint);
    }
    steps.push('Lee AGENTS.md para el detalle completo del pipeline');

    console.log(pc.bold('Proximos pasos:'));
    steps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
  } catch (err) {
    console.error(pc.red(`Error copiando la plantilla: ${err.message}`));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(pc.red(`Error inesperado: ${err.message}`));
  process.exitCode = 1;
});
