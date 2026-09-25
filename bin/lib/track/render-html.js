'use strict';

// Genera un dashboard HTML autocontenido (CSS + JS inline, sin dependencias externas,
// sin llamadas de red) a partir de los datos de `dashboard-data.js`. Funciona abierto
// directamente desde el filesystem (file://), por eso los datos van embebidos como
// JSON en la propia pagina en vez de cargarse con fetch() (que el navegador bloquea
// para file:// por CORS).

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

function formatDuration(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return 'N/D';
  const total = Math.round(seconds);
  if (total < 60) return `${total}s`;
  const h = Math.floor(total / 3600);
  const m = Math.round((total % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatNumber(n) {
  if (n == null || Number.isNaN(n)) return 'N/D';
  return n.toLocaleString('es');
}

function formatPercent(n) {
  if (n == null || Number.isNaN(n)) return 'N/D';
  return `${n}%`;
}

const PHASE_LABELS = {
  analysis: 'Analysis',
  design: 'Design',
  develop: 'Develop',
  test: 'Test',
  quality: 'Quality',
  deploy: 'Deploy',
  tracking: 'Tracking',
};

const PHASE_COLORS = {
  analysis: '#8b5cf6',
  design: '#6366f1',
  develop: '#3b82f6',
  test: '#06b6d4',
  quality: '#10b981',
  deploy: '#f59e0b',
  tracking: '#ec4899',
};

function phaseColor(fase) {
  return PHASE_COLORS[fase] || '#94a3b8';
}

function phaseLabel(fase) {
  return PHASE_LABELS[fase] || fase;
}

const CSS = `
:root {
  --bg: #f8fafc;
  --card-bg: #ffffff;
  --text: #0f172a;
  --text-dim: #64748b;
  --border: #e2e8f0;
  --accent: #4f46e5;
  --accent-bg: #eef2ff;
  --ok: #16a34a;
  --warn: #d97706;
  --bad: #dc2626;
  --radius: 10px;
  --shadow: 0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.06);
  color-scheme: light dark;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0b1120;
    --card-bg: #131c31;
    --text: #e2e8f0;
    --text-dim: #94a3b8;
    --border: #253045;
    --accent: #818cf8;
    --accent-bg: #1e2338;
    --ok: #4ade80;
    --warn: #fbbf24;
    --bad: #f87171;
    --shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background: var(--bg);
  color: var(--text);
  padding: 16px;
}
.container { max-width: 1080px; margin: 0 auto; }
header.top {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 20px;
}
header.top h1 { margin: 0; font-size: 1.5rem; }
header.top .meta { color: var(--text-dim); font-size: 0.85rem; }
.card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
  margin-bottom: 16px;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.stat {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 14px 16px;
}
.stat .label { font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.04em; }
.stat .value { font-size: 1.5rem; font-weight: 600; margin-top: 4px; }
.stat .value.warn { color: var(--warn); }
h2 { font-size: 1.1rem; margin: 0 0 12px; }
table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border); }
th { color: var(--text-dim); font-weight: 600; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.03em; }
tr.clickable { cursor: pointer; }
tr.clickable:hover { background: var(--accent-bg); }
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--accent-bg);
  color: var(--accent);
}
.badge.done { background: rgba(22, 163, 74, 0.12); color: var(--ok); }
.badge.pending { background: rgba(100, 116, 139, 0.12); color: var(--text-dim); }
.badge.blocked { background: rgba(220, 38, 38, 0.12); color: var(--bad); }
.bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.bar-row .bar-label { width: 90px; font-size: 0.82rem; flex-shrink: 0; }
.bar-track { flex: 1; background: var(--border); border-radius: 6px; height: 14px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 6px; }
.bar-row .bar-value { width: 150px; text-align: right; font-size: 0.8rem; color: var(--text-dim); flex-shrink: 0; }
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--accent);
  cursor: pointer;
  font-size: 0.9rem;
  margin-bottom: 12px;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
}
.back-link:hover { text-decoration: underline; }
.view { display: none; }
.view.active { display: block; }
.coverage-note {
  font-size: 0.82rem;
  color: var(--warn);
  background: rgba(217, 119, 6, 0.1);
  border: 1px solid rgba(217, 119, 6, 0.3);
  border-radius: var(--radius);
  padding: 10px 12px;
  margin-bottom: 16px;
}
.muted { color: var(--text-dim); }
footer { text-align: center; color: var(--text-dim); font-size: 0.78rem; margin-top: 24px; }
`;

function renderPhaseBars(breakdown, metric) {
  const entries = Object.keys(breakdown).map((fase) => ({ fase, ...breakdown[fase] }));
  if (entries.length === 0) return '<p class="muted">Sin fases completadas todavia.</p>';

  const maxValue = Math.max(...entries.map((e) => (metric === 'tokens' ? e.tokens : e.durationSeconds)), 1);

  return entries
    .sort((a, b) => (metric === 'tokens' ? b.tokens - a.tokens : b.durationSeconds - a.durationSeconds))
    .map((e) => {
      const value = metric === 'tokens' ? e.tokens : e.durationSeconds;
      const widthPct = Math.max(2, Math.round((value / maxValue) * 100));
      const displayValue = metric === 'tokens' ? formatNumber(value) : formatDuration(value);
      return `
        <div class="bar-row">
          <div class="bar-label">${escapeHtml(phaseLabel(e.fase))}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${widthPct}%;background:${phaseColor(e.fase)}"></div></div>
          <div class="bar-value">${displayValue} · ${e.count}x</div>
        </div>`;
    })
    .join('');
}

function statusBadgeClass(status) {
  if (status === 'done') return 'done';
  if (status === 'blocked') return 'blocked';
  return 'pending';
}

function renderCoverageNote(coverage) {
  if (coverage >= 100) return '';
  return `<div class="coverage-note">⚠ Cobertura de datos: ${coverage}%. Los totales de tokens excluyen fases/tareas sin fuente real disponible — no representan el consumo completo.</div>`;
}

function renderGlobalView(data) {
  const { totals, features, globalPhaseTypeBreakdown } = data;
  const featureRows = features
    .map(
      (f) => `
      <tr class="clickable" data-feature-id="${escapeHtml(f.id)}" onclick="showFeature('${escapeHtml(f.id)}')">
        <td><strong>${escapeHtml(f.id)}</strong></td>
        <td>${escapeHtml(f.name)}</td>
        <td><span class="badge ${statusBadgeClass(f.status)}">${escapeHtml(f.status)}</span></td>
        <td>${f.huCount}</td>
        <td>${formatDuration(f.timeSeconds)}</td>
        <td>${formatNumber(f.tokens)}</td>
        <td>${formatPercent(f.coverage)}</td>
      </tr>`
    )
    .join('');

  return `
  <div id="view-global" class="view active">
    <div class="stat-grid">
      <div class="stat"><div class="label">Features</div><div class="value">${totals.featureCount}</div></div>
      <div class="stat"><div class="label">HUs</div><div class="value">${totals.huCount}</div></div>
      <div class="stat"><div class="label">Tiempo total</div><div class="value">${formatDuration(totals.timeSeconds)}</div></div>
      <div class="stat"><div class="label">Tokens nuevos</div><div class="value">${formatNumber(totals.tokens)}</div></div>
      <div class="stat"><div class="label">Output</div><div class="value">${formatNumber(totals.outputTokens)}</div></div>
      <div class="stat"><div class="label">Procesados (incl. caché)</div><div class="value">${formatNumber(totals.processedTokens)}</div></div>
      <div class="stat"><div class="label">Cobertura</div><div class="value ${totals.coverage < 100 ? 'warn' : ''}">${formatPercent(totals.coverage)}</div></div>
    </div>

    <p class="muted">Tokens nuevos = input + output + escritura de caché. Procesados suma además la relectura de caché, que ocurre en cada llamada y se factura a ~10% del input.</p>

    ${renderCoverageNote(totals.coverage)}

    <div class="card">
      <h2>Por feature</h2>
      <table>
        <thead><tr><th>ID</th><th>Nombre</th><th>Estado</th><th>HUs</th><th>Tiempo</th><th>Tokens nuevos</th><th>Cobertura</th></tr></thead>
        <tbody>${featureRows || '<tr><td colspan="7" class="muted">Sin features registradas todavia.</td></tr>'}</tbody>
      </table>
    </div>

    <div class="card">
      <h2>Consumo por tipo de fase — tokens</h2>
      ${renderPhaseBars(globalPhaseTypeBreakdown, 'tokens')}
    </div>

    <div class="card">
      <h2>Consumo por tipo de fase — tiempo</h2>
      ${renderPhaseBars(globalPhaseTypeBreakdown, 'time')}
    </div>
  </div>`;
}

function renderFeatureView(f) {
  const huRows = f.hus
    .map(
      (hu) => `
      <tr>
        <td><strong>${escapeHtml(hu.id)}</strong></td>
        <td>${escapeHtml(hu.title)}</td>
        <td>${formatDuration(hu.timeSeconds)}</td>
        <td>${formatNumber(hu.tokens)}</td>
        <td>${formatPercent(hu.coverage)}</td>
      </tr>`
    )
    .join('');

  const phaseRows = f.hus
    .flatMap((hu) =>
      hu.phases.map(
        (p) => `
      <tr>
        <td>${escapeHtml(hu.id)}</td>
        <td>${escapeHtml(phaseLabel(p.fase))}</td>
        <td>${formatDuration(p.durationSeconds)}</td>
        <td>${p.tokens ? formatNumber(p.tokens.total) : 'N/D'}</td>
        <td>${escapeHtml(p.tokensSource)}</td>
      </tr>`
      )
    )
    .join('');

  const taskRows = f.hus
    .flatMap((hu) =>
      hu.tasks.map(
        (t) => `
      <tr>
        <td>${escapeHtml(hu.id)}</td>
        <td>${escapeHtml(t.taskId)}</td>
        <td>${escapeHtml(t.description)}</td>
        <td>${escapeHtml(t.layer || '—')}</td>
        <td>${formatDuration(t.durationSeconds)}</td>
        <td>${t.tokens ? formatNumber(t.tokens.total) : 'N/D'}</td>
      </tr>`
      )
    )
    .join('');

  return `
  <div id="view-feature-${escapeHtml(f.id)}" class="view">
    <button class="back-link" onclick="showGlobal()">← Volver al resumen</button>
    <h1 style="margin:0 0 4px">${escapeHtml(f.id)} — ${escapeHtml(f.name)}</h1>
    <p class="muted" style="margin-top:0">Estado: <span class="badge ${statusBadgeClass(f.status)}">${escapeHtml(f.status)}</span></p>

    <div class="stat-grid">
      <div class="stat"><div class="label">HUs</div><div class="value">${f.huCount}</div></div>
      <div class="stat"><div class="label">Tiempo total</div><div class="value">${formatDuration(f.timeSeconds)}</div></div>
      <div class="stat"><div class="label">Tokens nuevos</div><div class="value">${formatNumber(f.tokens)}</div></div>
      <div class="stat"><div class="label">Output</div><div class="value">${formatNumber(f.outputTokens)}</div></div>
      <div class="stat"><div class="label">Procesados (incl. caché)</div><div class="value">${formatNumber(f.processedTokens)}</div></div>
      <div class="stat"><div class="label">Cobertura</div><div class="value ${f.coverage < 100 ? 'warn' : ''}">${formatPercent(f.coverage)}</div></div>
    </div>

    ${renderCoverageNote(f.coverage)}

    <div class="card">
      <h2>Desglose por HU</h2>
      <table>
        <thead><tr><th>HU</th><th>Titulo</th><th>Tiempo</th><th>Tokens nuevos</th><th>Cobertura</th></tr></thead>
        <tbody>${huRows || '<tr><td colspan="5" class="muted">Sin HUs registradas todavia.</td></tr>'}</tbody>
      </table>
    </div>

    <div class="card">
      <h2>Desglose por HU y fase</h2>
      <table>
        <thead><tr><th>HU</th><th>Fase</th><th>Duracion</th><th>Tokens nuevos</th><th>Fuente</th></tr></thead>
        <tbody>${phaseRows || '<tr><td colspan="5" class="muted">Sin fases completadas todavia.</td></tr>'}</tbody>
      </table>
    </div>

    <div class="card">
      <h2>Desglose por HU y tarea</h2>
      <table>
        <thead><tr><th>HU</th><th>Task</th><th>Descripcion</th><th>Capa</th><th>Duracion</th><th>Tokens nuevos</th></tr></thead>
        <tbody>${taskRows || '<tr><td colspan="6" class="muted">Sin tareas completadas todavia.</td></tr>'}</tbody>
      </table>
    </div>

    <div class="card">
      <h2>Consumo por tipo de fase (esta feature)</h2>
      ${renderPhaseBars(f.phaseTypeBreakdown, 'tokens')}
    </div>
  </div>`;
}

function renderDashboardHtml(data) {
  const featureViews = data.features.map(renderFeatureView).join('\n');
  const dataJson = JSON.stringify(data).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tracking Dashboard — ${escapeHtml(data.project)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="container">
  <header class="top">
    <h1>📊 Tracking Dashboard — ${escapeHtml(data.project)}</h1>
    <div class="meta">Generado: ${escapeHtml(data.generatedAt)}</div>
  </header>

  ${renderGlobalView(data)}
  ${featureViews}

  <footer>Generado por <code>@idsanchezf/harness-engineering track dashboard</code> — datos crudos en el mismo directorio (<code>.harness-state.json</code>, <code>tasks.json</code>)</footer>
</div>

<script id="dashboard-data" type="application/json">${dataJson}</script>
<script>
  function showGlobal() {
    document.querySelectorAll('.view').forEach(function (el) { el.classList.remove('active'); });
    document.getElementById('view-global').classList.add('active');
    window.scrollTo(0, 0);
  }
  function showFeature(id) {
    document.querySelectorAll('.view').forEach(function (el) { el.classList.remove('active'); });
    var el = document.getElementById('view-feature-' + id);
    if (el) el.classList.add('active');
    window.scrollTo(0, 0);
  }
</script>
</body>
</html>
`;
}

module.exports = { renderDashboardHtml, formatDuration, formatNumber, formatPercent, escapeHtml };
