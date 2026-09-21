---
name: bdd-python
description: Behavior-Driven Development para Python con Behave. Usar cuando se definan criterios de aceptacion con lenguaje Gherkin (Given-When-Then) y se automaticen como pruebas vivas de especificacion.
---

# BDD — Behavior-Driven Development para Python (Behave)

## Flujo BDD

```
Descubrimiento  ->  Formulacion  ->  Automatizacion
```

### 1. Descubrimiento — Refinar requisitos con ejemplos concretos

Realizar sesiones de Example Mapping o Specification by Example con stakeholders.

### 2. Formulacion — Escribir en Gherkin

```gherkin
# features/orders/create_order.feature
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

```python
# features/steps/create_order_steps.py
from behave import given, when, then

@given('un producto "{name}" con stock {stock:d} y precio {price:d} USD')
def step_given_product(context, name, stock, price):
    context.product = Product(name=name, stock=stock, price=Money(price, "USD"))

@when('el cliente crea un pedido con {qty:d} unidades de "{product_name}"')
def step_when_create_order(context, qty, product_name):
    cmd = CreateOrderCommand(product_id=context.product.id, quantity=qty)
    context.result = context.handler.handle(cmd)

@then('el pedido se registra con estado "{status}"')
def step_then_order_status(context, status):
    assert context.result.value.status == status
```

## Herramientas

| Herramienta | Proposito |
|------------|-----------|
| Behave | Engine BDD para Python |
| Gherkin | Lenguaje de especificacion |
| pytest | Runner de pruebas (integrado con behave) |

## Reglas

- Un archivo `.feature` por feature de negocio
- Cada scenario debe ser independiente (usar `context` de behave para estado)
- Mantener los step definitions reusables (usar parametros, no duplicar)
- Las pruebas BDD son pruebas de aceptacion, no unitarias: validan el sistema completo
- Ejecutar con `behave features/`
