---
name: go-chi
description: Convenciones, stack tecnologico y patrones de arquitectura para microservicios Go con Chi router. Usar cuando se desarrolle cualquier microservicio Go con clean architecture, sqlc/GORM, testing y testify.
---

# Go Chi Microservice Conventions

## Estructura de solucion (Clean Architecture)

```
cmd/
  {service}/            # Entrypoint main.go
internal/
  api/                  # Chi router, handlers, middleware
  application/          # Casos de uso, handlers de aplicacion, DTOs, interfaces
  domain/              # Entidades, value objects, eventos de dominio, interfaces de repositorio
  infrastructure/      # sqlc/GORM, repos, servicios externos, config
pkg/
  contracts/           # DTOs compartidos (opcional)
tests/
  unit/
  integration/
```

## Stack tecnologico

| Categoria | Tecnologia |
|-----------|------------|
| Runtime | Go 1.22+ |
| API | Chi router + net/http |
| ORM/Query | sqlc (recomendado) o GORM |
| Base de datos | PostgreSQL |
| Cache | Redis (go-redis) |
| Mensajeria | Watermill + RabbitMQ / Kafka |
| Validacion | go-playground/validator |
| Logging | zap (uber-go/zap) |
| Pruebas | testing + testify + httptest |
| Contenerizacion | Docker multi-stage, docker-compose |
| Observabilidad | OpenTelemetry, Prometheus, zap |

## Convenciones de codigo

### Nombrado
- Paquetes: lowercase, singular, corto
- Tipos exportados: PascalCase
- Funciones/metodos exportados: PascalCase
- Variables/parametros: camelCase
- Interfaces: sufijo `-er` (ej. `OrderRepository`)
- Archivos: snake_case

### Patrones obligatorios
- **Repository Pattern**: interfaces en domain, implementacion en infrastructure
- **Domain Events**: eventos como structs con dispatch manual
- **Result Pattern**: retornar `(T, error)` — Go idiom nativo
- **Guard Clause**: validaciones tempranas con `if err != nil`
- **Dependency Injection**: inyeccion por constructor (sin framework)
- **Context**: `context.Context` como primer parametro en todas las funciones

### Dependency Injection
- Inyeccion manual por constructor
- Interfaces pequenas (1-3 metodos)
- `wire` de Google para DI automatico (opcional)

### Base de datos
- **sqlc**: generar codigo Go type-safe desde SQL
- **GORM**: ORM completo si se prefiere
- Migraciones con `golang-migrate`
- Transacciones via `db.BeginTx(ctx)`

### API
- Chi router con grupos y sub-routers
- Middleware: logging, recovery, CORS, request ID
- `net/http` nativo, sin magia
- Health checks: `/health`, `/health/ready`

## Comandos frecuentes

```bash
# Desarrollo
go mod init {module}
go mod tidy
go run ./cmd/{service}/

# Build
go build -o ./bin/{service} ./cmd/{service}/
go build -ldflags="-s -w" -o ./bin/{service} ./cmd/{service}/  # optimizado

# Pruebas
go test ./...
go test -race ./...
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# Calidad
go vet ./...
golangci-lint run
gosec ./...

# Generacion
sqlc generate
go generate ./...
```
