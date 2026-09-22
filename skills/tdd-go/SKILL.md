---
name: tdd-go
description: Test-Driven Development para Go con testing + testify. Usar cuando se implemente codigo nuevo o se modifique existente. Ciclo RED-GREEN-REFACTOR resiliente a interrupciones via tasks.json (el progreso TDD en si no se persiste en .harness-state.json). Organizacion: un archivo por clase con todos sus escenarios, nombramiento Gherkin y patron AAA.
---

# TDD — Test-Driven Development para Go

## Flujo TDD estricto

```
RED  ->  GREEN  ->  REFACTOR
```

## Estructura de archivos de prueba

```
tests/unit/
├── application/
│   └── orders/
│       └── create_order_handler_test.go       ← handler
├── domain/
│   └── orders/
│       ├── order_test.go                       ← entidad Order
│       └── money_test.go                       ← Value Object Money
```

### Reglas de organizacion

| Regla | Ejemplo |
|-------|---------|
| Co-localizado o en `tests/unit/` | `create_order_handler_test.go` |
| Archivo `{nombre}_test.go` | `order_test.go` |
| N escenarios dentro | Todas las `func Test` del handler en el mismo archivo |
| `func Test{Nombre}_{Escenario}` | `TestHandle_CreatesOrder_WhenCommandIsValid` |

## Nombramiento Gherkin para escenarios

```go
func Test{Nombre}_{ResultadoEsperado}_When_{Condicion}(t *testing.T)
```

### Prefijos segun tipo de escenario

| Prefijo | Uso |
|---------|-----|
| `_Creates_When_` | Camino feliz |
| `_ReturnsError_When_` | Error de validacion o dominio |
| `_Panics_When_` | Panic esperado |
| `_RollsBack_When_` | Compensacion |

## Patron AAA (Arrange, Act, Assert)

```go
func TestHandle_CreatesOrder_WhenCommandIsValid(t *testing.T) {
    // Arrange --------------------------------------------------------
    repoMock := new(MockOrderRepository)
    uowMock := new(MockUnitOfWork)
    sut := NewCreateOrderHandler(repoMock, uowMock)

    cmd := CreateOrderCommand{
        ProductID: "p1",
        Quantity:  2,
        Price:     Money{Amount: 100, Currency: "USD"},
    }

    repoMock.On("Add", mock.Anything, mock.AnythingOfType("*Order")).Return(nil)
    uowMock.On("SaveChanges", mock.Anything).Return(nil)

    // Act ------------------------------------------------------------
    result, err := sut.Handle(context.Background(), cmd)

    // Assert ----------------------------------------------------------
    require.NoError(t, err)
    assert.True(t, result.IsSuccess)
    assert.NotEmpty(t, result.Value.ID)
    repoMock.AssertCalled(t, "Add", mock.Anything, mock.AnythingOfType("*Order"))
}

func TestHandle_ReturnsError_WhenQuantityIsNegative(t *testing.T) {
    // Arrange --------------------------------------------------------
    sut := NewCreateOrderHandler(nil, nil)
    cmd := CreateOrderCommand{ProductID: "p1", Quantity: -5, Price: Money{Amount: 100, Currency: "USD"}}

    // Act ------------------------------------------------------------
    result, err := sut.Handle(context.Background(), cmd)

    // Assert ----------------------------------------------------------
    require.NoError(t, err)
    assert.True(t, result.IsFailure)
    assert.Contains(t, result.Errors, Error{Code: "Order.Quantity.Negative"})
}
```

## Convenciones de testing en Go

- `Test{Nombre}_{Escenario}` como nombre de funcion
- `t *testing.T` para tests normales
- `testing/quick` para property-based tests
- Testigos con `testify/mock` o `gomock`
- `require` para aserciones fatales, `assert` para no fatales
- Subtests con `t.Run()` para agrupar escenarios
- `t.Parallel()` para tests independientes

## Flujo TDD paso a paso

### 1. RED — Escribir el primer escenario que falle

```bash
go test ./tests/unit/application/orders/ -v -run TestHandle
# → ROJO: FAIL
```

### 2. GREEN — Escribir el minimo codigo para pasar

```bash
go test ./tests/unit/application/orders/ -v -run TestHandle
# → VERDE: ok
```

### 3. REFACTOR — Mejorar sin romper

```bash
go test ./tests/unit/application/orders/ -v -run TestHandle
# → VERDE: sigue pasando
```

Corre solo el paquete/test de la tarea actual, igual que en RED/GREEN — no el suite
completo. El suite completo (`go test ./tests/unit/... -v`) corre UNA sola vez, al
terminar todas las tareas de la HU, no en cada ciclo individual.

### 4. Siguiente escenario

Agregar otra `func Test` en el mismo archivo y repetir el ciclo.

### 5. Al completar todas las tareas de la HU

```bash
go test ./tests/unit/... -v
# → VERDE: todos pasan (unica corrida del suite completo de la HU)
```

## Resiliencia entre sesiones

El progreso del ciclo TDD (que escenario esta en RED/GREEN/REFACTOR) es interno a la ejecucion de `develop` y **no se persiste** en `.harness-state.json` — solo el estado de la fase `develop` de la HU se persiste (via `npx @idsanchezf/harness-engineering state hu phase-start/phase-complete`, invocado por el leader). Si la sesion se interrumpe a mitad de un ciclo:

1. Al retomar, `develop` relee el `tasks.json` de la HU para identificar que tarea estaba `in_progress`.
2. Ejecuta `go test ./... -run Test{Nombre}` de esa tarea para determinar en que estado quedo: si hay un `func Test` fallando, retoma en RED/GREEN sobre ese escenario; si todos los existentes pasan, retoma en REFACTOR o continua con el siguiente escenario.
3. El unico estado persistido es el de la tarea en `tasks.json` (`pending`/`in_progress`/`done`), actualizado via `npx @idsanchezf/harness-engineering state task start`/`state task done`.

El codigo y los tests existentes son siempre la fuente de verdad del punto exacto donde quedo el ciclo TDD.

## Herramientas

| Herramienta | Proposito |
|------------|-----------|
| testing (stdlib) | Framework de pruebas |
| testify | Aserciones y mocking |
| mockery | Generacion de mocks desde interfaces |
| httptest | Servidor HTTP de prueba |
| testcontainers-go | Contenedores reales para integration tests |
| go test -cover | Cobertura |

## Reglas

- Nunca escribas codigo de produccion sin una prueba que lo exija
- Nunca escribas mas de una prueba unitaria que falle a la vez
- Nunca escribas mas codigo del necesario para pasar la prueba actual
- Corre solo el paquete/test de la tarea actual despues de cada ciclo RED-GREEN-REFACTOR; el suite completo (`go test ./tests/unit/...`) corre UNA sola vez, al terminar todas las tareas de la HU
- Un archivo `{modulo}_test.go` por clase/funcion con todos sus escenarios
- Nombramiento Gherkin: `Test{Nombre}_{Resultado}_When_{Condicion}`
- Patron AAA obligatorio con comentarios `// Arrange ----`, `// Act ----`, `// Assert ----`
