---
name: tdd-pytest
description: Test-Driven Development para Python con pytest. Usar cuando se implemente codigo nuevo o se modifique existente. Ciclo RED-GREEN-REFACTOR con persistencia automatica del progreso en .harness-state.json. Organizacion: una carpeta por clase, un archivo por metodo con todos sus escenarios, nombramiento Gherkin y patron AAA.
---

# TDD — Test-Driven Development para Python (pytest)

## Flujo TDD estricto

```
RED  ->  GREEN  ->  REFACTOR
```

## Estructura de archivos de prueba

```
tests/unit/
├── application/
│   └── orders/
│       ├── test_create_order_handler.py         ← metodo handle
│       └── test_cancel_order_handler.py
├── domain/
│   └── orders/
│       └── test_order.py
│           ├── test_add_line_item.py             ← metodo add_line_item
│           └── test_submit.py                    ← metodo submit
```

### Reglas de organizacion

| Regla | Ejemplo |
|-------|---------|
| Carpeta por modulo | `application/orders/` para `orders` module |
| Un archivo por clase/funcion | `test_create_order_handler.py` para `CreateOrderHandler` |
| N escenarios dentro | Todas las `def test_` del handler en el mismo archivo |
| Clase de test opcional | `class TestCreateOrder` agrupa escenarios relacionados |

## Nombramiento Gherkin para escenarios

```
def test_{resultado_esperado}_when_{condicion}
```

### Prefijos segun tipo de escenario

| Prefijo | Uso |
|---------|-----|
| `test_{result}_when_` | Camino feliz |
| `test_error_when_` | Error de validacion o dominio |
| `test_raises_when_` | Excepcion esperada |
| `test_rollback_when_` | Compensacion o saga |

## Patron AAA (Arrange, Act, Assert)

```python
import pytest
from unittest.mock import AsyncMock, Mock

class TestCreateOrderHandler:
    @pytest.fixture
    def repo_mock(self):
        return AsyncMock()
    
    @pytest.fixture
    def uow_mock(self):
        return AsyncMock()
    
    @pytest.fixture
    def sut(self, repo_mock, uow_mock):
        return CreateOrderHandler(repo_mock, uow_mock)
    
    async def test_creates_order_when_command_is_valid(self, sut, repo_mock, uow_mock):
        # Arrange --------------------------------------------------------
        cmd = CreateOrderCommand(product_id="p1", quantity=2, price=Money(100, "USD"))
        
        # Act ------------------------------------------------------------
        result = await sut.handle(cmd)
        
        # Assert ----------------------------------------------------------
        assert result.is_success
        assert result.value.id is not None
        repo_mock.add.assert_awaited_once()
    
    async def test_error_when_quantity_is_negative(self, sut):
        # Arrange --------------------------------------------------------
        cmd = CreateOrderCommand(product_id="p1", quantity=-5, price=Money(100, "USD"))
        
        # Act ------------------------------------------------------------
        result = await sut.handle(cmd)
        
        # Assert ----------------------------------------------------------
        assert result.is_failure
        assert any(e.code == "Order.Quantity.Negative" for e in result.errors)
```

## Convenciones de pytest

- `@pytest.fixture` para mocks y SUT (System Under Test)
- `@pytest.mark.asyncio` para tests async
- `pytest.raises(Exception)` para verificar excepciones
- `AsyncMock` para dependencias async
- `conftest.py` para fixtures compartidos

## Flujo TDD paso a paso

### 1. RED — Escribir el primer escenario que falle

```bash
pytest tests/unit/application/orders/test_create_order_handler.py -v
# → ROJO: 1 failed
```

### 2. GREEN — Escribir el minimo codigo para pasar

Implementar solo lo necesario en el handler.

```bash
pytest tests/unit/application/orders/test_create_order_handler.py -v
# → VERDE: 1 passed
```

### 3. REFACTOR — Mejorar sin romper

Extraer validacion, mover logica a entidad, introducir Value Objects.

```bash
pytest tests/unit/ -v
# → VERDE: todos pasan
```

### 4. Siguiente escenario

Agregar otro `async def test_` en el mismo archivo y repetir el ciclo.

## Herramientas

| Herramienta | Proposito |
|------------|-----------|
| pytest | Framework de pruebas |
| pytest-asyncio | Soporte para tests async |
| pytest-mock / unittest.mock | Mocking |
| pytest-cov / coverage.py | Cobertura |
| httpx | Cliente HTTP para tests de integracion |
| TestContainers (testcontainers-python) | Contenedores reales para integration tests |

## Reglas

- Nunca escribas codigo de produccion sin una prueba que lo exija
- Nunca escribas mas de una prueba unitaria que falle a la vez
- Nunca escribas mas codigo del necesario para pasar la prueba actual
- Corre `pytest` despues de cada ciclo RED-GREEN-REFACTOR
- Un archivo `test_{modulo}.py` por clase/funcion con todos sus escenarios
- Nombramiento Gherkin: `test_{resultado}_when_{condicion}`
- Patron AAA obligatorio con comentarios `# Arrange ----`, `# Act ----`, `# Assert ----`
