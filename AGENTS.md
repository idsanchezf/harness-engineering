# AGENTS.md

## Harness Engineering

Este proyecto utiliza ingenieria de arneses con opencode para orquestar el ciclo de vida completo de software mediante agentes especializados.

## Requisitos previos

- [opencode](https://opencode.ai) instalado
- Docker Desktop (opcional, para contenerizacion)
- Git

## Inicio rapido

### 1. Clona o copia esta plantilla en tu proyecto

```powershell
cp -Recurse .\harness-engineering\* .\mi-proyecto\
cd .\mi-proyecto
```

### 2. Inicia opencode en el directorio

```powershell
opencode
```

El agente lider `leader` se activa automaticamente como agente por defecto. Al iniciar:

- Lee `.harness-state.json` para conocer el estado del proyecto
- Si el archivo no existe, lo crea e inicia la fase `inception`
- Si existe y `inception` esta pendiente, inicia inception
- Si `inception` esta completada, retoma desde la feature/fase donde se quedo

### 3. Comienza con una solicitud

Escribe en lenguaje natural lo que necesitas. El lider evaluara la solicitud y delegara al subagente correspondiente.

## Pipeline del SDLC

### Inception (pre-fase de proyecto, una sola vez)

Antes de cualquier feature, el proyecto pasa por `inception`. Esta fase produce todos los artefactos fundacionales:

- Vision, alcance, stakeholders, backlog de features
- Riesgos, NFRs, KPIs, restricciones tecnologicas
- Modelo de dominio (DDD): bounded contexts, entidades, value objects, eventos de dominio
- Arquitectura inicial: stack tecnologico, patrones, C4, ADRs → `docs/architecture.md`
- Scaffold del proyecto: solucion, Docker, ambientes, tooling de calidad/seguridad

### Pipeline por feature (2 fases feature-level)

```
analysis → design
```

| Fase | Agente | Proposito | Nivel |
|------|--------|-----------|-------|
| `analysis` | `analysis` | Historias de usuario detalladas + criterios de aceptacion Gherkin (BDD) para la feature | Feature |
| `design` | `design` | Contratos API, modelo de datos, y genera `tasks.json` por cada HU | Feature |

### Pipeline por HU (4 fases HU-level)

Cada historia de usuario (HU) dentro de la feature tiene su propio pipeline:

```
develop → test → quality → deploy
```

| Fase | Agente | Proposito | Nivel |
|------|--------|-----------|-------|
| `develop` | `develop` | Implementacion con TDD | HU |
| `test` | `test` | Unitarias, integracion, contract testing | HU |
| `quality` | `quality` | Analisis estatico, seguridad, deuda tecnica | HU |
| `deploy` | `deploy` | CI/CD, infraestructura, observabilidad | HU |

## Estructura

```
.opencode/
  agents/
    leader.md      # Agente lider (orquestador principal)
    inception.md   # Discovery, DDD, arquitectura, scaffold, tooling (una vez)
    analysis.md    # User stories + criterios Gherkin (BDD)
    architect.md   # Transversal: mantiene architecture.md vivo
    design.md      # Contratos API, modelo de datos, integracion
    scaffold.md    # Transversal: scaffolding bajo demanda
    develop.md     # Implementacion y codificacion
    test.md        # Estrategia de pruebas
    quality.md     # Calidad de codigo y seguridad
    deploy.md      # CI/CD, infraestructura, despliegue
    features.md    # Gestion de features, HUs, backlog, ramas, estado
  skills/
    dotnet-microservice/   # Convenciones .NET Core
      SKILL.md
    tdd-dotnet/            # TDD para .NET (xUnit + Moq)
      SKILL.md
    bdd-dotnet/            # BDD para .NET (Gherkin + Reqnroll)
      SKILL.md
    python-fastapi/        # Convenciones Python + FastAPI
      SKILL.md
    tdd-pytest/            # TDD para Python (pytest)
      SKILL.md
    bdd-python/            # BDD para Python (Behave)
      SKILL.md
    go-chi/                # Convenciones Go + Chi
      SKILL.md
    tdd-go/                # TDD para Go (testing + testify)
      SKILL.md
    spring-boot/           # Convenciones Java + Spring Boot
      SKILL.md
    tdd-junit/             # TDD para Java (JUnit 5 + Mockito)
      SKILL.md
    node-express/          # Convenciones Node.js + Express
      SKILL.md
    tdd-jest/              # TDD para Node.js (Jest)
      SKILL.md
    bdd-javascript/        # BDD para Node.js (Cucumber.js)
      SKILL.md
    rust-axum/             # Convenciones Rust + Axum
      SKILL.md
    tdd-rust/              # TDD para Rust (cargo test)
      SKILL.md
    git-flow/              # Estrategia de branching (universal)
      SKILL.md
```

## Agentes disponibles

| Agente | Invocacion directa | Capacidad |
|--------|-------------------|-----------|
| `leader` | default (automatico) | Orquestador unico del proceso |
| `features` | Gestion de backlog, ramas y estado | Transversal |
| `inception` | Discovery, DDD, arquitectura, scaffold, tooling | Pre-fase de proyecto (una vez) |
| `analysis` | User stories + Gherkin BDD | Ejecutor (feature-level) |
| `design` | Contratos API, modelo de datos, tasks por HU | Ejecutor (feature-level) |
| `develop` | Implementacion de funcionalidad con TDD | Ejecutor (HU-level) |
| `test` | Pruebas unitarias, integracion, carga | Ejecutor (HU-level) |
| `quality` | Analisis estatico, seguridad, deuda tecnica | Ejecutor (HU-level) |
| `deploy` | CI/CD, infraestructura, observabilidad | Ejecutor (HU-level) |
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
| `git-flow` | Gestion de ramas y versionado (feature/*, hu/*, develop, release/*) |
| `dotnet-microservice` | Cualquier tarea que requiera convenciones de stack .NET, estructura y patrones |
| `python-fastapi` | Desarrollo con Python + FastAPI (convenciones, estructura, patrones) |
| `tdd-pytest` | Implementacion con TDD en Python usando pytest |
| `bdd-python` | Criterios de aceptacion en Python con Gherkin + Behave |
| `go-chi` | Desarrollo con Go + Chi (convenciones, estructura, patrones) |
| `tdd-go` | Implementacion con TDD en Go (testing + testify) |
| `spring-boot` | Desarrollo con Java + Spring Boot (convenciones, estructura, patrones) |
| `tdd-junit` | Implementacion con TDD en Java (JUnit 5 + Mockito) |
| `node-express` | Desarrollo con Node.js + Express (convenciones, estructura, patrones) |
| `tdd-jest` | Implementacion con TDD en Node.js (Jest) |
| `bdd-javascript` | Criterios de aceptacion en Node.js con Cucumber.js |
| `rust-axum` | Desarrollo con Rust + Axum (convenciones, estructura, patrones) |
| `tdd-rust` | Implementacion con TDD en Rust (cargo test) |

### Resolucion de skills por stack

Al definir el stack tecnologico durante `inception`, el leader verifica que los skills necesarios existan en `.opencode/skills/`. Si falta algun skill para la tecnologia elegida, el leader lo informa al usuario y ofrece opciones para cargarlo o crearlo.

La columna `Skill` en la tabla de stack de `docs/architecture.md` permite el mapeo automatico:

| Capa | Skill esperado | Ejemplos |
|------|---------------|---------|
| Runtime / Framework | `{lenguaje}-{framework}` | `dotnet-microservice`, `python-fastapi`, `node-express`, `go-chi`, `spring-boot`, `rust-axum` |
| TDD | `tdd-{lenguaje}` | `tdd-dotnet`, `tdd-pytest`, `tdd-jest`, `tdd-go`, `tdd-junit`, `tdd-rust` |
| BDD | `bdd-{lenguaje}` | `bdd-dotnet`, `bdd-python`, `bdd-javascript` |
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
```

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

### Tareas (por HU)

```
@features tasks list F001 US-001           # Mostrar tareas de una HU
@features tasks progress F001 US-001       # Barra de progreso por capa
@features task done F001 US-001 T003       # Marcar tarea como completada
@features task start F001 US-001 T004      # Iniciar siguiente tarea
@features task block F001 US-001 T005 motivo="..." # Bloquear tarea
```

## Archivo de estado `.harness-state.json`

Persiste el progreso entre sesiones. Si cierras opencode y vuelves a abrirlo, el lider lee este archivo y retoma exactamente donde quedaste.

Inception se trackea en la raiz. Cada feature tiene su propio tracking de fases y sus HUs con fases independientes, lo que permite trazabilidad y paralelismo.

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
    "completedAt": "2026-05-26T04:00:00Z"
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
      "createdAt": "2026-05-26T00:00:00Z",
      "startedAt": "2026-05-26T02:00:00Z",
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
          "docsPath": "docs/features/F001-registro-usuarios-oauth2/US-001/",
          "phases": {
            "develop": { "status": "in_progress", "approved": false, "startedAt": "..." },
            "test":    { "status": "pending",     "approved": false },
            "quality": { "status": "pending",     "approved": false },
            "deploy":  { "status": "pending",     "approved": false }
          },
          "tdd": {
            "step": "red",
            "class": "GoogleOAuthHandler",
            "method": "HandleAsync",
            "testFile": "tests/.../HandleAsyncTests.cs",
            "scenario": "Should_ReturnToken_When_GoogleCodeIsValid",
            "scenariosCompleted": [],
            "scenariosPending": ["Should_ReturnToken_When_GoogleCodeIsValid"]
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

**Fases (`phases.<fase>.status`):** Aplica a fases de feature y de HU

| Estado | Significado |
|--------|-------------|
| `pending` | No se ha iniciado |
| `in_progress` | El subagente correspondiente esta trabajando |
| `completed` | Finalizada con exito |
| `blocked` | Detenida por dependencia externa |

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
   └─ leader -> inception (vision, DDD, arquitectura, scaffold, tooling)

2. (inception completada y aprobada)
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
│   │   └── quality-tooling.md
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
- **Inception HITL obligatorio**: inception siempre requiere aprobacion explicita del usuario, sin importar el valor de `humanInTheLoop`
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
- **Resiliencia entre sesiones**: al reabrir opencode se retoma el estado anterior, incluyendo la HU, tarea y paso TDD exacto
- **Human in the Loop (HITL)**: opcional (excepto en inception, donde es obligatorio). Si esta activo, cada fase requiere aprobacion explicita

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
6. El agente `leader` verifica divergencia al iniciar sesion y advierte si `develop` no esta sincronizado.

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
