# Harness Engineering — Plantilla de Ingenieria de Software con Agentes

Plantilla de ingenieria de arneses con opencode que orquesta el ciclo de vida completo de software mediante agentes especializados. Agnostica a tecnologias: el stack se define en la fase de diseno.

## Requisitos previos

- [opencode](https://opencode.ai) instalado
- Docker Desktop (opcional, para contenerizacion)
- Git

## Inicio rapido

### 1. Clona o copia esta plantilla en tu proyecto

```powershell
cp -Recurse C:\@idsanchezf\harness-engineering\* .\mi-microservicio\
cd .\mi-microservicio
```

### 2. Inicia opencode en el directorio

```powershell
opencode
```

El agente lider `leader` se activa automaticamente como agente por defecto. Al iniciar:

- Lee `.harness-state.json` para conocer el estado del proyecto
- Si el archivo no existe, lo crea e inicia en fase `analysis`
- Si existe, retoma desde la fase/feature donde se quedo

### 3. Comienza con una solicitud

Escribe en lenguaje natural lo que necesitas:

```
Crear un microservicio de gestion de pedidos para un e-commerce
```

El lider evaluara la solicitud y delegara al subagente correspondiente.

## Agentes disponibles

| Agente | Invocacion directa | Capacidad |
|--------|-------------------|-----------|
| `leader` | default (automatico) | Orquestador unico del proceso |
| `features` | Gestion de backlog, ramas y estado | Transversal |
| `analysis` | DDD, event storming, requerimientos | Ejecutor |
| `architect` | Definicion de `architecture.md` (ADR, C4) | Ejecutor |
| `design` | Contratos API, modelo de datos, integracion | Ejecutor |
| `scaffold` | Creacion de solucion y Docker | Ejecutor |
| `develop` | Implementacion de funcionalidad | Ejecutor |
| `test` | Pruebas unitarias, integracion, carga | Ejecutor |
| `quality` | Analisis estatico, seguridad, deuda tecnica | Ejecutor |
| `deploy` | CI/CD, Kubernetes, observabilidad | Ejecutor |

### Invocar un subagente directamente

Si necesitas una capacidad especifica:

```
@analysis necesito analizar el dominio de facturacion electronica
@develop implementa el endpoint de creacion de facturas
@test genera pruebas de integracion para el modulo de pagos
```

### Comandos de gestion de features

El agente `features` gestiona el backlog y el archivo `.harness-state.json`:

```
@features status                    # Ver estado actual del proyecto
@features list features             # Listar todas las features
@features start F001                # Inicia feature + crea rama feature/F001-{slug}
@features complete F001             # Push + crea PR hacia develop (marca in_review)
@features merge F001                # Tras aprobacion del PR, mergea y marca done

### Comandos de tareas (checklist)

Cada feature tiene su `tasks.json` en `docs/features/{id}-{slug}/tasks.json`.

@features tasks progress F001         # Barra de progreso por capa
@features task done F001 T003          # Marcar tarea como completada
@features task start F001 T004         # Iniciar siguiente tarea
@features block F002 motivo="..."   # Bloquear feature
@features phase complete F001 develop    # Marcar fase como completada
@features phase start F001 test          # Iniciar siguiente fase
```

## Archivo de estado `.harness-state.json`

Persiste el progreso entre sesiones. Si cierras opencode y vuelves a abrirlo, el lider lee este archivo y retoma exactamente donde quedaste.

Cada feature tiene su propio tracking de fases, lo que permite trazabilidad independiente y multiples features en progreso simultaneamente.

```json
{
  "project": "OrderService",
  "createdAt": "2026-05-26T00:00:00Z",
  "updatedAt": "2026-05-26T00:00:00Z",
  "humanInTheLoop": true,
  "features": [
    {
      "id": "F001",
      "name": "Registro de usuarios con OAuth2",
      "slug": "registro-usuarios-oauth2",
      "description": "Implementar flujo de registro con Google y Microsoft",
      "status": "in_progress",
      "assignedTo": "develop",
      "docsPath": "docs/features/F001-registro-usuarios-oauth2/",
      "branch": "feature/F001-registro-usuarios-oauth2",
      "createdAt": "2026-05-26T00:00:00Z",
      "startedAt": "2026-05-26T02:00:00Z",
      "phases": {
        "analysis":   { "status": "completed",  "approved": true, "startedAt": "...", "completedAt": "..." },
        "architect":  { "status": "completed",  "approved": true, "startedAt": "...", "completedAt": "..." },
        "design":     { "status": "completed",  "approved": true, "startedAt": "...", "completedAt": "..." },
        "scaffold":   { "status": "completed",  "approved": true, "startedAt": "...", "completedAt": "..." },
        "develop":    { "status": "in_progress", "approved": false, "startedAt": "..." },
        "test":       { "status": "pending",     "approved": false },
        "quality":    { "status": "pending",     "approved": false },
        "deploy":     { "status": "pending",     "approved": false }
      },
      "tdd": {
        "step": "red",
        "class": "CreateOrderHandler",
        "method": "HandleAsync",
        "testFile": "tests/OrderService.UnitTests/Application/Orders/CreateOrderHandlerTests/HandleAsyncTests.cs",
        "scenario": "Should_ReturnError_When_ProductNotFound",
        "scenariosCompleted": ["Should_CreateOrder_When_CommandIsValid"],
        "scenariosPending": [
          "Should_ReturnError_When_ProductNotFound",
          "Should_RollbackInventory_When_PaymentFails"
        ]
      }
    },
    {
      "id": "F002",
      "name": "Integracion con pasarela de pago",
      "slug": "integracion-pasarela-pago",
      "description": "Integrar Stripe como proveedor de pagos",
      "status": "in_progress",
      "assignedTo": "develop",
      "docsPath": "docs/features/F002-integracion-pasarela-pago/",
      "branch": "feature/F002-integracion-pasarela-pago",
      "createdAt": "2026-05-26T00:00:00Z",
      "startedAt": "2026-05-26T02:00:00Z",
      "phases": {
        "analysis":   { "status": "completed",  "approved": true, "startedAt": "...", "completedAt": "..." },
        "architect":  { "status": "pending",     "approved": false },
        "design":     { "status": "pending",     "approved": false },
        "scaffold":   { "status": "pending",     "approved": false },
        "develop":    { "status": "pending",     "approved": false },
        "test":       { "status": "pending",     "approved": false },
        "quality":    { "status": "pending",     "approved": false },
        "deploy":     { "status": "pending",     "approved": false }
      }
    }
  ]
}
```

### Estados validos

**Fases (`phases.<fase>.status`):**

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

## Flujo de trabajo tipico

```
1. "Crear un microservicio de catalogo de productos"
   └─ leader -> analysis  (DDD, bounded contexts, eventos de dominio)

2. (analysis completa)
   └─ leader -> architect (docs/architecture.md, ADR, diagramas C4)

3. (architect completa)
   └─ leader -> design    (contratos, modelo de datos, patrones integracion)

4. (design completa)
   └─ leader -> scaffold  (creacion de solucion, Dockerfile, docker-compose)

5. "Agregar feature: busqueda de productos por categoria"
   └─ leader -> features  (crea rama feature/F004-busqueda-productos)
   └─ leader -> develop   (implementacion con TDD)

6. "Probar la feature F001"
   └─ leader -> test      (unitarias, integracion, contract testing)

7. "Revisar calidad del codigo"
   └─ leader -> quality   (analisis estatico, seguridad, cobertura)

8. "Preparar despliegue"
   └─ leader -> deploy    (CI/CD pipeline, health checks)
```

## Estructura generada por `scaffold`

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
│   ├── analysis/                           # Artefactos globales del proyecto
│   │   ├── domain-model.md
│   │   └── business-rules.md
│   ├── architecture.md                     # ADRs, C4, stack tecnologico
│   └── features/                           # Una carpeta por feature
│       ├── F001-registro-usuarios-oauth2/
│       │   ├── analysis.md
│       │   ├── api-contract.yaml
│       │   ├── data-model.md
│       │   └── tasks.json
│       └── F002-gestion-ordenes-compra/
│           ├── analysis.md
│           ├── api-contract.yaml
│           ├── data-model.md
│           └── tasks.json
├── docker-compose.yml
└── Dockerfile
```

## Skills disponibles

Los skills se activan automaticamente segun el contexto. La plantilla incluye skills para multiples stacks. El leader resuelve cual usar segun el stack definido en `architecture.md`.

| Skill | Se activa cuando |
|-------|-----------------|
| `dotnet-microservice` | Cualquier tarea .NET Core (stack, estructura, patrones) |
| `tdd-dotnet` | TDD para .NET (RED-GREEN-REFACTOR con xUnit + Moq) |
| `bdd-dotnet` | BDD para .NET (Gherkin + Reqnroll) |
| `python-fastapi` | Desarrollo con Python + FastAPI |
| `tdd-pytest` | TDD para Python (pytest) |
| `bdd-python` | BDD para Python (Behave) |
| `go-chi` | Desarrollo con Go + Chi |
| `tdd-go` | TDD para Go (testing + testify) |
| `spring-boot` | Desarrollo con Java + Spring Boot |
| `tdd-junit` | TDD para Java (JUnit 5 + Mockito) |
| `node-express` | Desarrollo con Node.js + Express |
| `tdd-jest` | TDD para Node.js (Jest) |
| `bdd-javascript` | BDD para Node.js (Cucumber.js) |
| `rust-axum` | Desarrollo con Rust + Axum |
| `tdd-rust` | TDD para Rust (cargo test) |
| `git-flow` | Gestion de ramas y versionado (feature/*, develop, release/*) |

Si el stack elegido no tiene skill, el leader ofrece cargarlo de la comunidad o crearlo en conjunto.

## Reglas del proceso

- **Fases por feature**: cada feature tiene su propio tracking de fases, con trazabilidad independiente
- **Multiples features en progreso**: se permite que mas de una feature este `in_progress` simultaneamente
- **Una fase a la vez por feature**: dentro de una feature, no se avanza a la siguiente fase sin completar la actual
- **Rama por feature**: `@features start` crea automaticamente `feature/{id}-{slug}` desde `develop`
- **Git Flow**: `feature/*` -> `develop` -> `release/*` -> `main`
- **TDD obligatorio**: RED -> GREEN -> REFACTOR en cada tarea de implementacion
- **BDD para aceptacion**: criterios en Gherkin antes de implementar
- **architecture.md vivo**: cada decision arquitectonica genera un ADR en `docs/architecture.md`
- **Stack tecnologico en architecture.md**: la tecnologia y stack se definen durante la fase `design` y se persisten en `docs/architecture.md` en la seccion "Stack tecnologico". La plantilla es agnostica a tecnologias.
- **Checklist de tareas**: generada por `design`, marcada por `develop` al completar cada tarea en `docs/features/{id}-{slug}/tasks.json`
- **Persistencia automatica**: cada cambio de fase, feature, tarea o TDD se guarda en `.harness-state.json`
- **Resiliencia entre sesiones**: al reabrir opencode se retoma el estado anterior, incluyendo la tarea y el paso TDD exacto
- **Human in the Loop (HITL)**: opcional. Si esta activo, cada fase requiere aprobacion explicita del usuario antes de avanzar
