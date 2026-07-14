---
name: tdd-rust
description: Test-Driven Development para Rust con cargo test. Usar cuando se implemente codigo nuevo o se modifique existente. Ciclo RED-GREEN-REFACTOR con persistencia automatica del progreso en .harness-state.json. Organizacion: una carpeta por modulo, un archivo por funcion con todos sus escenarios, nombramiento Gherkin y patron AAA.
---

# TDD — Test-Driven Development para Rust (cargo test)

## Flujo TDD estricto

```
RED  ->  GREEN  ->  REFACTOR
```

## Estructura de archivos de prueba

Rust soporta dos ubicaciones para tests:
- **Unit tests**: en el mismo archivo, modulo `#[cfg(test)] mod tests { ... }`
- **Integration tests**: en `tests/` en la raiz del proyecto

```
src/
├── application/
│   └── orders/
│       └── handlers.rs
│           └── #[cfg(test)] mod tests { ... }     ← unit tests aqui
├── domain/
│   └── orders/
│       ├── order.rs
│       └── money.rs
tests/
├── integration/
│   └── orders_api.rs                              ← integration tests
```

### Reglas de organizacion

| Regla | Ejemplo |
|-------|---------|
| Tests unitarios co-localizados | `#[cfg(test)] mod tests` dentro de `handlers.rs` |
| Integration tests en `tests/` | `tests/integration/orders_api.rs` |
| N escenarios dentro | Todos los `#[test]` del handler en el mismo modulo `tests` |
| `fn {escenario}()` | `fn creates_order_when_command_is_valid()` |

## Nombramiento Gherkin para escenarios

```rust
fn {resultado_esperado}_when_{condicion}()
```

### Prefijos segun tipo de escenario

| Prefijo | Uso |
|---------|-----|
| `{resultado}_when_` | Camino feliz |
| `returns_error_when_` | Error de validacion o dominio |
| `panics_when_` | Panic esperado (usar `#[should_panic]`) |
| `rolls_back_when_` | Compensacion |

## Patron AAA (Arrange, Act, Assert)

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use mockall::predicate::*;
    use mockall::*;

    mock! {
        OrderRepository {}
        #[async_trait]
        impl OrderRepository for OrderRepository {
            async fn add(&self, order: Order) -> Result<(), Error>;
            async fn get_by_id(&self, id: OrderId) -> Result<Option<Order>, Error>;
        }
    }

    fn setup() -> (MockOrderRepository, CreateOrderHandler) {
        let repo = MockOrderRepository::new();
        let handler = CreateOrderHandler::new(Arc::new(repo.clone()));
        (repo, handler)
    }

    #[tokio::test]
    async fn creates_order_when_command_is_valid() {
        // Arrange --------------------------------------------------------
        let (mut repo, handler) = setup();
        let cmd = CreateOrderCommand {
            product_id: "p1".into(),
            quantity: 2,
            price: Money { amount: 100, currency: "USD".into() },
        };

        repo.expect_add()
            .with(eq(Order::new(...)))
            .times(1)
            .returning(|_| Ok(()));

        // Act ------------------------------------------------------------
        let result = handler.handle(cmd).await;

        // Assert ----------------------------------------------------------
        assert!(result.is_ok());
        let order_dto = result.unwrap();
        assert!(!order_dto.id.is_empty());
    }

    #[tokio::test]
    async fn returns_error_when_quantity_is_negative() {
        // Arrange --------------------------------------------------------
        let (_repo, handler) = setup();
        let cmd = CreateOrderCommand {
            product_id: "p1".into(),
            quantity: -5,
            price: Money { amount: 100, currency: "USD".into() },
        };

        // Act ------------------------------------------------------------
        let result = handler.handle(cmd).await;

        // Assert ----------------------------------------------------------
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert_eq!(err.code(), "Order.Quantity.Negative");
    }
}
```

## Convenciones de testing en Rust

- `#[cfg(test)]` para modulo de tests dentro del mismo archivo
- `#[test]` para tests sincronos
- `#[tokio::test]` para tests async
- `#[should_panic(expected = "...")]` para verificar panics
- `mockall` para generar mocks de traits automaticamente
- `assert!()`, `assert_eq!()`, `assert_ne!()` — macros nativos de Rust
- `rstest` para tests parametrizados (opcional)
- `proptest` para property-based testing (opcional)

## Flujo TDD paso a paso

### 1. RED — Escribir el primer escenario que falle

```bash
cargo test handlers::tests::creates_order_when_command_is_valid
# → ROJO: test failed
```

### 2. GREEN — Escribir el minimo codigo para pasar

```bash
cargo test handlers::tests::creates_order_when_command_is_valid
# → VERDE: ok
```

### 3. REFACTOR — Mejorar sin romper

```bash
cargo test
# → VERDE: test result: ok
```

## Herramientas

| Herramienta | Proposito |
|------------|-----------|
| cargo test | Framework de pruebas nativo |
| mockall | Generacion automatica de mocks |
| tokio::test | Runtime async para tests |
| reqwest | Cliente HTTP para integration tests |
| testcontainers | Contenedores reales |
| cargo-tarpaulin | Cobertura |

## Reglas

- Nunca escribas codigo de produccion sin una prueba que lo exija
- Nunca escribas mas de una prueba unitaria que falle a la vez
- Nunca escribas mas codigo del necesario para pasar la prueba actual
- Corre `cargo test` despues de cada ciclo RED-GREEN-REFACTOR
- Tests unitarios en `#[cfg(test)] mod tests` dentro del mismo archivo de codigo
- Nombramiento Gherkin: `{resultado}_when_{condicion}`
- Patron AAA obligatorio con comentarios `// Arrange ----`, `// Act ----`, `// Assert ----`
