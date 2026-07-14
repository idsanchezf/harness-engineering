---
name: node-express
description: Convenciones, stack tecnologico y patrones de arquitectura para microservicios Node.js con Express y TypeScript. Usar cuando se desarrolle cualquier microservicio Node.js con clean architecture, Prisma/TypeORM, Zod y Jest.
---

# Node.js Express Microservice Conventions

## Estructura de solucion (Clean Architecture)

```
src/
  {service}/
    api/                 # Express app, routes, middleware, controllers
    application/         # Casos de uso, handlers, DTOs, interfaces
    domain/              # Entidades, value objects, eventos de dominio, interfaces de repositorio
    infrastructure/      # Prisma/TypeORM models, repos, servicios externos, config
    contracts/           # DTOs y tipos compartidos (opcional)
tests/
  unit/
  integration/
  contract/
```

## Stack tecnologico

| Categoria | Tecnologia |
|-----------|------------|
| Runtime | Node.js 22 LTS |
| Lenguaje | TypeScript 5.x |
| API | Express + express-async-errors |
| ORM | Prisma (recomendado) o TypeORM |
| Base de datos | PostgreSQL |
| Cache | Redis (ioredis) |
| Mensajeria | BullMQ + Redis |
| Validacion | Zod |
| Logging | pino |
| Pruebas | Jest + Supertest + TestContainers |
| Contenerizacion | Docker multi-stage, docker-compose |
| Observabilidad | OpenTelemetry, Prometheus, pino |

## Convenciones de codigo

### Nombrado
- Clases, interfaces, tipos: PascalCase
- Funciones, variables: camelCase
- Constantes: UPPER_SNAKE_CASE
- Archivos: kebab-case o camelCase
- Interfaces: prefijo `I` o sin prefijo (segun preferencia del equipo)

### Patrones obligatorios
- **Repository Pattern**: interfaces en domain, implementacion en infrastructure
- **Domain Events**: eventos como clases con dispatch manual
- **Result Pattern**: usar `Result<T, E>` o discriminated unions
- **Guard Clause**: validaciones tempranas con early return/throw
- **Dependency Injection**: inyeccion por constructor (sin framework o con tsyringe)
- **Async/await**: siempre, nunca callbacks

### Dependency Injection
- Inyeccion manual por constructor
- `tsyringe` o `inversify` para DI automatico (opcional)
- NO Service Locator

### Base de datos
- **Prisma**: schema declarativo, migraciones, type-safe queries
- **TypeORM**: ORM tradicional con decorators
- Migraciones con Prisma Migrate o TypeORM migrations
- Transacciones con `prisma.$transaction` o `dataSource.transaction`

### API
- Express routers por recurso
- Middleware: error handler, request ID, logging, CORS, rate limiting
- Zod schemas para validacion de request body/query/params
- Health checks: `/health`, `/health/ready`

## Comandos frecuentes

```bash
# Desarrollo
npm init
npm install
npm run dev
npx prisma migrate dev

# Build
npm run build
npm start

# Pruebas
npm test
npm test -- --coverage

# Calidad
npm run lint
npm run format
npm audit
```
