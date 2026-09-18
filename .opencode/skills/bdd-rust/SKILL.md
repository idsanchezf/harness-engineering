---
name: bdd-rust
description: Behavior-Driven Development para Rust con cucumber-rs. Usar cuando se definan criterios de aceptacion con lenguaje Gherkin (Given-When-Then) y se automaticen como pruebas vivas de especificacion.
---

# BDD — Behavior-Driven Development para Rust (cucumber-rs)

## Flujo BDD

```
Descubrimiento  ->  Formulacion  ->  Automatizacion
```

### 1. Descubrimiento — Refinar requisitos con ejemplos concretos

Realizar sesiones de Example Mapping o Specification by Example con stakeholders.

### 2. Formulacion — Escribir en Gherkin

```gherkin
# tests/features/orders/create_order.feature
Feature: Crear pedido

  Scenario: Pedido valido con items en stock
    Given un producto "Laptop" con stock 10 y precio 1500 USD
    And un cliente autenticado con id "C001"
    When el cliente crea un pedido con 2 unidades de "Laptop"
    Then el pedido se registra con estado "Pendiente"
    And el total del pedido es 3000 USD
    And el stock de "Laptop" se reduce a 8

  Scenario: Cantidad negativa rechazada
    When el cliente intenta crear un pedido con -3 unidades de "Laptop"
    Then el sistema rechaza con error "Order.Quantity.Negative"
```

### 3. Automatizacion — Implementar step definitions

```rust
// tests/features/steps/create_order.rs
use cucumber::{given, when, then, World};

#[derive(Debug, Default, World)]
pub struct OrderWorld {
    product: Option<Product>,
    result: Option<Result<OrderDto, OrderError>>,
}

#[given(regex = r#"^un producto "(.*)" con stock (\d+) y precio (\d+) USD$"#)]
async fn a_product_with_stock_and_price(world: &mut OrderWorld, name: String, stock: u32, price: u32) {
    world.product = Some(Product::new(name, stock, Money::new(price, "USD")));
}

#[when(regex = r#"^el cliente crea un pedido con (\d+) unidades de "(.*)"$"#)]
async fn client_creates_order(world: &mut OrderWorld, qty: u32, _product_name: String) {
    let cmd = CreateOrderCommand { product_id: world.product.as_ref().unwrap().id.clone(), quantity: qty };
    world.result = Some(handler.handle(cmd).await);
}

#[then(regex = r#"^el pedido se registra con estado "(.*)"$"#)]
async fn order_registered_with_status(world: &mut OrderWorld, status: String) {
    let order = world.result.as_ref().unwrap().as_ref().unwrap();
    assert_eq!(order.status, status);
}
```

## Herramientas

| Herramienta | Proposito |
|------------|-----------|
| cucumber-rs | Engine BDD para Rust |
| Gherkin | Lenguaje de especificacion |
| tokio::test | Runtime async para steps (via `World::run`) |

## Reglas

- Un archivo `.feature` por feature de negocio en `tests/features/`
- Cada scenario debe ser independiente: el estado se guarda en la struct `World` (derivada con `#[derive(World)]`), nunca en variables globales
- Mantener los step definitions reusables (usar expresiones regulares/Cucumber Expressions parametrizadas, no duplicar)
- Las pruebas BDD son pruebas de aceptacion, no unitarias: validan el sistema completo
- Ejecutar con `cargo test --test cucumber` (o el binario de integracion que invoque `OrderWorld::run(...)`)
