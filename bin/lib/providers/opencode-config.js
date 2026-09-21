'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { parseAgentFile } = require('../agent-frontmatter');

// Config de opencode que NO es derivable de agents/*.md: $schema, los archivos de
// instructions (siempre los mismos dos, agnosticos), y el permission de nivel
// superior. Este ultimo NO es identico al permission propio del frontmatter de
// leader.md (aqui incluye ademas "dotnet *"/"kubectl *", que aplican a la sesion en
// general, no solo al leader) -- por eso queda como dato estatico separado, no
// derivado del agente primary.
const BASE_CONFIG = {
  $schema: 'https://opencode.ai/config.json',
  instructions: ['HARNESS.md', 'AGENTS.md'],
  permission: {
    edit: 'ask',
    bash: {
      'dotnet *': 'allow',
      'git *': 'allow',
      'docker *': 'allow',
      'kubectl *': 'ask',
      '*': 'ask',
    },
  },
};

// Deriva el mapa `agent` (mode + description por agente) y el `default_agent` (el
// agente con mode: primary) leyendo agents/*.md directamente -- reemplaza la lista
// mantenida a mano que hoy existe en opencode.json, y de paso corrige el bug de
// deriva encontrado (el agente "tracking" no estaba registrado alli).
function buildAgentMap(agentsDir) {
  const agent = {};
  let defaultAgent = null;

  const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const name = path.basename(file, '.md');
    const parsed = parseAgentFile(fs.readFileSync(path.join(agentsDir, file), 'utf8'));
    agent[name] = { mode: parsed.mode, description: parsed.description };
    if (parsed.mode === 'primary') defaultAgent = name;
  }

  return { agent, defaultAgent };
}

function buildOpencodeJson(agentsDir) {
  const { agent, defaultAgent } = buildAgentMap(agentsDir);
  const config = {
    $schema: BASE_CONFIG.$schema,
    default_agent: defaultAgent,
    instructions: BASE_CONFIG.instructions,
    agent,
    permission: BASE_CONFIG.permission,
  };
  return JSON.stringify(config, null, 2) + '\n';
}

module.exports = { buildOpencodeJson, buildAgentMap, BASE_CONFIG };
