'use strict';

// Adapta el cuerpo markdown de un agente (formato fuente: opencode) al CLI destino.
// El contenido es en su mayoria prosa agnostica de runtime (describe el PROCESO, no
// sintaxis de opencode), asi que esto cubre los pocos puntos reales de acoplamiento
// encontrados en agents/*.md: referencias literales a rutas de opencode, y la seccion
// final de permisos (especifica del frontmatter de opencode, ya traducida por
// separado al mecanismo de permisos propio de cada CLI).

// En los agentes fuente es siempre la ultima seccion del archivo (verificado).
function stripPermissionsSection(body) {
  return body.replace(/\n## Permisos y herramientas[\s\S]*$/, '\n');
}

// Las skills son siempre archivos SKILL.md sea cual sea el CLI (solo cambia el
// directorio contenedor), asi que un swap de directorio alcanza. Los AGENTES no: cada
// CLI los serializa en su propio formato de archivo (opencode/Claude Code: `{name}.md`,
// Codex: `{name}.toml` — ver providers/codex.js), asi que una referencia puntual a un
// agente especifico (ej. `.opencode/agents/tracking.md`) necesita reescribir tambien la
// extension, no solo el directorio. agentFileExt indica la extension real que ese CLI
// usa para sus agentes (sin punto, ej. "md" o "toml").
function replacePaths(body, { agentsDir, skillsDir, agentFileExt = 'md' }) {
  let out = body.replaceAll('.opencode/skills/', `${skillsDir}/`);
  out = out.replace(/\.opencode\/agents\/([a-zA-Z0-9_-]+)\.md/g, (_match, name) => `${agentsDir}/${name}.${agentFileExt}`);
  // Cualquier referencia sobrante al directorio sin nombre de archivo especifico detras
  // (no se encontro ningun caso real, pero queda como red de seguridad).
  out = out.replaceAll('.opencode/agents/', `${agentsDir}/`);
  return out;
}

// agentsDir/skillsDir: rutas (relativas al proyecto destino) donde ESTE CLI espera
// encontrar sus propios agentes/skills traducidos, ej. ".claude/agents" / ".claude/skills".
// agentFileExt (opcional, default "md"): extension real de archivo de agente de ESTE
// CLI — pasar "toml" para Codex.
// autoloadPhrase (opcional): reemplaza la frase "cargan **automaticamente** por
// opencode cuando el contexto coincide" por la semantica de autocarga de skills que
// aplique al CLI destino (o se omite si no aplica ningun reemplazo).
function adaptBody(body, { agentsDir, skillsDir, agentFileExt, autoloadPhrase }) {
  let out = stripPermissionsSection(body);
  out = replacePaths(out, { agentsDir, skillsDir, agentFileExt });
  if (autoloadPhrase) {
    out = out.replace('cargan **automaticamente** por opencode cuando el contexto coincide', autoloadPhrase);
  }
  return out.trimEnd();
}

module.exports = { adaptBody, stripPermissionsSection, replacePaths };
