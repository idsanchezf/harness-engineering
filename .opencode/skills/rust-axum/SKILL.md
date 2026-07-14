---
name: rust-axum
description: Convenciones, stack tecnologico y patrones de arquitectura para microservicios Rust con Axum. Usar cuando se desarrolle cualquier microservicio Rust con clean architecture, sqlx/Diesel, cargo test y tokio.
---

# Rust Axum Microservice Conventions

## Estructura de solucion (Clean Architecture)

```
src/
  api/                 # Axum router, handlers, middleware, extractors
  application/         # Casos de uso, handlers de aplicacion, DTOs, interfaces
  domain/              # Entidades, value objects, eventos de dominio, interfaces de repositorio
  infrastructure/      # sqlx/Diesel repos, servicios externos, config
  contracts/           # DTOs compartidos (opcional)
tests/
  unit/
  integration/
```

## Stack tecnologico

| Categoria | Tecnologia |
|-----------|------------|
| Runtime | Rust 1.80+ (stable) |
| API | Axum + tower |
| ORM/Query | sqlx (recomendado) o Diesel |
| Base de datos | PostgreSQL |
| Cache | Redis (redis-rs) |
| Mensajeria | lapin (RabbitMQ) o rdkafka |
| Validacion | validator |
| Serializacion | serde + serde_json |
| Logging | tracing |
| Pruebas | cargo test + tokio::test + TestContainers |
| Contenerizacion | Docker multi-stage, docker-compose |
| Observabilidad | OpenTelemetry, Prometheus, tracing |

## Convenciones de codigo

### Nombrado
- Modulos, funciones, variables: snake_case
- Tipos, traits, enums: PascalCase (CamelCase)
- Constantes: UPPER_SNAKE_CASE
- Archivos: snake_case

### Patrones obligatorios
- **Repository Pattern**: traits en domain, implementacion en infrastructure
- **Domain Events**: eventos como enums/structs con dispatch via `tokio::sync::broadcast`
- **Result Pattern**: `Result<T, Error>` — Rust idiom nativo
- **Guard Clause**: validaciones con `?` operator y `anyhow`/`thiserror`
- **Dependency Injection**: inyeccion manual (sin framework, el borrow checker lo fuerza)
- **Async**: `tokio` runtime, `async fn` con `Send + Sync + 'static`

### Dependency Injection
- Inyeccion manual por constructor
- Traits como contratos
- NO Service Locator
- Estado compartido con `Arc<T>`

### Base de datos
- **sqlx**: SQL en tiempo de compilacion, type-safe
- **Diesel**: ORM tradicional con macros
- Migraciones con `sqlx migrate` o `diesel migration`
- Pool de conexiones con `sqlx::PgPool`

### API
- Axum routers con `.route()`, `.nest()`, `.merge()`
- Extractors: `State<T>`, `Json<T>`, `Path<T>`, `Query<T>`
- Middleware: `tower::ServiceBuilder` + `TraceLayer`
- Validacion: `validator::Validate` trait
- Health checks: `/health`, `/health/ready`

## Comandos frecuentes

```bash
# Desarrollo
cargo new {service}
cargo build
cargo run
cargo watch -x run

# Pruebas
cargo test
cargo test -- --test-threads=1
cargo test --lib
cargo test --test integration

# Calidad
cargo clippy --all-targets --all-features
cargo fmt --check
cargo audit
cargo check

# Release
cargo build --release
cargo build --release --target x86_64-unknown-linux-musl
```
