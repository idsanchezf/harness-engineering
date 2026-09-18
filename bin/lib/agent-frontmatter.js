'use strict';

// Parser minimo, a medida del formato de frontmatter usado en .opencode/agents/*.md
// (description / mode / permission.edit / permission.bash.{patron} / permission.task).
// No es un parser YAML general — no hace falta, porque esta repo controla el formato
// exacto de sus 10 agentes. Si algun agente usara una estructura mas compleja, esto
// habria que reemplazarlo por una libreria YAML real.

function splitFrontmatter(fileContent) {
  const match = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatterRaw: '', body: fileContent };
  }
  return { frontmatterRaw: match[1], body: match[2] };
}

function parseAgentFrontmatter(frontmatterRaw) {
  const result = { description: '', mode: 'subagent', edit: 'ask', bash: {}, task: undefined };

  for (const rawLine of frontmatterRaw.split('\n')) {
    if (!rawLine.trim()) continue;
    const indent = rawLine.length - rawLine.trimStart().length;
    const line = rawLine.trim();

    if (indent === 0) {
      if (line.startsWith('description:')) {
        result.description = line.slice('description:'.length).trim();
      } else if (line.startsWith('mode:')) {
        result.mode = line.slice('mode:'.length).trim();
      }
    } else if (indent === 2) {
      if (line.startsWith('edit:')) {
        result.edit = line.slice('edit:'.length).trim();
      } else if (line.startsWith('task:')) {
        result.task = line.slice('task:'.length).trim();
      }
      // "bash:" en si mismo no tiene valor propio, sus hijos van con indent 4.
    } else if (indent === 4) {
      const idx = line.lastIndexOf(':');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim().replace(/^"(.*)"$/, '$1');
      const value = line.slice(idx + 1).trim();
      result.bash[key] = value;
    }
  }

  return result;
}

function parseAgentFile(fileContent) {
  const { frontmatterRaw, body } = splitFrontmatter(fileContent);
  return { ...parseAgentFrontmatter(frontmatterRaw), body };
}

module.exports = { splitFrontmatter, parseAgentFrontmatter, parseAgentFile };
