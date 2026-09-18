'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { collect } = require('./collect');
const { buildDashboardData } = require('./dashboard-data');
const { renderDashboardHtml } = require('./render-html');

const DEFAULT_DASHBOARD_PATH = 'docs/tracking/dashboard.html';

function parseTrackArgs(argv) {
  // argv ya sin 'track' (bin/cli.js lo consume antes de delegar aca)
  const args = { subcommand: argv[0], hu: null, feature: null, out: null };
  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === '--hu') args.hu = argv[++i];
    else if (argv[i] === '--feature') args.feature = argv[++i];
    else if (argv[i] === '--out') args.out = argv[++i];
  }
  return args;
}

function runCollect(args, projectDir) {
  const result = collect({ projectDir, hu: args.hu, feature: args.feature });
  console.log(JSON.stringify(result, null, 2));
}

function runDashboard(args, projectDir) {
  const data = buildDashboardData(projectDir);
  const html = renderDashboardHtml(data);
  const outPath = path.resolve(projectDir, args.out || DEFAULT_DASHBOARD_PATH);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');

  console.log(JSON.stringify({ ok: true, outPath, features: data.features.length, coverage: data.totals.coverage }, null, 2));
}

function run(argv) {
  const args = parseTrackArgs(argv);
  const projectDir = process.cwd();

  try {
    if (args.subcommand === 'collect') {
      runCollect(args, projectDir);
    } else if (args.subcommand === 'dashboard') {
      runDashboard(args, projectDir);
    } else {
      console.error(`Subcomando desconocido: "${args.subcommand}". Uso: track collect [--hu F001:US-001 | --feature F001] | track dashboard [--out docs/tracking/dashboard.html]`);
      process.exitCode = 1;
    }
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: err.message }));
    process.exitCode = 1;
  }
}

module.exports = { run, parseTrackArgs };
