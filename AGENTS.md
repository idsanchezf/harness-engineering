# AGENTS.md

## Harness Engineering (opencode)

Este proyecto usa **Harness Engineering** con **opencode**. La referencia completa del proceso — pipeline, agentes, comandos, archivo de estado y reglas de git, agnostica al CLI que uses — vive en [`HARNESS.md`](./HARNESS.md). Este archivo documenta especificamente lo que aplica a la instalacion de opencode.

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
- Si existe y `inception` esta pendiente, inicia inception (retomando desde la fase donde se quedo)
- Si `inception` esta completada, retoma desde la feature/fase donde se quedo

### 3. Comienza con una solicitud

Escribe en lenguaje natural lo que necesitas. El lider evaluara la solicitud y delegara al subagente correspondiente. Ver [`HARNESS.md`](./HARNESS.md#pipeline-del-sdlc) para el pipeline completo.

## Estructura

```
.opencode/
  agents/
    leader.md      # Agente lider (orquestador principal)
    inception.md   # Discovery co-creativo, DDD, arquitectura, scaffold, walking skeleton, tooling (una vez)
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
    tdd-python/            # TDD para Python (pytest)
      SKILL.md
    bdd-python/            # BDD para Python (Behave)
      SKILL.md
    go-chi/                # Convenciones Go + Chi
      SKILL.md
    tdd-go/                # TDD para Go (testing + testify)
      SKILL.md
    bdd-go/                # BDD para Go (Godog)
      SKILL.md
    spring-boot/           # Convenciones Java + Spring Boot
      SKILL.md
    tdd-java/              # TDD para Java (JUnit 5 + Mockito)
      SKILL.md
    bdd-java/              # BDD para Java (Cucumber-JVM)
      SKILL.md
    node-express/          # Convenciones Node.js + Express
      SKILL.md
    tdd-javascript/        # TDD para Node.js (Jest)
      SKILL.md
    bdd-javascript/        # BDD para Node.js (Cucumber.js)
      SKILL.md
    rust-axum/             # Convenciones Rust + Axum
      SKILL.md
    tdd-rust/              # TDD para Rust (cargo test)
      SKILL.md
    bdd-rust/              # BDD para Rust (cucumber-rs)
      SKILL.md
    git-flow/              # Estrategia de branching (universal)
      SKILL.md
```

Para agentes, skills, comandos, archivo de estado y reglas del proceso: ver [`HARNESS.md`](./HARNESS.md).
