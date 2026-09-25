# AGENTS.md

`@idsanchezf/harness-engineering` es el codigo fuente del CLI de scaffolding que instala
la plantilla de agentes de IA (opencode, Claude Code, Codex, Antigravity) en un proyecto destino.
Este repo **no es la plantilla en si** — es la herramienta que la genera. Si buscas
documentacion del producto desde la perspectiva de quien lo instala, ve a
[`README.md`](./README.md); si buscas la referencia completa del pipeline/proceso que
la plantilla instala, ve a [`HARNESS.md`](./HARNESS.md).

## Estructura

| Ruta | Contenido |
|------|-----------|
| `agents/*.md` | Fuente de verdad de los agentes del pipeline (frontmatter + prosa) |
| `skills/*/SKILL.md` | Fuente de verdad de las skills por stack tecnologico |
| `bin/cli.js` | Entry point del CLI (`npx @idsanchezf/harness-engineering`) |
| `bin/lib/providers/*.js` | Un archivo por CLI soportado: traduce `agents/`/`skills/` al formato de ese CLI |
| `bin/lib/agents-md.js` | Genera el `AGENTS.md` de los proyectos DESTINO (no confundir con este archivo) |
| `bin/lib/track/` | Sistema de tracking de tiempo/tokens por fase |
| `templates/` | Plantillas de documentos que usan los agentes generados (product brief, architecture.md, etc.) |
| `test/` | Suite de tests (`npm test`, node:test nativo) |
| `HARNESS.md` | Referencia completa del pipeline/proceso, agnostica al CLI — se copia tal cual a cada proyecto destino |

## Desarrollo

- `npm test` corre la suite completa (sin dependencias nuevas, usa `node:test`).
- Agregar soporte para un CLI nuevo = un archivo nuevo en `bin/lib/providers/{id}.js`
  siguiendo la interfaz de los existentes (`opencode.js`, `claude.js`, `codex.js`, `antigravity.js`),
  registrado en `bin/lib/providers/index.js`.
- Editar el contenido de un agente o skill = editar directamente `agents/*.md` o
  `skills/*/SKILL.md`. `bin/` traduce esa fuente para cada CLI en tiempo de
  instalacion — no hay nada que regenerar a mano en este repo.
- Para probar los cambios end-to-end contra un directorio temporal:
  `node bin/cli.js <dir-temporal> --agent <id>` (o `--agent all`), y revisar el
  resultado generado ahi.
