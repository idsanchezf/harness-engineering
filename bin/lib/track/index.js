'use strict';

const { collect } = require('./collect');

function parseTrackArgs(argv) {
  // argv ya sin 'track' (bin/cli.js lo consume antes de delegar aca)
  const args = { subcommand: argv[0], hu: null, feature: null };
  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === '--hu') args.hu = argv[++i];
    else if (argv[i] === '--feature') args.feature = argv[++i];
  }
  return args;
}

function run(argv) {
  const args = parseTrackArgs(argv);
  const projectDir = process.cwd();

  if (args.subcommand !== 'collect') {
    console.error(`Subcomando desconocido: "${args.subcommand}". Uso: track collect [--hu F001:US-001 | --feature F001]`);
    process.exitCode = 1;
    return;
  }

  try {
    const result = collect({ projectDir, hu: args.hu, feature: args.feature });
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: err.message }));
    process.exitCode = 1;
  }
}

module.exports = { run, parseTrackArgs };
