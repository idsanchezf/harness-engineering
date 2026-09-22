---
name: git-flow
description: Estrategia de branching Git Flow, agnostica al stack tecnologico. Usar cuando se gestione el ciclo de ramas hu/*, feature/*, develop, release/*, hotfix/* y main. Cada HU y cada feature se desarrollan en su propia rama.
---

# Git Flow para Microservicios

## Ramas principales

```
main          # Produccion (solo mergea desde release/* y hotfix/*)
develop       # Integracion continua (mergea desde feature/* y release/*)
```

## Ramas de soporte

| Rama | Proposito | Nomenclatura | Se crea desde | Mergea a |
|------|-----------|-------------|---------------|----------|
| `hu/*` | Historia de usuario individual | `hu/F001-US-001-registro-google-oauth2` | `feature/*` | `feature/*` |
| `feature/*` | Feature completa (agrupa sus HUs) | `feature/F001-crear-pedido` | `develop` | `develop` |
| `release/*` | Preparar release | `release/1.0.0` | `develop` | `main` + `develop` |
| `hotfix/*` | Correccion urgente | `hotfix/fix-login-timeout` | `main` | `main` + `develop` |

## Flujo con arneses

```
hu/* ──PR──▶ feature/* ──PR──▶ develop ──release/*──▶ main
                                  ▲                     │
                                  └──────hotfix/*────────┘
```

Cuando el `leader` invoca `features hu start {featureId} {huId}`:

```bash
git checkout feature/F001-crear-pedido
git checkout -b hu/F001-US-001-registro-google-oauth2
```

Al completar la HU (`features hu complete {featureId} {huId}`), se hace push y se crea un PR hacia la rama `feature/*` (ver el agente `features`). Tras aprobacion, `features hu merge {featureId} {huId}` mergea a la feature.

Cuando todas las HUs de una feature estan `done`, `features feature complete {featureId}` crea el PR de la feature hacia `develop`.

## Gate antes de mergear (agnostico al stack)

Antes de completar cualquier PR (`hu complete`, `feature complete`, `release complete`, `hotfix complete`), se debe ejecutar el comando de tests y el de formato/lint **definidos en la skill del stack activo del proyecto** (columna `Skill` de `docs/architecture.md`), no un comando fijo de un lenguaje en particular. Ejemplos segun stack:

| Skill de stack | Comando de test | Comando de formato/lint |
|-----------------|-----------------|--------------------------|
| `dotnet-microservice` | `dotnet test` | `dotnet format --verify-no-changes` |
| `python-fastapi` | `pytest` | `ruff check .` |
| `node-express` | `npm test` | `npm run lint` |
| `go-chi` | `go test ./...` | `gofmt -l .` |
| `spring-boot` | `mvn test` (o `gradle test`) | `mvn spotless:check` |
| `rust-axum` | `cargo test` | `cargo fmt --check` |

Si el stack del proyecto no aparece en esta tabla, usa el comando de test/format documentado en la skill `{skill-del-stack}` correspondiente (se autocarga por nombre; su ubicacion exacta depende del CLI de agentes en uso).

## Convenciones de commit

```
feat: agregar creacion de pedidos con validacion de stock
fix: corregir calculo de total con descuentos
refactor: extraer OrderCalculator a servicio de dominio
test: agregar pruebas de integracion para OrderRepository
docs: actualizar architecture.md con ADR-003
```

## Reglas

- `main` y `develop` nunca reciben commits directos, solo merges via PR con CI en verde
- Cada HU tiene su propia rama `hu/{featureId}-{huId}-{slug}` creada desde la rama de su feature
- Cada feature tiene su propia rama `feature/{id}-{slug}` creada desde `develop`
- Usar `--no-ff` al mergear para preservar historial
- Eliminar la rama (`hu/*`, `feature/*`, `release/*`, `hotfix/*`) despues del merge exitoso
- Nunca mergear `main` → `develop` fuera del flujo de `release/*`/`hotfix/*` (si `main` tiene codigo que `develop` no tiene, el flujo esta roto)
- Antes de completar un PR, ejecutar el comando de test y de formato/lint del stack activo (ver tabla de gate arriba)
