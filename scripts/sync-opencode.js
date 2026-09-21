#!/usr/bin/env node
'use strict';

// Dogfooding local: este repo se desarrolla a si mismo con opencode
// (opencode.json -> default_agent: "leader"), pero .opencode/, opencode.json y
// AGENTS.md en la raiz ya NO son fuente editada a mano (ver agents/, skills/) — son
// salida generada, gitignorada (ver .gitignore del repo). Este script la regenera
// localmente. No se shippea con el paquete npm (scripts/ no esta en package.json
// "files"): correrlo requiere el checkout completo del repo, no solo el paquete
// instalado.

const opencode = require('../bin/lib/providers/opencode');
const { writeAgentsMd } = require('../bin/lib/agents-md');
const { PACKAGE_ROOT, AGENTS_DIR } = require('../bin/lib/source-paths');

const { copied } = opencode.scaffold(PACKAGE_ROOT);
const agentsMdResult = writeAgentsMd(PACKAGE_ROOT, [opencode], { agentsDir: AGENTS_DIR });

console.log(
  `Sincronizado .opencode/, opencode.json y AGENTS.md en la raiz del repo (${copied.length + agentsMdResult.copied.length} entradas).`
);
