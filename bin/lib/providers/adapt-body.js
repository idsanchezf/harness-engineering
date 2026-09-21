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

function replacePaths(body, { agentsDir, skillsDir }) {
  return body.replaceAll('.opencode/skills/', `${skillsDir}/`).replaceAll('.opencode/agents/', `${agentsDir}/`);
}

// agentsDir/skillsDir: rutas (relativas al proyecto destino) donde ESTE CLI espera
// encontrar sus propios agentes/skills traducidos, ej. ".claude/agents" / ".claude/skills".
// autoloadPhrase (opcional): reemplaza la frase "cargan **automaticamente** por
// opencode cuando el contexto coincide" por la semantica de autocarga de skills que
// aplique al CLI destino (o se omite si no aplica ningun reemplazo).
function adaptBody(body, { agentsDir, skillsDir, autoloadPhrase }) {
  let out = stripPermissionsSection(body);
  out = replacePaths(out, { agentsDir, skillsDir });
  if (autoloadPhrase) {
    out = out.replace('cargan **automaticamente** por opencode cuando el contexto coincide', autoloadPhrase);
  }
  return out.trimEnd();
}

module.exports = { adaptBody, stripPermissionsSection, replacePaths };
