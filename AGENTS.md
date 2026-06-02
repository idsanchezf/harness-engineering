# AGENTS.md

## Harness Engineering para Microservicios .NET Core

Este proyecto utiliza ingenieria de arneses con opencode para orquestar el ciclo de vida completo de microservicios .NET Core.

### Estructura

```
.opencode/
  agents/
    leader.md      # Agente lider (orquestador principal)
    analysis.md    # Analisis DDD y requerimientos
    architect.md   # Definicion arquitectonica (architecture.md + ADR)
    design.md      # Contratos API, modelo de datos, integracion
    scaffold.md    # Scaffolding de solucion y proyectos
    develop.md     # Implementacion y codificacion
    test.md        # Estrategia de pruebas
    quality.md     # Calidad de codigo y seguridad
    deploy.md      # CI/CD, infraestructura, despliegue
    features.md    # Gestion de features, backlog, ramas, estado
  skills/
    dotnet-microservice/   # Convenciones .NET Core y stack tecnologico
      SKILL.md
    tdd/                   # Test-Driven Development (RED-GREEN-REFACTOR)
      SKILL.md
    bdd/                   # Behavior-Driven Development (Gherkin + SpecFlow)
      SKILL.md
    git-flow/              # Estrategia de branching Git Flow
      SKILL.md
```

### Uso

1. Inicia con el agente lider para tareas integrales de microservicio
2. Cada fase del SDLC tiene un subagente especializado
3. Los subagentes son invocados automaticamente por el lider segun la fase
4. Los artefactos generados se almacenan en `docs/` y `src/` segun corresponda

### Instrucciones generales

- Siempre usar `dotnet` CLI para operaciones .NET
- Seguir Clean Architecture y principios SOLID
- Stack por defecto: .NET (ultima version LTS), EF Core, PostgreSQL, MediatR, Docker, Kubernetes
- Generar siempre health checks, logging estructurado y metricas
- Usar estrategia Git Flow: cada feature en su propia rama `feature/{id}-{slug}`
- Aplicar TDD (skill `tdd`) en implementacion y BDD (skill `bdd`) en criterios de aceptacion
- Mantener vivo `docs/architecture.md` con ADRs actualizados via agente `architect`
