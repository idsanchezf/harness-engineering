# Harness Engineering — Referencia del proceso

Este documento es la referencia completa del proceso de Harness Engineering: pipeline, agentes, comandos, archivo de estado y reglas de git. Es **agnostico al CLI de agentes que uses** — aplica igual si trabajas con opencode, Claude Code, u otro CLI soportado. Lo referencian `AGENTS.md` (wrapper especifico de opencode) y `CLAUDE.md` (rol de orquestador para Claude Code), y ambos lo cargan como contexto ademas de sus propios archivos.

## Pipeline del SDLC

### Inception (pre-fase de proyecto, una sola vez)

Antes de cualquier feature, el proyecto pasa por `inception`. Esta fase es **co-creativa**: el agente NO genera artefactos automaticamente, sino que facilita una conversacion con el usuario para construir juntos cada artefacto. Produce:

- Vision, alcance, stakeholders, backlog de features
- Riesgos, NFRs, KPIs, restricciones tecnologicas
- Modelo de dominio (DDD): bounded contexts, entidades, value objects, eventos de dominio
- Arquitectura inicial: stack tecnologico, patrones, C4, ADRs → `docs/architecture.md` (co-disenada con el usuario)
- Scaffold del proyecto: solucion, Docker, ambientes, tooling de calidad/seguridad
- **Walking skeleton**: funcionalidad ejemplo end-to-end que recorre todas las capas de la arquitectura (API → Application → Domain → Infrastructure). Incluye tests unitarios y de integracion

### Pipeline por feature (2 fases feature-level)

```
analysis → design
```

| Fase | Agente | Proposito | Nivel |
|------|--------|-----------|-------|
| `analysis` | `analysis` | Historias de usuario detalladas + criterios de aceptacion Gherkin (BDD) para la feature | Feature |
| `design` | `design` | Contratos API, modelo de datos, y genera `tasks.json` por cada HU | Feature |

### Pipeline por HU (5 fases HU-level)

Cada historia de usuario (HU) dentro de la feature tiene su propio pipeline:

```
develop → test → quality → deploy → tracking
```

| Fase | Agente | Proposito | Nivel |
|------|--------|-----------|-------|
| `develop` | `develop` | Implementacion con TDD | HU |
| `test` | `test` | Unitarias, integracion, contract testing | HU |
| `quality` | `quality` | Analisis estatico, seguridad, deuda tecnica | HU |
| `deploy` | `deploy` | CI/CD, infraestructura, observabilidad | HU |
| `tracking` | `tracking` | Calcula tiempo/tokens reales de la HU y actualiza el reporte de tracking de la feature | HU |

`tracking` es la ultima fase, corre despues de `deploy` y antes de que la HU cree su PR hacia la feature. Ver [Tracking de tiempo y tokens](#tracking-de-tiempo-y-tokens) para el mecanismo completo.

## Agentes disponibles

| Agente | Invocacion directa | Capacidad |
|--------|-------------------|-----------|
| `leader` | default (automatico) | Orquestador unico del proceso |
| `features` | Gestion de backlog, ramas y estado | Transversal |
| `inception` | Discovery co-creativo, DDD, arquitectura, scaffold, walking skeleton, tooling | Pre-fase de proyecto (una vez, co-creativa) |
| `analysis` | User stories + Gherkin BDD | Ejecutor (feature-level) |
| `design` | Contratos API, modelo de datos, tasks por HU | Ejecutor (feature-level) |
| `develop` | Implementacion de funcionalidad con TDD | Ejecutor (HU-level) |
| `test` | Pruebas unitarias, integracion, carga | Ejecutor (HU-level) |
| `quality` | Analisis estatico, seguridad, deuda tecnica | Ejecutor (HU-level) |
| `deploy` | CI/CD, infraestructura, observabilidad | Ejecutor (HU-level) |
| `tracking` | Tiempo/tokens reales de la HU + reporte de tracking de la feature | Ejecutor (HU-level, ultima fase) |
| `architect` | Mantener architecture.md vivo (ADRs, C4, stack) | Transversal (bajo demanda) |
| `scaffold` | Scaffolding de nuevos servicios/proyectos | Transversal (bajo demanda) |

### Invocar un subagente directamente

Si necesitas una capacidad especifica:

```
@inception necesito iniciar el proyecto de facturacion electronica
@analysis define las historias de usuario para F001
@develop implementa el endpoint de creacion de facturas
@test genera pruebas de integracion para el modulo de pagos
```

## Skills disponibles

Los skills se activan automaticamente segun el contexto:

| Skill | Se activa cuando |
|-------|-----------------|
| `tdd-dotnet` | Implementacion de nueva funcionalidad en .NET (RED-GREEN-REFACTOR con xUnit + Moq) |
| `bdd-dotnet` | Definicion de criterios de aceptacion en .NET (Gherkin + Reqnroll) |
| `git-flow` | Gestion de ramas y versionado (hu/*, feature/*, develop, release/*, hotfix/*) |
| `dotnet-microservice` | Cualquier tarea que requiera convenciones de stack .NET, estructura y patrones |
| `python-fastapi` | Desarrollo con Python + FastAPI (convenciones, estructura, patrones) |
| `tdd-python` | Implementacion con TDD en Python usando pytest |
| `bdd-python` | Criterios de aceptacion en Python con Gherkin + Behave |
| `go-chi` | Desarrollo con Go + Chi (convenciones, estructura, patrones) |
| `tdd-go` | Implementacion con TDD en Go (testing + testify) |
| `bdd-go` | Criterios de aceptacion en Go con Gherkin + Godog |
| `spring-boot` | Desarrollo con Java + Spring Boot (convenciones, estructura, patrones) |
| `tdd-java` | Implementacion con TDD en Java (JUnit 5 + Mockito) |
| `bdd-java` | Criterios de aceptacion en Java con Gherkin + Cucumber-JVM |
| `node-express` | Desarrollo con Node.js + Express (convenciones, estructura, patrones) |
| `tdd-javascript` | Implementacion con TDD en Node.js (Jest) |
| `bdd-javascript` | Criterios de aceptacion en Node.js con Cucumber.js |
| `rust-axum` | Desarrollo con Rust + Axum (convenciones, estructura, patrones) |
| `tdd-rust` | Implementacion con TDD en Rust (cargo test) |
| `bdd-rust` | Criterios de aceptacion en Rust con Gherkin + cucumber-rs |

### Resolucion de skills por stack

Al definir el stack tecnologico durante `inception`, el leader verifica que los skills necesarios existan en la carpeta de skills de tu CLI (`.opencode/skills/` en opencode, `.claude/skills/` en Claude Code). Si falta algun skill para la tecnologia elegida, el leader lo informa al usuario y ofrece opciones para cargarlo o crearlo.

La columna `Skill` en la tabla de stack de `docs/architecture.md` permite el mapeo automatico:

| Capa | Skill esperado | Ejemplos |
|------|---------------|---------|
| Runtime / Framework | `{lenguaje}-{framework}` | `dotnet-microservice`, `python-fastapi`, `node-express`, `go-chi`, `spring-boot`, `rust-axum` |
| TDD | `tdd-{lenguaje}` | `tdd-dotnet`, `tdd-python`, `tdd-javascript`, `tdd-go`, `tdd-java`, `tdd-rust` |
| BDD | `bdd-{lenguaje}` | `bdd-dotnet`, `bdd-python`, `bdd-javascript`, `bdd-go`, `bdd-java`, `bdd-rust` |
| Git | `git-flow` | `git-flow` (universal, aplica a todos los stacks) |

## Comandos de gestion

El agente `features` gestiona el backlog y el archivo `.harness-state.json`:

### Features

```
@features status                          # Ver estado actual del proyecto
@features list features                   # Listar todas las features con sus HUs
@features feature start F001              # Inicia feature + crea rama feature/F001-{slug}
@features feature complete F001           # Push + crea PR hacia develop (marca in_review)
@features feature merge F001              # Tras aprobacion del PR, mergea y marca done
@features feature block F002 motivo="..." # Bloquear feature
@features phase complete F001 analysis    # Marcar fase feature como completada
@features phase start F001 design         # Iniciar siguiente fase feature
```

### Inception

```
@features inception start                 # Iniciar fase inception del proyecto
@features inception complete              # Completar fase inception
@features inception status                # Ver estado de inception
@features inception phase start {fase}    # Iniciar una fase especifica de inception
@features inception phase complete {fase} # Completar una fase especifica de inception
```

Fases de inception: `context`, `discovery`, `ddd`, `architecture`, `scaffold`, `environments`

### Historias de Usuario (HU)

```
@features hu create F001 US-001 "Registro Google"  # Registrar HU tras analysis
@features hu start F001 US-001                      # Crear rama hu/F001-US-001-{slug} + iniciar develop
@features hu complete F001 US-001                   # Push + crea PR de HU hacia la feature (marca in_review)
@features hu merge F001 US-001                      # Tras aprobacion del PR, mergea HU a la feature (marca done)
@features hu list F001                              # Listar HUs de la feature con estado
@features hu phase complete F001 US-001 develop     # Marcar fase HU como completada
@features hu phase start F001 US-001 test           # Iniciar siguiente fase HU
```

### Release y Hotfix

```
@features release start 1.2.0             # Crea rama release/1.2.0 desde develop
@features release complete 1.2.0          # Mergea a main (tag) y sincroniza de vuelta a develop
@features hotfix start fix-login-timeout  # Crea rama hotfix/{slug} desde main
@features hotfix complete fix-login-timeout # Mergea a main (tag) y sincroniza de vuelta a develop
```

No forman parte del pipeline de fases (no se trackean en `.harness-state.json` como `phases`); se invocan bajo demanda para cortar una version o atender un incidente en produccion. Siguen las mismas reglas de integridad de git flow: solo PR + CI verde hacia `main`/`develop`.

### Tareas (por HU)

```
@features tasks list F001 US-001           # Mostrar tareas de una HU
@features tasks progress F001 US-001       # Barra de progreso por capa
@features task done F001 US-001 T003       # Marcar tarea como completada
@features task start F001 US-001 T004      # Iniciar siguiente tarea
@features task block F001 US-001 T005 motivo="..." # Bloquear tarea
```

### Tracking (tiempo y tokens)

```
@features tracking record F001 US-001      # Persiste el JSON de tracking recibido del subagente `tracking`
@features tracking record F001             # Variante a nivel feature (analysis/design)
@features tracking report feature F001     # Regenera el reporte de tracking de una feature bajo demanda
@features tracking report global           # Regenera el reporte global del proyecto bajo demanda
```

Ver [Tracking de tiempo y tokens](#tracking-de-tiempo-y-tokens) para el mecanismo completo.

## Archivo de estado `.harness-state.json`

Persiste el progreso entre sesiones. Si cierras y vuelves a abrir tu CLI de agentes, el lider lee este archivo y retoma exactamente donde quedaste.

Inception se trackea en la raiz con sus 6 fases internas. Cada feature tiene su propio tracking de fases y sus HUs con fases independientes, lo que permite trazabilidad y paralelismo.

```json
{
  "project": "OrderService",
  "createdAt": "2026-05-26T00:00:00Z",
  "updatedAt": "2026-05-26T00:00:00Z",
  "humanInTheLoop": true,
  "inception": {
    "status": "completed",
    "approved": true,
    "startedAt": "2026-05-26T00:00:00Z",
    "completedAt": "2026-05-26T04:00:00Z",
    "phases": {
      "context":      { "status": "completed", "startedAt": "...", "completedAt": "..." },
      "discovery":    { "status": "completed", "startedAt": "...", "completedAt": "..." },
      "ddd":          { "status": "completed", "startedAt": "...", "completedAt": "..." },
      "architecture": { "status": "completed", "startedAt": "...", "completedAt": "..." },
      "scaffold":     { "status": "completed", "startedAt": "...", "completedAt": "..." },
      "environments": { "status": "completed", "startedAt": "...", "completedAt": "..." }
    }
  },
  "features": [
    {
      "id": "F001",
      "name": "Registro de usuarios con OAuth2",
      "slug": "registro-usuarios-oauth2",
      "description": "Implementar flujo de registro con Google y Microsoft",
      "status": "in_progress",
      "assignedTo": null,
      "docsPath": "docs/features/F001-registro-usuarios-oauth2/",
      "branch": "feature/F001-registro-usuarios-oauth2",
      "prUrl": null,
      "createdAt": "2026-05-26T00:00:00Z",
      "startedAt": "2026-05-26T02:00:00Z",
      "completedAt": null,
      "phases": {
        "analysis": { "status": "completed", "approved": true, "startedAt": "...", "completedAt": "..." },
        "design":   { "status": "completed", "approved": true, "startedAt": "...", "completedAt": "..." }
      },
      "userStories": [
        {
          "id": "US-001",
          "title": "Registro con Google OAuth2",
          "status": "in_progress",
          "branch": "hu/F001-US-001-registro-google-oauth2",
          "prUrl": null,
          "docsPath": "docs/features/F001-registro-usuarios-oauth2/US-001/",
          "phases": {
            "develop": { "status": "in_progress", "approved": false, "startedAt": "..." },
            "test":    { "status": "pending",     "approved": false },
            "quality": { "status": "pending",     "approved": false },
            "deploy":  { "status": "pending",     "approved": false }
          }
        }
      ]
    }
  ]
}
```

### Estados validos

**Inception (`inception.status`):**

| Estado | Significado |
|--------|-------------|
| `pending` | No se ha iniciado |
| `in_progress` | El subagente inception esta trabajando |
| `completed` | Finalizada con exito |

**Fases (`phases.<fase>.status`):** Aplica a fases de inception, feature y de HU

| Estado | Significado |
|--------|-------------|
| `pending` | No se ha iniciado |
| `in_progress` | El subagente correspondiente esta trabajando |
| `completed` | Finalizada con exito |
| `blocked` | Detenida por dependencia externa |

No existe un estado `rejected` separado: un `hitl reject` devuelve la fase de `completed`/`in_progress` a **`in_progress`** (conservando el `startedAt` original) y agrega `lastRejection: { "motivo": "...", "at": "..." }` al objeto de esa fase. El leader debe re-delegar la fase al subagente correspondiente incluyendo ese motivo antes de volver a pedir aprobacion.

**Fases de inception (6 fases internas):** `context`, `discovery`, `ddd`, `architecture`, `scaffold`, `environments`

**Features (`features[].status`):**

| Estado | Significado |
|--------|-------------|
| `pending` | En backlog, no iniciada |
| `in_progress` | Se esta implementando activamente |
| `in_review` | Pull request creado, esperando aprobacion |
| `done` | PR aprobado, mergeado y verificado |
| `blocked` | Bloqueada por dependencia |

**HUs (`features[{id}].userStories[{huId}].status`):**

| Estado | Significado |
|--------|-------------|
| `pending` | En backlog de la feature, no iniciada |
| `in_progress` | Se esta implementando (develop/test/quality/deploy activos) |
| `in_review` | Pull request de HU creado, esperando aprobacion |
| `done` | PR aprobado, mergeado a la feature |
| `blocked` | Bloqueada por dependencia |

## Flujo de trabajo tipico

```
1. "Crear un sistema de facturacion electronica para pymes"
   └─ leader -> inception (vision, DDD, arquitectura, scaffold, walking skeleton, tooling)
   └─ El usuario co-crea cada artefacto en conversacion con el agente inception

2. (inception completada y aprobada, walking skeleton funcionando)
   └─ leader -> analysis F001 (historias de usuario + criterios Gherkin)

3. (analysis completada, HUs identificadas)
   └─ features registra US-001, US-002, US-003

4. (design completada, tasks.json generados por HU)
   └─ leader -> develop US-001 (implementacion con TDD)
   └─ leader -> develop US-002 (en paralelo si aplica)

5. (develop US-001 completado)
   └─ leader -> test US-001 (pruebas unitarias, integracion)

6. (test US-001 completado)
   └─ leader -> quality US-001 (analisis estatico, seguridad)

7. (quality US-001 completado)
   └─ leader -> deploy US-001 (CI/CD, health checks)
   └─ features hu complete (crea PR de HU → feature)
   └─ (tras aprobacion del PR)
   └─ features hu merge (mergea HU a la feature)

8. (todas las HUs completadas y mergeadas)
   └─ features feature complete (crea PR a develop)
```

## Estructura generada

```
mi-proyecto/
├── .harness-state.json
├── src/
│   ├── {Service}.Api/
│   ├── {Service}.Application/
│   ├── {Service}.Domain/
│   ├── {Service}.Infrastructure/
│   └── {Service}.Contracts/
├── tests/
│   ├── {Service}.UnitTests/
│   ├── {Service}.IntegrationTests/
│   └── {Service}.ContractTests/
├── docs/
│   ├── inception/                           # Artefactos fundacionales del proyecto
│   │   ├── product-brief.md
│   │   ├── stakeholder-map.md
│   │   ├── feature-backlog.md
│   │   ├── risk-register.md
│   │   ├── nfr-catalog.md
│   │   ├── success-metrics.md
│   │   ├── technology-constraints.md
│   │   ├── domain-model.md
│   │   ├── ubiquitous-language.md
│   │   ├── domain-events.md
│   │   ├── business-rules.md
│   │   ├── quality-tooling.md
│   │   └── walking-skeleton.md               # Guia de implementacion del walking skeleton
│   ├── architecture.md                     # ADRs, C4, stack tecnologico
│   └── features/                           # Una carpeta por feature
│       └── F001-registro-usuarios-oauth2/
│       ├── user-stories.md            # analysis (feature): todas las HUs con criterios Gherkin embebidos
│       ├── api-contract.yaml          # design (feature): contratos API
│           ├── data-model.md                # design (feature): datos
│           ├── US-001/
│           │   ├── tasks.json               # design: tareas de develop
│           │   ├── test-report.md           # test
│           │   ├── quality-report.md        # quality
│           │   └── deploy-config.md         # deploy
│           └── US-002/
│               ├── tasks.json
│               ├── test-report.md
│               ├── quality-report.md
│               └── deploy-config.md
├── docker-compose.yml
├── Dockerfile
└── {Service}.sln
```

## Reglas del proceso

- **Inception es prerrequisito**: ninguna feature puede iniciar sin inception completada y aprobada
- **Inception co-creativa**: inception se construye en conversacion con el usuario, no automaticamente
- **Walking skeleton**: al completar inception, existe una funcionalidad ejemplo funcional que recorre todas las capas
- **Inception HITL obligatorio**: inception siempre requiere aprobacion explicita del usuario, sin importar el valor de `humanInTheLoop`
- **Fases de inception trackeadas**: 6 fases internas (`context`, `discovery`, `ddd`, `architecture`, `scaffold`, `environments`) se persisten en `.harness-state.json` para retomar desde donde se quedo
- **Fases mixtas**: analysis y design son por feature. develop, test, quality, deploy son por HU
- **Multiples features en progreso**: se permite que mas de una feature este `in_progress` simultaneamente
- **Multiples HUs en progreso**: dentro de una feature, varias HUs pueden avanzar en paralelo
- **Una fase a la vez por HU**: dentro de una HU, no se avanza a la siguiente fase sin completar la actual
- **Rama por feature**: `feature start` crea `feature/{id}-{slug}` desde `develop`
- **Rama por HU**: `hu start` crea `hu/{featureId}-{huId}-{slug}` desde la rama feature. Al completar, crea PR hacia la feature. Tras aprobacion, mergea
- **Git Flow**: `hu/*` → `feature/*` → `develop` → `release/*` → `main`
- **BDD en analysis**: criterios de aceptacion en Gherkin (Given-When-Then) antes de implementar
- **TDD en develop**: RED → GREEN → REFACTOR en cada tarea de implementacion por HU
- **Tasks por HU**: cada HU tiene su propio `tasks.json` en `docs/features/{id}-{slug}/US-{huId}/`
- **architecture.md vivo**: creado por inception, mantenido por el agente transversal `architect`
- **Stack tecnologico en architecture.md**: definido durante `inception`
- **Persistencia automatica**: cada cambio de fase, feature, HU, tarea o TDD se guarda en `.harness-state.json`
- **Resiliencia entre sesiones**: al reabrir tu CLI de agentes se retoma el estado anterior, incluyendo la HU, tarea y paso TDD exacto
- **Human in the Loop (HITL)**: opcional (excepto en inception, donde es obligatorio). Si esta activo, cada fase requiere aprobacion explicita
- **Tracking de tiempo/tokens**: `tracking` es la ultima fase HU-level; nunca se estima un valor de tokens sin una fuente real (ver [Tracking de tiempo y tokens](#tracking-de-tiempo-y-tokens))

## Flujo de integracion (Git Flow)

El flujo de ramas es **unidireccional** y **estricto**. El agente `features` es el guardian del flujo.

```
hu/* ──PR──▶ feature/* ──PR──▶ develop ──release/*──▶ main ──release/*──▶ main
                                  ▲                    │
                                  └──hotfix/*──────────┘
```

| Rama | Recibe de | Entrega a | Protegida | Push directo |
|------|-----------|-----------|-----------|--------------|
| `main` | `release/*`, `hotfix/*` | — | ✅ Solo PR + CI verde | ❌ NUNCA |
| `develop` | `feature/*`, `release/*` | `release/*` | ✅ Solo PR + CI verde | ❌ NUNCA |
| `feature/*` | `hu/*` | `develop` via PR | ❌ | ✅ Ok durante desarrollo |
| `hu/*` | — | `feature/*` via PR | ❌ | ✅ Ok durante desarrollo |
| `release/*` | `develop` | `main` + `develop` | ❌ | ❌ |
| `hotfix/*` | `main` | `main` + `develop` | ❌ | ❌ |

**Reglas de integridad del flujo:**

1. **Nunca hacer push directo a `main` ni `develop`.** Solo PRs.
2. **Nunca mergear `main` → `develop`.** Si `main` tiene codigo que `develop` no tiene, el flujo esta roto.
3. Las ramas `hu/*` se crean desde `feature/*` y se mergean via PR a `feature/*` al completar la HU.
4. Las ramas `feature/*` se crean desde `develop` y se mergean via PR a `develop`.
5. El agente `features` verifica divergencia antes de crear cualquier rama.
6. El agente lider verifica divergencia al iniciar sesion y advierte si `develop` no esta sincronizado.

## Tracking de tiempo y tokens

El pipeline trackea cuanto tiempo y cuantos tokens consume cada fase, con reportes por feature (desglose por HU y por tarea) y global (resumen por feature), pensados para identificar en que fase del pipeline se gasta mas.

### Como se capturan los datos

Los agentes (instrucciones en markdown para opencode/Claude Code) no tienen forma de saber por si mismos cuantos tokens consumieron — no hay una API expuesta a un subagente para eso. El calculo lo hace un subcomando del paquete npm de este harness (`npx @idsanchezf/harness-engineering track collect`), usando fuentes reales de datos por fuera del agente:

- **Claude Code**: cada invocacion de subagente (Task tool) escribe su propio transcript aislado en `~/.claude/projects/<proyecto>/<sesion>/subagents/agent-{id}.jsonl` (Windows: `%USERPROFILE%\.claude\projects\...`), con `usage` real (input/output/cache tokens) y `timestamp` por mensaje.
- **opencode**: `opencode stats --days N --project <path>` (uso/costo agregado). Menos preciso que Claude Code porque agrega por rango de dias, no por fase especifica.

**El leader nunca inventa ni estima un numero de tokens.** Si `track collect` no encuentra una fuente real para una fase o tarea, esa entrada queda `"tokensSource": "unavailable"` / `"tokens": null`, y los reportes la muestran como "N/D" explicitamente — nunca un valor adivinado.

### Convencion obligatoria: `description` del Task

Como el `leader` siempre delega el trabajo de cada fase a un subagente puro vía Task, y cada invocacion de Task en Claude Code genera su propio archivo aislado, `track collect` puede mapear cada fase del pipeline a su archivo exacto **si** el leader sigue esta convencion al delegar (ver "Protocolo de delegacion" en `leader.md`):

- Feature-level: `"{fase} {featureId}"` (ej. `"analysis F001"`)
- HU-level: `"{fase} {featureId} {huId}"` (ej. `"develop F001 US-001"`)
- Inception: `"{fase}"` (ej. `"discovery"`)

Sin esta convencion, el tracking cae a un fallback por ventana de tiempo (`startedAt`/`completedAt` de la fase vs. el rango del transcript) — funciona, pero es menos preciso y puede generar advertencias si varias fases se solapan en el tiempo.

### Donde viven los reportes

- `docs/features/{id}-{slug}/tracking-report.md` — reporte por feature: resumen, desglose por HU, por HU y fase, por HU y tarea, consumo por tipo de fase (develop/test/quality/deploy/tracking), metricas derivadas, cobertura de datos
- `docs/tracking/global-report.md` — reporte global en markdown: resumen por feature, consumo por tipo de fase a nivel proyecto, top HUs/tareas mas costosas, tendencia por fecha de feature completada
- `docs/tracking/dashboard.html` — **dashboard HTML interactivo**, generado por `track dashboard`: una pagina autocontenida (sin dependencias, sin llamadas de red, funciona abierta directo desde el filesystem) con una vista global — tarjetas de resumen, tabla de features, barras de consumo por tipo de fase — y drilldown: al hacer click en una feature se muestra su detalle completo (HUs, fases, tareas), con un boton para volver al resumen. Pensado para compartir con el equipo sin necesitar abrir varios `.md`

Se actualizan automaticamente cuando una HU completa su fase `tracking` (reporte de feature) y cuando una feature se mergea (`feature merge`, reporte global + dashboard), ademas de bajo demanda via `@features tracking report feature {id}` / `@features tracking report global`.

### Riesgos y limitaciones (comunicados en los propios reportes, seccion "Cobertura y limitaciones")

1. El formato interno de los transcripts de Claude Code puede cambiar entre versiones — el parser es defensivo y degrada a "N/D" en vez de fallar.
2. El schema exacto de `opencode export` no esta confirmado — v1 solo usa `opencode stats` (documentado), mas agregado y menos preciso por fase.
3. Sin la convencion de `description`, el fallback por ventana de tiempo puede confundir fases que corren en paralelo (menos relevante para HU-level, ya que el pipeline evita paralelizar fases de la misma HU).
4. Transcripts rotados/borrados (limpieza de disco, proyecto muy viejo) → "N/D", nunca estimado.
5. Costo en USD: disponible para opencode (via `stats`), "N/D" para Claude Code (no se hardcodea una tabla de precios por modelo, quedaria desactualizada).
6. Un `hitl reject` conserva el `startedAt` original de la fase — su tracking incluye el trabajo del intento rechazado (costo total hasta la version aprobada, no un bug).
7. Si `npx` falla (sin red, sin credenciales de GitHub Packages), la fase `tracking` se completa igual, solo con datos "N/D" — nunca bloquea el pipeline.
8. El parser solo lee `usage`/`timestamp`/`description` de los transcripts — nunca copia contenido de mensajes (codigo, texto del usuario) a los reportes.
9. `inception` no esta incluida en el tracking en esta version (queda para una version futura).

## Instrucciones generales

- La tecnologia y stack se definen durante `inception` y se persisten en `docs/architecture.md`
- El modelo de dominio (DDD) se define durante `inception` en `docs/inception/`
- Seguir Clean Architecture / patron modular y principios SOLID adaptados al stack elegido
- Generar siempre health checks, logging estructurado y metricas
- Usar estrategia Git Flow: `hu/*` → `feature/*` → `develop` → `release/*` → `main`
- Aplicar BDD (skill `bdd-{lenguaje}`) en analysis para criterios de aceptacion
- Aplicar TDD (skill `tdd-{lenguaje}`) en develop para implementacion por HU
- Mantener vivo `docs/architecture.md` con ADRs actualizados via agente transversal `architect`
- El leader verifica que los skills necesarios existan para el stack elegido antes de delegar a subagentes
