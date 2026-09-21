---
name: dotnet-microservice
description: Convenciones, stack tecnologico y patrones de arquitectura para microservicios .NET Core. Usar cuando se desarrolle cualquier microservicio .NET con clean architecture, DDD, CQRS, EF Core, MediatR, Docker, Kubernetes y OpenTelemetry.
---

# .NET Core Microservice Conventions

## Estructura de solucion (Clean Architecture)

```
src/
  {Service}.Api/               # ASP.NET Core host, endpoints, middleware
  {Service}.Application/       # Casos de uso, CQRS handlers, DTOs, validators
  {Service}.Domain/            # Entidades, value objects, eventos de dominio, interfaces
  {Service}.Infrastructure/    # EF Core, repos, servicios externos, config
  {Service}.Contracts/         # DTOs y eventos de integracion compartidos
tests/
  {Service}.UnitTests/         # Pruebas de dominio y aplicacion
  {Service}.IntegrationTests/  # Pruebas con WebApplicationFactory + TestContainers
  {Service}.ContractTests/     # PactNet contract tests
```

## Stack tecnologico por defecto

| Categoria | Tecnologia |
|-----------|------------|
| Runtime | .NET (ultima version LTS) |
| API | ASP.NET Core Minimal API o Controllers |
| ORM | Entity Framework Core (ultima version LTS) |
| Base de datos | PostgreSQL (recomendado) o SQL Server |
| Cache | Redis (IDistributedCache) |
| Mensajeria | MassTransit + RabbitMQ / Azure Service Bus |
| CQRS | MediatR |
| Validacion | FluentValidation |
| Mapeo | Mapster |
| Logging | Serilog |
| Pruebas | xUnit + Moq + FluentAssertions + TestContainers |
| Contenerizacion | Docker multi-stage, docker-compose |
| Orquestacion | Kubernetes (Helm/Kustomize) |
| Observabilidad | OpenTelemetry, Prometheus, Grafana, Jaeger |

## Convenciones de codigo

### Nombrado
- Clases, metodos, propiedades: PascalCase
- Parametros, variables locales: camelCase
- Interfaces: prefijo `I` (ej. `IOrderRepository`)
- Metodos async: sufijo `Async`
- Archivos: una clase por archivo, nombre coincide con la clase

### Patrones obligatorios
- **Result Pattern**: retornar `Result<T>` o `OneOf<T, Error>` en handlers
- **Domain Events**: `IDomainEvent` con dispatch en `SaveChangesAsync`
- **Specification Pattern**: para queries complejas de repositorio
- **Guard Clause**: validaciones tempranas con `ArgumentException.ThrowIfNullOrEmpty`
- **Options Pattern**: configuracion con `IOptions<T>` y `appsettings.json`

### Dependency Injection
- Usar `Add{Service}` extension methods en `IServiceCollection`
- NO usar Service Locator pattern (nunca inyectar `IServiceProvider`)

### EF Core
- Configuracion con `IEntityTypeConfiguration<T>` (Fluent API)
- Migraciones generadas con EF Core CLI
- Value Objects mapeados como `Owned` o con JSON columns
- Shadow properties para audit fields (CreatedAt, UpdatedAt)

### API
- Problem Details (RFC 7807) para errores
- Correlation ID en cada request (middleware)
- Rate limiting con `AddRateLimiter`
- Health checks con `/health` (liveness) y `/health/ready` (readiness)

## Comandos frecuentes

```bash
dotnet new sln -n {Name}
dotnet new webapi -n {Name}.Api --use-minimal-apis
dotnet new classlib -n {Name}.Domain
dotnet new classlib -n {Name}.Application
dotnet new classlib -n {Name}.Infrastructure
dotnet new xunit -n {Name}.UnitTests
dotnet sln add **/*.csproj
dotnet ef migrations add InitialCreate --project src/{Name}.Infrastructure --startup-project src/{Name}.Api
dotnet ef database update
dotnet test
dotnet build
dotnet publish -c Release -o ./publish
```
