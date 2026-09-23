'use strict';

const fs = require('node:fs');

const store = require('./store');
const inception = require('./inception');
const feature = require('./feature');
const hu = require('./hu');
const hitl = require('./hitl');
const tasks = require('./tasks');
const tracking = require('./tracking');

// argv ya sin 'state' (bin/cli.js lo consume antes de delegar aca). Convencion de
// argumentos: `{noun} {verb} {posicionales...} [--flag valor]*`, ej.
// `hu phase-start F001 US-001 develop`, `feature block F001 --motivo "..."`.
function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function output(result) {
  console.log(JSON.stringify(result, null, 2));
}

function handleInception(verb, positional) {
  switch (verb) {
    case 'start':
      return output(inception.start(process.cwd()));
    case 'complete':
      return output(inception.complete(process.cwd()));
    case 'status':
      return output(inception.status(process.cwd()));
    case 'phase-start':
      return output(inception.phaseStart(process.cwd(), positional[0]));
    case 'phase-complete':
      return output(inception.phaseComplete(process.cwd(), positional[0]));
    case 'phase-status':
      return output(inception.phaseStatus(process.cwd(), positional[0]));
    default:
      throw new Error(`inception: subcomando desconocido "${verb}"`);
  }
}

function handleFeature(verb, positional, flags) {
  const projectDir = process.cwd();
  switch (verb) {
    case 'register':
      return output(
        feature.register(projectDir, {
          id: flags.id,
          name: flags.name,
          slug: flags.slug,
          description: flags.description,
          branch: flags.branch,
        })
      );
    case 'phase-start':
      return output(feature.phaseStart(projectDir, positional[0], positional[1]));
    case 'phase-complete':
      return output(feature.phaseComplete(projectDir, positional[0], positional[1]));
    case 'block':
      return output(feature.block(projectDir, positional[0], flags.motivo));
    case 'mark-in-review':
      return output(feature.markInReview(projectDir, positional[0], flags['pr-url']));
    case 'mark-done':
      return output(feature.markDone(projectDir, positional[0]));
    case 'show':
      return output(feature.show(projectDir, positional[0]));
    default:
      throw new Error(`feature: subcomando desconocido "${verb}"`);
  }
}

function handleHu(verb, positional, flags) {
  const projectDir = process.cwd();
  switch (verb) {
    case 'create':
      return output(hu.create(projectDir, positional[0], positional[1], positional.slice(2).join(' ')));
    case 'phase-start':
      return output(hu.phaseStart(projectDir, positional[0], positional[1], positional[2]));
    case 'phase-complete':
      return output(hu.phaseComplete(projectDir, positional[0], positional[1], positional[2]));
    case 'block':
      return output(hu.block(projectDir, positional[0], positional[1], flags.motivo));
    case 'mark-started':
      return output(hu.markStarted(projectDir, positional[0], positional[1], flags.branch));
    case 'mark-in-review':
      return output(hu.markInReview(projectDir, positional[0], positional[1], flags['pr-url']));
    case 'mark-done':
      return output(hu.markDone(projectDir, positional[0], positional[1]));
    default:
      throw new Error(`hu: subcomando desconocido "${verb}"`);
  }
}

function handleHitl(verb, positional, flags) {
  const projectDir = process.cwd();
  switch (verb) {
    case 'enable':
      return output(hitl.enable(projectDir));
    case 'disable':
      return output(hitl.disable(projectDir));
    case 'status':
      return output(hitl.status(projectDir));
    case 'approve':
      if (positional[0] === 'inception') return output(hitl.approveInception(projectDir));
      if (positional.length === 2) return output(hitl.approve(projectDir, positional[0], null, positional[1]));
      return output(hitl.approve(projectDir, positional[0], positional[1], positional[2]));
    case 'reject':
      if (positional[0] === 'inception') return output(hitl.rejectInception(projectDir, positional[1], flags.motivo));
      if (positional.length === 2) {
        return output(hitl.reject(projectDir, positional[0], null, positional[1], flags.motivo));
      }
      return output(hitl.reject(projectDir, positional[0], positional[1], positional[2], flags.motivo));
    default:
      throw new Error(`hitl: subcomando desconocido "${verb}"`);
  }
}

function handleTasks(verb, positional) {
  const projectDir = process.cwd();
  switch (verb) {
    case 'list':
      return output(tasks.list(projectDir, positional[0], positional[1]));
    case 'progress':
      return output(tasks.progress(projectDir, positional[0], positional[1]));
    default:
      throw new Error(`tasks: subcomando desconocido "${verb}"`);
  }
}

function handleTask(verb, positional, flags) {
  const projectDir = process.cwd();
  switch (verb) {
    case 'start':
      return output(tasks.taskStart(projectDir, positional[0], positional[1], positional[2]));
    case 'done':
      return output(tasks.taskDone(projectDir, positional[0], positional[1], positional[2]));
    case 'block':
      return output(tasks.taskBlock(projectDir, positional[0], positional[1], positional[2], flags.motivo));
    default:
      throw new Error(`task: subcomando desconocido "${verb}"`);
  }
}

function handleTracking(verb, flags) {
  if (verb !== 'record') throw new Error(`tracking: subcomando desconocido "${verb}"`);
  const dataFile = flags['data-file'];
  if (!dataFile) throw new Error('tracking record requiere --data-file <path>');
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  return output(tracking.record(process.cwd(), data, { version: flags.version }));
}

function run(argv) {
  const [noun, ...restArgv] = argv;
  // Flags pueden aparecer en cualquier posicion despues del noun (`state resume --full`
  // no tiene "verb" real, a diferencia de `state feature block F001 --motivo "..."`) —
  // parsear TODO el resto de una y separar el verb recien despues evita que un flag sea
  // interpretado por error como el verb (bug real: antes `--full` quedaba en `verb` y
  // nunca llegaba a `flags`).
  const { positional: restPositional, flags } = parseArgs(restArgv);
  const [verb, ...positional] = restPositional;
  const projectDir = process.cwd();

  try {
    switch (noun) {
      case 'init':
        output(store.saveState(projectDir, store.initialState()));
        break;
      case 'resume':
      case 'status': {
        const state = store.loadState(projectDir);
        output(flags.full ? state : store.summarizeState(state));
        break;
      }
      case 'list-features': {
        const state = store.loadState(projectDir);
        const filtered = store.filterFeatures(state, { status: flags.status });
        output(
          flags.full
            ? filtered
            : filtered.map((f) => ({ id: f.id, name: f.name ?? null, status: f.status, docsPath: f.docsPath ?? null }))
        );
        break;
      }
      case 'inception':
        handleInception(verb, positional);
        break;
      case 'feature':
        handleFeature(verb, positional, flags);
        break;
      case 'hu':
        handleHu(verb, positional, flags);
        break;
      case 'hitl':
        handleHitl(verb, positional, flags);
        break;
      case 'tasks':
        handleTasks(verb, positional);
        break;
      case 'task':
        handleTask(verb, positional, flags);
        break;
      case 'tracking':
        handleTracking(verb, flags);
        break;
      default:
        throw new Error(`Subcomando desconocido: "${noun}". Ver HARNESS.md para el listado completo de "state <comando>".`);
    }
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: err.message }));
    process.exitCode = 1;
  }
}

module.exports = { run, parseArgs };
