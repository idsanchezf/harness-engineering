---
name: tdd-dotnet
description: Test-Driven Development para .NET Core. Usar cuando se implemente codigo nuevo o se modifique existente. Ciclo RED-GREEN-REFACTOR con persistencia automatica del progreso en .harness-state.json para retomar tras interrupcion. Organizacion: una carpeta por clase, un archivo .cs por metodo con todos sus escenarios, nombramiento Gherkin y patron AAA.
---

# TDD — Test-Driven Development para .NET Core

## Flujo TDD estricto

```
RED  ->  GREEN  ->  REFACTOR
```

## Estructura de archivos de prueba

Organiza las pruebas reflejando la estructura del codigo fuente.

- **Una carpeta por cada clase a testear**
- **Un archivo `.cs` por cada metodo de negocio**
- **Todos los escenarios de ese metodo como metodos `[Fact]` dentro del mismo archivo**

```
tests/{Service}.UnitTests/
├── Application/
│   └── Orders/
│       ├── CreateOrderHandlerTests/
│       │   ├── HandleAsyncTests.cs          ← metodo Handle
│       │   └── ValidateAsyncTests.cs        ← metodo Validate (si existe)
│       └── CancelOrderHandlerTests/
│           └── HandleAsyncTests.cs
├── Domain/
│   └── Orders/
│       └── OrderTests/
│           ├── AddLineItemTests.cs           ← metodo AddLineItem
│           └── SubmitTests.cs               ← metodo Submit
```

### Reglas de organizacion

| Regla | Ejemplo |
|-------|---------|
| Carpeta por clase | `CreateOrderHandlerTests/` para `CreateOrderHandler` |
| Un `.cs` por metodo | `HandleAsyncTests.cs` para el metodo `HandleAsync` |
| N escenarios dentro | Todos los `[Fact]` del metodo `HandleAsync` en `HandleAsyncTests.cs` |
| Clase nombrada `{Metodo}Tests` | `public class HandleAsyncTests` |

## Nombramiento Gherkin para escenarios

Dentro de la clase de test, cada metodo `[Fact]` sigue el patron:

```
Should_{ResultadoEsperado}_When_{Condicion}
```

> El nombre del metodo bajo prueba ya esta en la clase y el archivo. No se repite en el nombre del escenario.

### Prefijos segun tipo de escenario

| Prefijo | Uso |
|---------|-----|
| `Should_` | Camino feliz: resultado esperado |
| `Should_ReturnError_When_` | Error de validacion o dominio |
| `Should_Throw_When_` | Excepcion esperada |
| `Should_Rollback_When_` | Compensacion o saga |

### Ejemplo: archivo `HandleAsyncTests.cs`

```csharp
public class HandleAsyncTests
{
    private readonly Mock<IOrderRepository> _repoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();
    private readonly CreateOrderHandler _sut;

    public HandleAsyncTests()
    {
        _sut = new CreateOrderHandler(_repoMock.Object, _uowMock.Object);
    }

    [Fact]
    public async Task Should_CreateOrder_When_CommandIsValid()
    {
        // Arrange --------------------------------------------------------
        var command = new CreateOrderCommand(
            ProductId.New(),
            Quantity.From(2),
            Money.From(100, "USD"));

        Order? captured = null;
        _repoMock
            .Setup(r => r.AddAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
            .Callback<Order, CancellationToken>((o, _) => captured = o);
        _uowMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act ------------------------------------------------------------
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert ----------------------------------------------------------
        result.IsSuccess.Should().BeTrue();
        result.Value.Id.Should().NotBeEmpty();
        captured.Should().NotBeNull();
        captured!.Lines.Should().HaveCount(1);
        _repoMock.Verify(r => r.AddAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Should_ReturnValidationError_When_QuantityIsNegative()
    {
        // Arrange --------------------------------------------------------
        var command = new CreateOrderCommand(
            ProductId.New(),
            Quantity.From(-5),
            Money.From(100, "USD"));

        // Act ------------------------------------------------------------
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert ----------------------------------------------------------
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().Contain(e => e.Code == "Order.Quantity.Negative");
    }

    [Fact]
    public async Task Should_ReturnError_When_ProductNotFound()
    {
        // Arrange --------------------------------------------------------
        var command = new CreateOrderCommand(
            ProductId.New(),
            Quantity.From(1),
            Money.From(100, "USD"));

        _repoMock
            .Setup(r => r.GetProductAsync(command.ProductId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);

        // Act ------------------------------------------------------------
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert ----------------------------------------------------------
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().Contain(e => e.Code == "Product.NotFound");
    }

    [Fact]
    public async Task Should_RollbackInventory_When_PaymentFails()
    {
        // Arrange --------------------------------------------------------
        var command = new CreateOrderCommand(
            ProductId.New(),
            Quantity.From(2),
            Money.From(100, "USD"));

        _repoMock
            .Setup(r => r.GetProductAsync(command.ProductId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Product { Id = command.ProductId, Stock = 10 });
        _uowMock
            .SetupSequence(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1)   // reserva exitosa
            .ThrowsAsync(new PaymentFailedException());  // pago falla

        // Act ------------------------------------------------------------
        Func<Task> act = () => _sut.Handle(command, CancellationToken.None);

        // Assert ----------------------------------------------------------
        await act.Should().ThrowAsync<PaymentFailedException>();
        _repoMock.Verify(r => r.ReleaseStockAsync(command.ProductId, command.Quantity, It.IsAny<CancellationToken>()), Times.Once);
    }
}
```

### Nomenclatura completa

| Elemento | Convencion | Ejemplo |
|----------|-----------|---------|
| Carpeta | `{Clase}Tests/` | `CreateOrderHandlerTests/` |
| Archivo | `{Metodo}Tests.cs` | `HandleAsyncTests.cs` |
| Clase | `{Metodo}Tests` | `public class HandleAsyncTests` |
| Metodo `[Fact]` | `Should_{Resultado}_When_{Condicion}` | `Should_CreateOrder_When_CommandIsValid` |

## Patron AAA (Arrange, Act, Assert)

Cada metodo `[Fact]` se organiza estrictamente en tres bloques visibles:

```
// Arrange --------------------------------------------------------
//   Preparar mocks, stubs, datos de entrada, estado inicial

// Act ------------------------------------------------------------
//   Una unica llamada al metodo bajo prueba (SUT)

// Assert ----------------------------------------------------------
//   Todas las aserciones con FluentAssertions + Verify de mocks
```

### Reglas AAA

- Los comentarios `// Arrange`, `// Act`, `// Assert` con separador visual (`----`) son obligatorios
- Una linea en blanco entre bloques
- **Arrange**: mocks (`Setup`, `SetupSequence`), datos de prueba, callbacks para capturar parametros
- **Act**: una unica expresion llamando al SUT
- **Assert**: `result.Should().*` + `_mock.Verify(...)` sin logica adicional

## Flujo TDD paso a paso

### 1. RED — Escribir el primer escenario que falle

1. Crear carpeta `{Clase}Tests/`
2. Crear archivo `{Metodo}Tests.cs`
3. Escribir el constructor con mocks y SUT
4. Escribir el primer `[Fact] Should_{Resultado}_When_{Condicion}` con AAA
5. Ejecutar `dotnet test --filter "FullyQualifiedName~{Clase}Tests"` → **ROJO**

### 2. GREEN — Escribir el minimo codigo para pasar

Implementar solo lo necesario en el SUT para que ese escenario pase.

```csharp
public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, Result<OrderDto>>
{
    public async Task<Result<OrderDto>> Handle(CreateOrderCommand cmd, CancellationToken ct)
    {
        if (cmd.Quantity.Value <= 0)
            return Result.Fail(Error.Validation("Order.Quantity.Negative", "..."));

        var order = Order.Create(cmd.ProductId, cmd.Quantity, cmd.Price);
        _repo.AddAsync(order, ct);
        await _uow.SaveChangesAsync(ct);
        return Result.Ok(new OrderDto(order.Id, order.Total.Amount, order.Status));
    }
}
```

Ejecutar `dotnet test --filter "FullyQualifiedName~{Clase}Tests"` → **VERDE**.

### 3. REFACTOR — Mejorar sin romper

- Extraer validacion a FluentValidator
- Mover logica de creacion a metodo de fabrica en la entidad
- Introducir Value Objects para encapsular reglas
- Ejecutar `dotnet test` despues de cada micro-cambio

### 4. Siguiente escenario (RED → GREEN → REFACTOR)

Agregar otro `[Fact]` en el mismo archivo `HandleAsyncTests.cs`:

```
Should_ReturnError_When_ProductNotFound
```

Ciclo RED-GREEN-REFACTOR se repite hasta cubrir todos los escenarios del metodo.

## Convenciones de la clase de test

```csharp
public class {Metodo}Tests
{
    // Mocks como campos readonly
    private readonly Mock<IDependencia> _depMock = new();
    private readonly Mock<IOtraDependencia> _otraMock = new();

    // SUT — System Under Test
    private readonly {ClaseProbada} _sut;

    // Constructor: inicializa SUT con mocks
    public {Metodo}Tests()
    {
        _sut = new {ClaseProbada}(_depMock.Object, _otraMock.Object);
    }

    [Fact]
    public async Task Should_{Resultado}_When_{Condicion}()
    {
        // Arrange --------------------------------------------------------

        // Act ------------------------------------------------------------

        // Assert ----------------------------------------------------------
    }

    [Fact]
    public async Task Should_ReturnError_When_{OtraCondicion}()
    {
        // Arrange --------------------------------------------------------

        // Act ------------------------------------------------------------

        // Assert ----------------------------------------------------------
    }

    // ... mas escenarios del mismo metodo
}
```

## Persistencia entre sesiones

El progreso TDD se guarda automaticamente en `.harness-state.json` via el subagente `features`. Si la sesion se corta, al reabrir el `leader` detecta el campo `tdd` y te indica exactamente donde retomar.

Cada vez que completas un paso del ciclo (RED, GREEN, REFACTOR), el agente `develop` invoca:

```
@features tdd save F004 step=green class=CreateOrderHandler method=HandleAsync testFile=.../HandleAsyncTests.cs scenario=Should_ReturnError_When_ProductNotFound
```

Esto actualiza el campo `tdd` de la feature en `.harness-state.json`:

```json
"tdd": {
  "step": "green",
  "class": "CreateOrderHandler",
  "method": "HandleAsync",
  "testFile": "tests/.../HandleAsyncTests.cs",
  "scenario": "Should_ReturnError_When_ProductNotFound",
  "scenariosCompleted": ["Should_CreateOrder_When_CommandIsValid"],
  "scenariosPending": ["Should_ReturnError_When_ProductNotFound", "Should_RollbackInventory_When_PaymentFails"]
}
```

Al reabrir opencode, el `leader` reporta: _"Retomando F004 en HandleAsyncTests.cs, paso GREEN, escenario Should_ReturnError_When_ProductNotFound. Faltan 2 escenarios pendientes."_

## Herramientas

| Herramienta | Proposito |
|------------|-----------|
| xUnit | Framework de pruebas |
| Moq | Mocking (Setup, SetupSequence, Verify, Callback) |
| FluentAssertions | Aserciones legibles (Should().Be(), Should().Contain(), Should().ThrowAsync()) |
| coverlet | Cobertura |

## Reglas

- Nunca escribas codigo de produccion sin una prueba que lo exija
- Nunca escribas mas de una prueba unitaria que falle a la vez
- Nunca escribas mas codigo del necesario para pasar la prueba actual
- Corre `dotnet test` despues de cada ciclo RED-GREEN-REFACTOR
- Una carpeta por clase probada (`{Clase}Tests/`)
- Un archivo `.cs` por metodo con **todos** sus escenarios dentro
- Nombramiento Gherkin: `Should_{Resultado}_When_{Condicion}` para cada `[Fact]`
- Patron AAA obligatorio con comentarios `// Arrange -----`, `// Act -----`, `// Assert -----`
