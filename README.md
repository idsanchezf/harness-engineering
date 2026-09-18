# Harness Engineering — Plantilla de Ingenieria de Software con Agentes

Plantilla de ingenieria de arneses que orquesta el ciclo de vida completo de software mediante agentes especializados, con soporte multi-CLI (opencode y Claude Code hoy; Codex CLI planeado). Agnostica a tecnologias: el stack se define durante `inception`.

> Este README cubre que es el harness, como instalarlo y como usarlo. La referencia completa y actualizada del proceso (comandos, schema de estado, reglas de git flow) vive en [`AGENTS.md`](./AGENTS.md), que opencode y Claude Code cargan automaticamente como contexto del proyecto.

## Contenido

- [Que es Harness Engineering](#que-es-harness-engineering)
- [Instalacion](#instalacion)
- [Uso](#uso)

---

## Que es Harness Engineering

Un agente orquestador (`leader` en opencode; el rol equivalente vive en `CLAUDE.md` para Claude Code) coordina 9 subagentes especializados a lo largo de tres niveles del ciclo de vida de software, dejando trazabilidad de todo el progreso en `.harness-state.json`.

### Pipeline del SDLC

```
inception (una sola vez, co-creativa)
   │
   ▼
por feature: analysis → design
   │
   ▼
por HU:      develop → test → quality → deploy
```

`inception` es prerrequisito de toda feature: produce vision, backlog, modelo de dominio (DDD), arquitectura (`docs/architecture.md`), el scaffold del proyecto y un **walking skeleton** funcional. Es co-creativa (se construye en conversacion con el usuario) y requiere aprobacion HITL siempre, sin importar el flag `humanInTheLoop`.

Cada feature comparte `analysis`/`design`; cada historia de usuario (HU) dentro de la feature avanza por su propio `develop → test → quality → deploy` en su rama `hu/*`, lo que permite paralelismo entre HUs y entre features.

Ver el pipeline completo, las tablas de artefactos por fase y los comandos de `features` en [`AGENTS.md`](./AGENTS.md#pipeline-del-sdlc).

### Agentes disponibles

| Agente | Nivel | Capacidad |
|--------|-------|-----------|
| `leader` | Orquestador (default) | Unico que conoce el pipeline completo; delega en el resto |
| `inception` | Pre-fase (una vez) | Discovery co-creativo, DDD, arquitectura, scaffold, walking skeleton, tooling |
| `analysis` | Feature | Historias de usuario + criterios Gherkin (BDD) |
| `design` | Feature | Contratos API, modelo de datos, `tasks.json` por HU |
| `develop` | HU | Implementacion con TDD |
| `test` | HU | Pruebas unitarias, integracion, contract testing |
| `quality` | HU | Analisis estatico, seguridad, deuda tecnica |
| `deploy` | HU | CI/CD, infraestructura, observabilidad |
| `architect` | Transversal | Mantiene `docs/architecture.md` vivo (ADRs, C4, stack) |
| `scaffold` | Transversal | Scaffolding de nuevos servicios bajo demanda |
| `features` | Transversal | Unico autorizado a escribir `.harness-state.json`; gestiona ramas, PRs, tasks, HITL |

### Skills disponibles

Los skills se activan automaticamente segun el stack definido en `docs/architecture.md`. El leader resuelve cual usar por el patron `{lenguaje}-{framework}` (runtime), `tdd-{lenguaje}` (TDD), `bdd-{lenguaje}` (BDD) y `git-flow` (universal).

| Lenguaje | Scaffolding | TDD | BDD |
|----------|------------|-----|-----|
| .NET | `dotnet-microservice` | `tdd-dotnet` | `bdd-dotnet` |
| Python | `python-fastapi` | `tdd-python` | `bdd-python` |
| JavaScript/Node | `node-express` | `tdd-javascript` | `bdd-javascript` |
| Go | `go-chi` | `tdd-go` | `bdd-go` |
| Java | `spring-boot` | `tdd-java` | `bdd-java` |
| Rust | `rust-axum` | `tdd-rust` | `bdd-rust` |

`git-flow` (universal) gestiona ramas y versionado (`hu/*`, `feature/*`, `develop`, `release/*`, `hotfix/*`). Si el stack elegido no tiene skill, el leader lo informa y ofrece cargarlo de la comunidad o crearlo en conjunto.

### Soporte multi-CLI

La plantilla genera una configuracion equivalente por cada CLI de agentes que el equipo use:

| CLI | Estado | Que se genera |
|-----|--------|----------------|
| **opencode** | Soportado | `.opencode/agents/`, `.opencode/skills/`, `opencode.json` |
| **Claude Code** | Soportado | `.claude/agents/` (traducido desde `.opencode/agents/`), `.claude/skills/` (copia directa, mismo formato), `CLAUDE.md` (rol de orquestador, generado desde `leader.md`) |
| **Codex CLI** | Proximamente | Solo se detecta en el banner del instalador; todavia no genera configuracion |

`AGENTS.md` y `.harness-state.json` son comunes a cualquier runtime.

> **Nota sobre la traduccion a Claude Code**: opencode declara permisos granulares por patron de comando bash (ej. `"git *": allow`), algo que el formato de subagentes de Claude Code no puede expresar con la misma precision (alli `tools` es una lista de herramientas, no de comandos). La traduccion es de mejor esfuerzo: los agentes de solo analisis (`quality`) quedan sin `Write`/`Edit`; el resto hereda todas las herramientas. Ver `bin/lib/providers/claude.js` para el detalle.

---

## Instalacion

### Requisitos previos

- [opencode](https://opencode.ai) y/o [Claude Code](https://claude.com/claude-code) instalado (al menos uno)
- Docker Desktop (opcional, para contenerizacion)
- Git

### Opcion A: `npx` (recomendada)

El paquete se publica en GitHub Packages como `@idsanchezf/harness-engineering`. GitHub Packages requiere autenticacion incluso para paquetes publicos: copia [`.npmrc.example`](./.npmrc.example) a `.npmrc` (en tu proyecto o en `~/.npmrc`) y sigue las instrucciones del archivo para generar un token con scope `read:packages`.

```powershell
npx @idsanchezf/harness-engineering mi-proyecto
cd mi-proyecto
```

El comando muestra un banner con la version instalada y el estado de cada CLI de agentes en tu PATH (ver [Soporte multi-CLI](#soporte-multi-cli)), copia la plantilla al directorio indicado y termina — no queda instalado como dependencia del proyecto.

Opciones:

| Flag | Efecto |
|------|--------|
| `--yes` / `-y` | Continua aunque el directorio destino no este vacio |
| `--force` / `-f` | Ademas de `--yes`, permite sobrescribir un `.harness-state.json` con progreso real |
| `--version` / `-v` | Muestra la version instalada |
| `--help` / `-h` | Muestra la ayuda |

### Opcion B: copia manual (sin npm)

```powershell
cp -Recurse C:\@idsanchezf\harness-engineering\* .\mi-proyecto\
cd .\mi-proyecto
```

Con esta opcion solo se genera la configuracion de opencode (los archivos ya existentes en este repo); la generacion de `.claude/` es exclusiva del instalador `npx`.

---

## Uso

### 1. Inicia tu agente de preferencia en el directorio

**opencode:**

```powershell
opencode
```

El agente lider `leader` se activa automaticamente como agente por defecto. Al iniciar:

- Lee `.harness-state.json` para conocer el estado del proyecto
- Si el archivo no existe, lo crea e inicia la fase `inception`
- Si `inception` esta pendiente, retoma inception desde la fase donde se quedo
- Si `inception` esta completada, retoma desde la feature/HU/fase donde se quedo

**Claude Code:** abre el directorio normalmente — el rol de orquestador ya esta cargado en `CLAUDE.md` y sigue la misma logica de retomar estado descrita arriba.

### 2. Comienza con una solicitud

Escribe en lenguaje natural lo que necesitas:

```
Crear un sistema de facturacion electronica para pymes
```

El lider (u orquestador, en Claude Code) evaluara la solicitud y delegara al subagente correspondiente.

### 3. Invoca un subagente directamente (opcional)

Si ya sabes que capacidad especifica necesitas:

```
@inception necesito iniciar el proyecto de facturacion electronica
@analysis define las historias de usuario para F001
@develop implementa el endpoint de creacion de facturas
@test genera pruebas de integracion para el modulo de pagos
```

### Archivo de estado `.harness-state.json`

Persiste el progreso entre sesiones: inception (con sus 6 fases internas), features (con `analysis`/`design`) y sus HUs (con `develop`/`test`/`quality`/`deploy`). Solo el agente `features` puede escribirlo.

```json
{
  "project": "OrderService",
  "humanInTheLoop": true,
  "inception": { "status": "completed", "approved": true, "phases": { "...": "..." } },
  "features": [
    {
      "id": "F001",
      "status": "in_progress",
      "phases": { "analysis": { "status": "completed" }, "design": { "status": "completed" } },
      "userStories": [
        { "id": "US-001", "status": "in_progress", "phases": { "develop": { "status": "in_progress" }, "test": { "status": "pending" }, "quality": { "status": "pending" }, "deploy": { "status": "pending" } } }
      ]
    }
  ]
}
```

El schema completo (con timestamps, `docsPath`, `branch`, `prUrl`) esta en `templates/state/harness-state.json`, y la tabla de estados validos en [`AGENTS.md`](./AGENTS.md#estados-validos).

> Nota: el tracking de los pasos TDD (RED/GREEN/REFACTOR) es interno a la fase `develop` y **no** se persiste en `.harness-state.json`.

### Estructura generada

```
mi-proyecto/
├── .harness-state.json
├── src/ ...                      # segun el stack elegido en inception
├── tests/ ...
├── docs/
│   ├── inception/                 # artefactos fundacionales (product-brief, domain-model, etc.)
│   ├── architecture.md            # ADRs, C4, stack tecnologico
│   └── features/
│       └── F001-{slug}/
│           ├── user-stories.md    # analysis (feature)
│           ├── api-contract.yaml  # design (feature)
│           ├── data-model.md      # design (feature)
│           └── US-001/
│               ├── tasks.json         # design → develop
│               ├── test-report.md     # test
│               ├── quality-report.md  # quality
│               └── deploy-config.md   # deploy
├── docker-compose.yml
└── Dockerfile
```

### Reglas clave del proceso

- **Inception es prerrequisito** de toda feature, y siempre requiere aprobacion HITL explicita
- **Fases mixtas**: `analysis`/`design` son por feature; `develop`/`test`/`quality`/`deploy` son por HU
- **Paralelismo**: features distintas y HUs distintas de la misma feature pueden avanzar en paralelo; `quality` nunca bloquea
- **Git Flow**: `hu/*` → `feature/*` → `develop` → `release/*`/`hotfix/*` → `main`, todo via PR
- **BDD en `analysis`**, **TDD en `develop`**, usando el skill del stack activo
- **HITL** (Human in the Loop) es opcional fuera de inception; si esta activo, cada fase requiere aprobacion explicita

Para el detalle completo de comandos, estados y reglas de integridad de git, ver [`AGENTS.md`](./AGENTS.md).
