---
name: tdd-jest
description: Test-Driven Development para JavaScript/TypeScript con Jest. Usar cuando se implemente codigo nuevo o se modifique existente. Ciclo RED-GREEN-REFACTOR con persistencia automatica del progreso en .harness-state.json. Organizacion: una carpeta por clase, un archivo por metodo con todos sus escenarios, nombramiento Gherkin y patron AAA.
---

# TDD — Test-Driven Development para Node.js (Jest)

## Flujo TDD estricto

```
RED  ->  GREEN  ->  REFACTOR
```

## Estructura de archivos de prueba

```
tests/unit/
├── application/
│   └── orders/
│       └── create-order-handler.test.ts       ← metodo handle
├── domain/
│   └── orders/
│       ├── order.test.ts                       ← entidad Order
│       └── money.test.ts                       ← Value Object Money
```

### Reglas de organizacion

| Regla | Ejemplo |
|-------|---------|
| Carpeta refleja modulo | `application/orders/` |
| Archivo `{nombre}.test.ts` | `create-order-handler.test.ts` |
| N escenarios dentro | Todos los `test()` del handler en el mismo archivo |
| `describe` agrupa | `describe('CreateOrderHandler', () => { ... })` |

## Nombramiento Gherkin para escenarios

```typescript
test('should {resultado} when {condicion}', async () => { ... })
```

### Prefijos segun tipo de escenario

| Prefijo | Uso |
|---------|-----|
| `should {result}_when_` | Camino feliz |
| `should return error when_` | Error de validacion o dominio |
| `should throw when_` | Excepcion esperada |
| `should rollback when_` | Compensacion |

## Patron AAA (Arrange, Act, Assert)

```typescript
import { describe, test, expect, jest, beforeEach } from '@jest/globals';

describe('CreateOrderHandler', () => {
    let repoMock: jest.Mocked<OrderRepository>;
    let uowMock: jest.Mocked<UnitOfWork>;
    let sut: CreateOrderHandler;

    beforeEach(() => {
        repoMock = {
            add: jest.fn(),
            getById: jest.fn(),
        } as any;
        uowMock = {
            saveChanges: jest.fn(),
        } as any;
        sut = new CreateOrderHandler(repoMock, uowMock);
    });

    test('should create order when command is valid', async () => {
        // Arrange --------------------------------------------------------
        const cmd = new CreateOrderCommand('p1', 2, new Money(100, 'USD'));
        uowMock.saveChanges.mockResolvedValue(1);

        // Act ------------------------------------------------------------
        const result = await sut.handle(cmd);

        // Assert ----------------------------------------------------------
        expect(result.isSuccess).toBe(true);
        expect(result.value.id).toBeDefined();
        expect(repoMock.add).toHaveBeenCalledTimes(1);
    });

    test('should return error when quantity is negative', async () => {
        // Arrange --------------------------------------------------------
        const cmd = new CreateOrderCommand('p1', -5, new Money(100, 'USD'));

        // Act ------------------------------------------------------------
        const result = await sut.handle(cmd);

        // Assert ----------------------------------------------------------
        expect(result.isFailure).toBe(true);
        expect(result.errors).toContainEqual(expect.objectContaining({ code: 'Order.Quantity.Negative' }));
    });
});
```

## Convenciones de Jest

- `describe()` para agrupar escenarios
- `test()` o `it()` para cada escenario
- `beforeEach()` para inicializar SUT y mocks
- `jest.fn()` / `jest.spyOn()` para mocking
- `expect()` para aserciones
- `mockResolvedValue()` / `mockRejectedValue()` para async
- `jest.useFakeTimers()` para control de tiempo

## Flujo TDD paso a paso

### 1. RED — Escribir el primer escenario que falle

```bash
npx jest tests/unit/application/orders/create-order-handler.test.ts
# → ROJO: 1 failed
```

### 2. GREEN — Escribir el minimo codigo para pasar

```bash
npx jest tests/unit/application/orders/create-order-handler.test.ts
# → VERDE: 1 passed
```

### 3. REFACTOR — Mejorar sin romper

```bash
npx jest tests/unit/
# → VERDE: todos pasan
```

## Herramientas

| Herramienta | Proposito |
|------------|-----------|
| Jest / Vitest | Framework de pruebas |
| jest.fn() / vi.fn() | Mocking |
| expect() | Aserciones |
| Supertest | HTTP assertions para integration tests |
| TestContainers (testcontainers-node) | Contenedores reales |
| c8 / istanbul | Cobertura |

## Reglas

- Nunca escribas codigo de produccion sin una prueba que lo exija
- Nunca escribas mas de una prueba unitaria que falle a la vez
- Nunca escribas mas codigo del necesario para pasar la prueba actual
- Corre `npx jest` despues de cada ciclo RED-GREEN-REFACTOR
- Un archivo `{modulo}.test.ts` por clase/funcion con todos sus escenarios
- Nombramiento Gherkin: `should {resultado} when {condicion}`
- Patron AAA obligatorio con comentarios `// Arrange ----`, `// Act ----`, `// Assert ----`
