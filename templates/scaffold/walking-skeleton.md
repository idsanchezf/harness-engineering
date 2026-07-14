# Guia: Walking Skeleton por Stack

> Fase: Inception > Track B — Bootstrapping Tecnico > Scaffold
> Proposito: Definir el contenido minimo del walking skeleton para cada stack tecnologico.
> El walking skeleton es una funcionalidad ejemplo end-to-end que recorre todas las capas de la arquitectura.

---

## Principios comunes (aplica a todos los stacks)

1. **Simple pero completo**: la funcionalidad debe ser trivial (un eco, un saludo) pero debe tocar todas las capas.
2. **Persistencia en memoria**: NO requiere base de datos externa. Repositorio con coleccion en memoria.
3. **Ejecutable con un comando**: `dotnet run`, `npm start`, `poetry run uvicorn`, etc.
4. **Testable con un comando**: `dotnet test`, `npm test`, `pytest`, `go test ./...`
5. **Documentado**: cada archivo/clase tiene comentarios explicando su capa y rol.
6. **README.md**: en la raiz del proyecto con instrucciones de ejecucion, tests y diagrama del flujo.

---

## Flujo general del walking skeleton

```
[HTTP Request] → API (Controller/Endpoint) → Application (Handler/UseCase) → Domain (Entity + Repository Interface) → Infrastructure (InMemoryRepository) → Response
```

Cada stack implementa este flujo con sus convenciones.

---

## Stack: .NET (dotnet-microservice + tdd-dotnet)

### Funcionalidad sugerida

`POST /api/greetings` — recibe `{ "name": "Mundo" }`, retorna `{ "message": "Hola, Mundo!" }`

O alternativamente: `GET /api/echo/{message}` — retorna `{ "echo": "..." }`

### Archivos a generar

```
src/
  GreetingService.Api/
    Program.cs                          # Host, DI, middleware, health checks, mapping endpoints
    Endpoints/
      GreetingEndpoints.cs              # Minimal API: POST /api/greetings → handler
    Dtos/
      CreateGreetingRequest.cs          # Request DTO con validacion (FluentValidation o DataAnnotations)
      GreetingResponse.cs               # Response DTO

  GreetingService.Application/
    Greetings/
      CreateGreeting/
        CreateGreetingCommand.cs        # Command/Query object
        CreateGreetingHandler.cs        # Handler: logica de aplicacion, invoca repositorio
      GetGreeting/                      # (opcional) GET endpoint
    DependencyInjection.cs              # Extension method para registrar servicios de aplicacion

  GreetingService.Domain/
    Greetings/
      Greeting.cs                       # Entidad: Id, Message, Name, CreatedAt
      GreetingName.cs                   # Value Object: inmutable, con validacion
      IGreetingRepository.cs            # Interfaz: Add, GetById, GetAll

  GreetingService.Infrastructure/
    Persistence/
      InMemoryGreetingRepository.cs     # Implementacion: ConcurrentDictionary o List<Greeting>
    DependencyInjection.cs              # Registro de servicios de infraestructura

tests/
  GreetingService.UnitTests/
    Domain/
      Greetings/
        GreetingTests.cs                # Tests de creacion, invariantes
        GreetingNameTests.cs            # Tests de validacion del value object
    Application/
      Greetings/
        CreateGreeting/
          CreateGreetingHandlerTests.cs # Handler test con repositorio mock (Moq)

  GreetingService.IntegrationTests/
    Api/
      GreetingEndpointsTests.cs         # Test e2e: WebApplicationFactory + HTTP client
```

### Dependencias NuGet necesarias

- `MediatR` (si se usa CQRS/Mediator)
- `FluentValidation` (validacion de requests)
- `Microsoft.AspNetCore.Mvc.Testing` (integration tests)
- `Moq` (mocking en unit tests)
- `FluentAssertions` (asserts legibles)
- `xUnit` + `xunit.runner.visualstudio` + `Microsoft.NET.Test.Sdk`

### Comandos de verificacion

```bash
dotnet build
dotnet test
dotnet run --project src/GreetingService.Api
```

### Repositorio in-memory (.NET)

```csharp
// GreetingService.Infrastructure/Persistence/InMemoryGreetingRepository.cs
using System.Collections.Concurrent;
using GreetingService.Domain.Greetings;

namespace GreetingService.Infrastructure.Persistence;

/// <summary>
/// Implementacion en memoria del repositorio de Greetings.
/// CAPA: Infrastructure — implementa la interfaz definida en Domain.
/// Para produccion se reemplazaria por EF Core + PostgreSQL.
/// </summary>
public class InMemoryGreetingRepository : IGreetingRepository
{
    private readonly ConcurrentDictionary<Guid, Greeting> _greetings = new();

    public Task AddAsync(Greeting greeting, CancellationToken ct = default)
    {
        _greetings[greeting.Id] = greeting;
        return Task.CompletedTask;
    }

    public Task<Greeting?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        _greetings.TryGetValue(id, out var greeting);
        return Task.FromResult(greeting);
    }

    public Task<IReadOnlyList<Greeting>> GetAllAsync(CancellationToken ct = default)
    {
        return Task.FromResult<IReadOnlyList<Greeting>>(_greetings.Values.ToList());
    }
}
```

---

## Stack: Python (python-fastapi + tdd-pytest + bdd-python)

### Funcionalidad sugerida

`POST /api/greetings` — recibe `{ "name": "Mundo" }`, retorna `{ "message": "Hola, Mundo!" }`

### Archivos a generar

```
src/
  greeting_service/
    api/
      __init__.py
      main.py                           # FastAPI app, middleware, health checks, routers
      dependencies.py                   # DI (dependencias inyectables)
      routers/
        __init__.py
        greetings.py                    # POST /api/greetings
      schemas/
        __init__.py
        greetings.py                    # Pydantic models: CreateGreetingRequest, GreetingResponse

    application/
      __init__.py
      greetings/
        __init__.py
        create_greeting.py              # Caso de uso / handler
        get_greeting.py                 # (opcional) GET

    domain/
      __init__.py
      greetings/
        __init__.py
        greeting.py                     # Entidad (dataclass o Pydantic)
        greeting_name.py                # Value Object
        greeting_repository.py          # Interfaz (ABC o Protocol)

    infrastructure/
      __init__.py
      persistence/
        __init__.py
        in_memory_greeting_repository.py # Implementacion en memoria

tests/
  unit/
    domain/
      __init__.py
      test_greeting.py                  # Tests de entidad
      test_greeting_name.py             # Tests de value object
    application/
      __init__.py
      test_create_greeting.py           # Handler test con mock
  integration/
    __init__.py
    test_greeting_api.py                # Test e2e con TestClient de FastAPI

  conftest.py                           # Fixtures compartidas
```

### Dependencias necesarias

- `fastapi`
- `uvicorn[standard]`
- `pydantic`
- `pytest`
- `pytest-asyncio`
- `httpx` (para TestClient)

### Comandos de verificacion

```bash
poetry run uvicorn greeting_service.api.main:app --reload
poetry run pytest
```

---

## Stack: Go (go-chi + tdd-go)

### Funcionalidad sugerida

`POST /api/greetings` — recibe `{ "name": "Mundo" }`, retorna `{ "message": "Hola, Mundo!" }`

### Archivos a generar

```
cmd/
  api/
    main.go                             # Entrypoint: router, DI, middleware, health checks

internal/
  api/
    handlers/
      greeting_handler.go               # HTTP handler: POST /api/greetings
    middleware/
      logging.go                        # Logging middleware
    dto/
      greeting_dto.go                   # Request/Response DTOs

  application/
    greeting/
      create_greeting.go                # Caso de uso
      create_greeting_test.go           # Unit test del caso de uso

  domain/
    greeting/
      greeting.go                       # Entidad
      greeting_name.go                  # Value Object
      repository.go                     # Interfaz (interface)
      greeting_test.go                  # Unit test de dominio

  infrastructure/
    persistence/
      in_memory_greeting_repository.go  # Implementacion en memoria
      in_memory_greeting_repository_test.go
    di/
      container.go                      # Wire up dependencies

tests/
  integration/
    greeting_api_test.go                # Test e2e con httptest
```

### Dependencias necesarias

- `github.com/go-chi/chi/v5`
- `github.com/stretchr/testify`
- `go.uber.org/zap` (logging)

### Comandos de verificacion

```bash
go run ./cmd/api
go test ./...
```

---

## Stack: Java (spring-boot + tdd-junit)

### Funcionalidad sugerida

`POST /api/greetings` — recibe `{ "name": "Mundo" }`, retorna `{ "message": "Hola, Mundo!" }`

### Archivos a generar

```
src/main/java/com/example/greetingservice/
  GreetingServiceApplication.java       # Spring Boot entrypoint

  api/
    GreetingController.java             # @RestController: POST /api/greetings
    dto/
      CreateGreetingRequest.java        # Request DTO con @Valid
      GreetingResponse.java             # Response DTO

  application/
    greeting/
      CreateGreetingUseCase.java        # @Service: caso de uso

  domain/
    greeting/
      Greeting.java                     # Entidad con @Entity? (o POJO simple)
      GreetingName.java                 # Value Object (record)
      GreetingRepository.java           # Interfaz

  infrastructure/
    persistence/
      InMemoryGreetingRepository.java   # @Repository: ConcurrentHashMap
      GreetingRepositoryImpl.java       # Alias o implementacion directa

src/test/java/com/example/greetingservice/
  domain/
    greeting/
      GreetingTest.java                 # Unit test
      GreetingNameTest.java             # Unit test
  application/
    greeting/
      CreateGreetingUseCaseTest.java    # Unit test con Mockito
  api/
    GreetingControllerTest.java         # Integration test con MockMvc
```

### Dependencias necesarias (pom.xml / build.gradle)

- `spring-boot-starter-web`
- `spring-boot-starter-validation`
- `spring-boot-starter-test`
- `mockito-core` / `mockito-junit-jupiter`
- `assertj-core`

### Comandos de verificacion

```bash
./mvnw spring-boot:run
./mvnw test
```

---

## Stack: Node.js (node-express + tdd-jest + bdd-javascript)

### Funcionalidad sugerida

`POST /api/greetings` — recibe `{ "name": "Mundo" }`, retorna `{ "message": "Hola, Mundo!" }`

### Archivos a generar

```
src/
  api/
    server.ts                           # Express app setup, middleware, health checks
    routes/
      greeting.routes.ts                # POST /api/greetings
    controllers/
      greeting.controller.ts            # Controller: parsea request, llama al handler
    middleware/
      error.middleware.ts               # Error handling middleware
    dto/
      greeting.dto.ts                   # Zod schemas + TypeScript types

  application/
    greeting/
      create-greeting.handler.ts        # Caso de uso
      create-greeting.handler.test.ts   # Unit test

  domain/
    greeting/
      greeting.entity.ts                # Entidad (class o interface + factory)
      greeting-name.vo.ts               # Value Object
      greeting-repository.interface.ts  # Interfaz

  infrastructure/
    persistence/
      in-memory-greeting.repository.ts  # Implementacion con Map
      in-memory-greeting.repository.test.ts
    di/
      container.ts                      # Dependency injection (tsyringe o manual)

tests/
  integration/
    greeting.api.test.ts                # Test e2e con supertest
```

### Dependencias necesarias

- `express`
- `zod`
- `pino` o `winston` (logging)
- `cors`, `helmet`
- `typescript`, `ts-node`, `tsx`
- `jest`, `ts-jest`, `@types/jest`
- `supertest`, `@types/supertest`

### Comandos de verificacion

```bash
npm run dev
npm test
```

---

## Stack: Rust (rust-axum + tdd-rust)

### Funcionalidad sugerida

`POST /api/greetings` — recibe `{ "name": "Mundo" }`, retorna `{ "message": "Hola, Mundo!" }`

### Archivos a generar

```
src/
  main.rs                               # Entrypoint: router, state, middleware

  api/
    mod.rs
    routes/
      mod.rs
      greetings.rs                      # POST /api/greetings handler
    dto/
      mod.rs
      greetings.rs                      # Request/Response structs con serde

  application/
    mod.rs
    greetings/
      mod.rs
      create_greeting.rs                # Caso de uso
      #[cfg(test)] tests...

  domain/
    mod.rs
    greetings/
      mod.rs
      greeting.rs                       # Entidad
      greeting_name.rs                  # Value Object
      repository.rs                     # Trait (interfaz)
      #[cfg(test)] tests...

  infrastructure/
    mod.rs
    persistence/
      mod.rs
      in_memory_greeting_repository.rs  # Implementacion con HashMap + RwLock
      #[cfg(test)] tests...
    di.rs                               # Wire up dependencies

tests/
  integration/
    greeting_api_test.rs                # Test e2e con TestClient de axum
```

### Dependencias necesarias (Cargo.toml)

- `axum`
- `tokio` (features: full)
- `serde` + `serde_json`
- `tracing` + `tracing-subscriber`
- `uuid` (con feature v4)
- `tower-http` (cors, trace)

- `[dev-dependencies]`
- `mockall`
- `axum-test` o `tower::ServiceExt`

### Comandos de verificacion

```bash
cargo run
cargo test
```

---

## Checklist de verificacion del walking skeleton

Al finalizar el walking skeleton para cualquier stack, verifica:

- [ ] El proyecto compila/build sin errores
- [ ] `docker compose up` funciona (si el proyecto tiene Docker)
- [ ] Los tests unitarios pasan (domain, application)
- [ ] Los tests de integracion pasan (end-to-end)
- [ ] El endpoint responde correctamente con datos validos
- [ ] El endpoint rechaza datos invalidos con codigo de error apropiado
- [ ] Health check `/health` responde 200 OK
- [ ] Health check `/health/ready` responde 200 OK
- [ ] El logging estructurado muestra correlation ID en las requests
- [ ] Existe README.md con instrucciones de ejecucion
- [ ] Cada clase/archivo tiene comentarios explicando su capa
- [ ] El flujo end-to-end recorre: API → Application → Domain → Infrastructure → Respuesta
