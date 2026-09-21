---
name: python-fastapi
description: Convenciones, stack tecnologico y patrones de arquitectura para microservicios Python con FastAPI. Usar cuando se desarrolle cualquier microservicio Python con clean architecture, DDD, SQLAlchemy, Pydantic y pytest.
---

# Python FastAPI Microservice Conventions

## Estructura de solucion (Clean Architecture)

```
src/
  {service}/
    api/                 # FastAPI app, routers, middleware, dependencies
    application/         # Casos de uso, handlers, DTOs, interfaces
    domain/              # Entidades, value objects, eventos de dominio, interfaces de repositorio
    infrastructure/      # SQLAlchemy models, repos, servicios externos, config
    contracts/           # DTOs y schemas compartidos (opcional)
tests/
  unit/
  integration/
  contract/
```

## Stack tecnologico

| Categoria | Tecnologia |
|-----------|------------|
| Runtime | Python 3.12+ |
| API | FastAPI + Pydantic V2 |
| ORM | SQLAlchemy 2.0 (async) + Alembic |
| Base de datos | PostgreSQL (recomendado) |
| Cache | Redis (aioredis) |
| Mensajeria | Celery + RabbitMQ / Redis |
| Validacion | Pydantic V2 |
| Mapeo | Pydantic `model_validate` |
| Logging | structlog |
| Pruebas | pytest + pytest-asyncio + httpx + TestContainers |
| Contenerizacion | Docker multi-stage, docker-compose |
| Observabilidad | OpenTelemetry, Prometheus, structlog |

## Convenciones de codigo

### Nombrado
- Modulos, variables, funciones: snake_case
- Clases: PascalCase
- Constantes: UPPER_SNAKE_CASE
- Metodos async: sin sufijo especial (Python usa `async def`)
- Archivos: snake_case, un modulo por archivo

### Patrones obligatorios
- **Repository Pattern**: abstraccion sobre SQLAlchemy para acceso a datos
- **Unit of Work**: gestion de transacciones con `async with`
- **Domain Events**: eventos con dispatch manual o via biblioteca
- **Result Pattern**: retornar `Result[T]` o usar `OneOf`
- **Guard Clause**: validaciones tempranas con `ValueError` o excepciones de dominio
- **Dependency Injection**: usar `Depends()` de FastAPI

### Dependency Injection
- FastAPI `Depends()` para inyectar repositorios y servicios
- NO usar Service Locator
- Usar `pytest fixtures` para configuracion de tests

### SQLAlchemy + Alembic
- Async SQLAlchemy (`asyncpg` driver)
- Migraciones con Alembic (`alembic revision --autogenerate`)
- Configuracion con `mapped_column()` (SQLAlchemy 2.0 style)
- Mixins para audit fields (`created_at`, `updated_at`)

### API
- FastAPI routers por recurso
- Pydantic V2 schemas para request/response
- Dependency injection con `Depends(get_repository)`
- OpenAPI automatico via FastAPI
- Health checks con `/health` y `/health/ready`

## Comandos frecuentes

```bash
# Entorno e instalacion
python -m venv .venv
source .venv/bin/activate   # Linux/Mac
.venv\Scripts\activate      # Windows
pip install -r requirements.txt

# Desarrollo
uvicorn src.{service}.api.main:app --reload
alembic revision --autogenerate -m "descripcion"
alembic upgrade head

# Pruebas
pytest
pytest --cov=src --cov-report=html
pytest -k "test_name"

# Calidad
ruff check .
ruff format --check .
mypy src/
bandit -r src/
```
