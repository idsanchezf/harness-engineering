'use strict';

const pc = require('picocolors');
const figlet = require('figlet');

const ANSI_REGEX = /\x1b\[[0-9;]*m/g;
const ARCADE_PALETTE = [pc.yellow, pc.magenta, pc.cyan];
const PACMAN = 'ᗧ';
const CONTENT_MARGIN = 4;

function visibleLength(str) {
  return str.replace(ANSI_REGEX, '').length;
}

function center(text, width) {
  const pad = Math.max(0, width - visibleLength(text));
  const left = Math.floor(pad / 2);
  const right = pad - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}

function buildTitleLines() {
  const raw = figlet.textSync('HARNESS', { font: 'ANSI Shadow' }).replace(/\n+$/, '').split('\n');
  return raw.map((line, i) => ARCADE_PALETTE[i % ARCADE_PALETTE.length](line));
}

function buildDotLeaderLine() {
  const dots = pc.dim('· '.repeat(12).trim());
  return `${dots} ${pc.yellow(PACMAN)} ${dots}`;
}

function buildAgentLine(provider, isDetected, innerWidth) {
  const label = provider.label.toUpperCase();
  const statusText = provider.status === 'supported' ? 'READY' : 'WAIT';
  const statusColored = provider.status === 'supported' ? pc.green(pc.bold(statusText)) : pc.magenta(statusText);
  const detection =
    isDetected === null || isDetected === undefined ? '' : isDetected ? pc.dim(' (detectado en PATH)') : pc.dim(' (no detectado)');

  // 4 caracteres fijos de separadores: "► ", el espacio antes del leader y el espacio despues.
  const leaderTarget = innerWidth - visibleLength(statusColored) - visibleLength(detection) - visibleLength(label) - 4;
  const leader = pc.dim('.'.repeat(Math.max(3, leaderTarget)));

  return `${pc.cyan('►')} ${label} ${leader} ${statusColored}${detection}`;
}

function renderBanner({ version, providers, detected }) {
  const titleLines = buildTitleLines();
  const subtitle = pc.dim(pc.cyan('E N G I N E E R I N G'));
  const versionLine = pc.dim(`── v${version} ──`);
  const dotLeaderLine = buildDotLeaderLine();
  const header = pc.bold(pc.yellow('★ AGENTES CLI ★'));

  const innerWidth =
    Math.max(...titleLines.map(visibleLength), visibleLength(header) + CONTENT_MARGIN, 46) + CONTENT_MARGIN;

  const agentLines = providers.map((provider) => buildAgentLine(provider, detected[provider.id], innerWidth));

  const top = pc.magenta('╔' + '═'.repeat(innerWidth + 2) + '╗');
  const sep = pc.magenta('╟' + '─'.repeat(innerWidth + 2) + '╢');
  const bottom = pc.magenta('╚' + '═'.repeat(innerWidth + 2) + '╝');

  function row(content) {
    const pad = Math.max(0, innerWidth - visibleLength(content));
    return `${pc.magenta('║')} ${content}${' '.repeat(pad)} ${pc.magenta('║')}`;
  }

  const lines = [top];
  for (const titleLine of titleLines) lines.push(row(center(titleLine, innerWidth)));
  lines.push(row(center(subtitle, innerWidth)));
  lines.push(row(center(versionLine, innerWidth)));
  lines.push(row(center(dotLeaderLine, innerWidth)));
  lines.push(sep);
  lines.push(row(center(header, innerWidth)));
  lines.push(row(''));
  for (const agentLine of agentLines) lines.push(row(agentLine));
  lines.push(bottom);

  return lines.join('\n');
}

module.exports = { renderBanner };
