'use strict';

// Serializador TOML minimo escrito a mano (sin dependencia npm nueva). Los archivos
// generados (.codex/agents/*.toml) tienen exactamente 4 campos fijos, asi que una
// libreria generica de TOML no ahorra la parte no trivial del problema (igual hay que
// mapear el objeto a mano); escribirlo aqui es menos riesgo que sumar una dependencia
// para un formato tan angosto.

// name/description/sandbox_mode: texto de una sola linea. Se escapa \\ y " (formato
// TOML "basic string"); un salto de linea se colapsa a espacio de forma defensiva,
// ya que estos campos nunca deberian traerlo.
function tomlBasicString(value) {
  const escaped = String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\t/g, '\\t')
    .replace(/\r?\n/g, ' ');
  return `"${escaped}"`;
}

// developer_instructions: el cuerpo markdown completo del agente, como string literal
// multilinea TOML ('''...'''), sin procesar escapes internos. La secuencia ''' es
// invalida dentro de este delimitador -- en vez de emitir TOML invalido en silencio,
// se lanza un error explicito para detectarlo en el momento de generar el archivo
// (hay un test que corre esto sobre los agents/*.md reales para atajar el caso ya).
function tomlMultilineLiteral(value) {
  const str = String(value);
  if (str.includes("'''")) {
    throw new Error(
      'No se puede serializar como string literal TOML (\'\'\'...\'\'\'): el contenido contiene la secuencia "\'\'\'". Revisar el cuerpo del agente.'
    );
  }
  // El salto de linea propio garantiza que el contenido nunca quede pegado al
  // delimitador de cierre, evitando cualquier ambiguedad con comillas finales.
  return `'''\n${str}\n'''`;
}

function serializeAgentToml({ name, description, developerInstructions, sandboxMode }) {
  return [
    `name = ${tomlBasicString(name)}`,
    `description = ${tomlBasicString(description)}`,
    `sandbox_mode = ${tomlBasicString(sandboxMode)}`,
    `developer_instructions = ${tomlMultilineLiteral(developerInstructions)}`,
    '',
  ].join('\n');
}

module.exports = { tomlBasicString, tomlMultilineLiteral, serializeAgentToml };
