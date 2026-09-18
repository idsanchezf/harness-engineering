'use strict';

// Registro central de providers (uno por CLI de agentes soportado o planeado).
// Agregar un CLI nuevo = crear bin/lib/providers/{id}.js con la misma interfaz
// (id, label, detectBinary, status, scaffold) y sumarlo a esta lista. cli.js,
// banner.js y detect-agents.js iteran este arreglo sin necesitar cambios propios.

const opencode = require('./opencode');
const claude = require('./claude');
const codex = require('./codex');

const PROVIDERS = [opencode, claude, codex];

module.exports = { PROVIDERS };
