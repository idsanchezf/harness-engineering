# Harness Engineering — Plantilla para Microservicios .NET Core

Plantilla de ingenieria de arneses con opencode que orquesta el ciclo de vida completo de microservicios .NET Core mediante agentes especializados.

## Requisitos previos

- [opencode](https://opencode.ai) instalado
- .NET SDK (ultima version LTS)
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

| Agente | Invocacion directa | Fase |
|--------|-------------------|------|
| `leader` | default (automatico) | Orquestacion |
| `features` | Gestion de backlog, ramas y estado | Transversal |
| `analysis` | DDD, event storming, requerimientos | 1 |
| `architect` | Definicion de `architecture.md` (ADR, C4) | 2a |
| `design` | Contratos API, modelo de datos, integracion | 2b |
| `scaffold` | Creacion de solucion .NET y Docker | 3 |
| `develop` | Implementacion de funcionalidad | 4 |
| `test` | Pruebas unitarias, integracion, carga | 5 |
| `quality` | Analisis estatico, seguridad, deuda tecnica | 6 |
| `deploy` | CI/CD, Kubernetes, observabilidad | 7 |

### Invocar un subagente directamente

Si necesitas saltar a una fase especifica:

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
@features phase complete develop    # Marcar fase como completada
@features phase start test          # Iniciar siguiente fase
```

## Archivo de estado `.harness-state.json`

Persiste el progreso entre sesiones. Si cierras opencode y vuelves a abrirlo, el lider lee este archivo y retoma exactamente donde quedaste.

```json
{
  "project": "OrderService",
  "currentPhase": "develop",
  "phases": {
    "analysis":  { "status": "completed" },
    "architect": { "status": "completed" },
    "design":    { "status": "completed" },
    "scaffold":  { "status": "completed" },
    "develop":   { "status": "in_progress" },
    "test":      { "status": "pending" },
    "quality":   { "status": "pending" },
    "deploy":    { "status": "pending" }
  },
  "features": [
    { "id": "F001", "name": "Crear pedido", "status": "done" },
    { "id": "F002", "name": "Cancelar pedido", "status": "in_progress" },
    { "id": "F003", "name": "Consultar estado", "status": "pending" }
  ]
}
```

## Flujo de trabajo tipico

```
1. "Crear un microservicio de catalogo de productos"
   └─ leader -> analysis  (DDD, bounded contexts, eventos de dominio)

2. (analysis completa)
   └─ leader -> architect (docs/architecture.md, ADR, diagramas C4)

3. (architect completa)
   └─ leader -> design    (contratos REST, modelo ER, patrones integracion)

4. (design completa)
   └─ leader -> scaffold  (dotnet new, Dockerfile, docker-compose)

5. "Agregar feature: busqueda de productos por categoria"
   └─ leader -> features  (crea rama feature/F004-busqueda-productos)
   └─ leader -> develop   (handler MediatR, endpoint, repositorio EF Core, TDD)

6. "Probar la feature F001"
   └─ leader -> test      (xUnit, WebApplicationFactory, TestContainers)

7. "Revisar calidad del codigo"
   └─ leader -> quality   (Roslyn analyzers, OWASP, cobertura)

8. "Preparar despliegue en AKS"
   └─ leader -> deploy    (CI/CD pipeline, Helm charts, health checks)
```

## Estructura generada por `scaffold`

```
mi-microservicio/
├── .harness-state.json
├── src/
│   ├── OrderService.Api/
│   ├── OrderService.Application/
│   ├── OrderService.Domain/
│   ├── OrderService.Infrastructure/
│   └── OrderService.Contracts/
├── tests/
│   ├── OrderService.UnitTests/
│   ├── OrderService.IntegrationTests/
│   └── OrderService.ContractTests/
├── docs/
│   ├── analysis/                           # Artefactos globales del proyecto
│   │   ├── domain-model.md
│   │   └── business-rules.md
│   ├── architecture.md                     # ADRs, C4, stack global
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
├── Dockerfile
└── OrderService.sln
```

## Stack tecnologico

| Categoria | Tecnologia |
|-----------|------------|
| Runtime | .NET (ultima version LTS) |
| API | ASP.NET Core Minimal API |
| ORM | Entity Framework Core (ultima version LTS) |
| BD | PostgreSQL |
| Cache | Redis |
| Mensajeria | MassTransit + RabbitMQ |
| CQRS | MediatR |
| Validacion | FluentValidation |
| Pruebas | xUnit + Moq + TestContainers |
| CI/CD | GitHub Actions / Azure DevOps |
| Infra | Docker, Kubernetes, Helm |
| Observabilidad | OpenTelemetry, Serilog, Prometheus |

## Skills disponibles

Los skills se activan automaticamente segun el contexto:

| Skill | Se activa cuando |
|-------|-----------------|
| `tdd` | Implementacion de nueva funcionalidad (RED-GREEN-REFACTOR) |
| `bdd` | Definicion de criterios de aceptacion (Gherkin + Reqnroll) |
| `git-flow` | Gestion de ramas y versionado (feature/*, develop, release/*) |
| `dotnet-microservice` | Cualquier tarea .NET Core (stack, estructura, patrones) |

## Reglas del proceso

- **Una feature a la vez**: solo una feature puede estar `in_progress`
- **Una fase a la vez**: no se avanza a la siguiente fase sin completar la actual
- **Rama por feature**: `@features start` crea automaticamente `feature/{id}-{slug}` desde `develop`
- **Git Flow**: `feature/*` -> `develop` -> `release/*` -> `main`
- **TDD obligatorio**: RED -> GREEN -> REFACTOR en cada tarea de implementacion
- **BDD para aceptacion**: criterios en Gherkin antes de implementar
- **architecture.md vivo**: cada decision arquitectonica genera un ADR
- **Checklist de tareas**: generada por `design`, marcada por `develop` al completar cada tarea
- **Persistencia automatica**: cada cambio de fase, feature, tarea o TDD se guarda en `.harness-state.json`
- **Resiliencia entre sesiones**: al reabrir opencode se retoma el estado anterior, incluyendo la tarea y el paso TDD exacto
