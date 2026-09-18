'use strict';

// STUB — soporte real para OpenAI Codex CLI todavia NO esta implementado. Mismo
// mecanismo de extension que providers/claude.js (ver ese archivo para el patron
// general); las notas de abajo son especificas de Codex.
//
// Notas para cuando se implemente soporte real:
//
// 1. Codex CLI tambien usa AGENTS.md como contexto de proyecto (mismo mecanismo que
//    este repo ya aprovecha para opencode via `opencode.json` -> `instructions`), asi
//    que probablemente no haga falta duplicar contenido para ese archivo.
//
// 2. A diferencia de opencode/Claude Code, Codex CLI no tiene (al momento de escribir
//    esto) un concepto de subagentes declarativos por archivo en una carpeta propia
//    tipo `.opencode/agents/` o `.claude/agents/`. Investigar la convencion vigente de
//    Codex antes de implementar: puede requerir consolidar las instrucciones de los 10
//    agentes de `.opencode/agents/*.md` dentro del propio AGENTS.md en vez de generar
//    un archivo por agente, o Codex puede haber agregado su propio mecanismo desde
//    entonces — revisar la documentacion oficial de Codex CLI en el momento de
//    implementar esto, no asumir que sigue igual.
//
// 3. Implementar una funcion `scaffold(destDir)` con la misma forma que
//    providers/opencode.js (debe devolver `{ copied: [...] }`), asignarla aqui abajo,
//    y cambiar `status` a 'supported'. No hace falta tocar ningun otro archivo de
//    bin/ — cli.js, banner.js y detect-agents.js ya iteran sobre el registro de
//    providers (ver bin/lib/providers/index.js) y recogeran este cambio automaticamente.

module.exports = {
  id: 'codex',
  label: 'codex',
  detectBinary: 'codex',
  status: 'coming-soon',
  scaffold: null,
};
