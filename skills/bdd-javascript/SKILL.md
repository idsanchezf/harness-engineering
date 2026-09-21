---
name: bdd-javascript
description: Behavior-Driven Development para JavaScript/TypeScript con Cucumber.js. Usar cuando se definan criterios de aceptacion con lenguaje Gherkin (Given-When-Then) y se automaticen como pruebas vivas de especificacion.
---

# BDD — Behavior-Driven Development para Node.js (Cucumber.js)

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

```typescript
// features/step_definitions/create_order.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';

Given('un producto {string} con stock {int} y precio {int} USD', 
    async function (name: string, stock: number, price: number) {
    this.product = await createProduct(name, stock, price);
});

When('el cliente crea un pedido con {int} unidades de {string}',
    async function (qty: number, productName: string) {
    const cmd = new CreateOrderCommand(this.product.id, qty);
    this.result = await this.handler.handle(cmd);
});

Then('el pedido se registra con estado {string}',
    function (status: string) {
    expect(this.result.value.status).toBe(status);
});
```

## Herramientas

| Herramienta | Proposito |
|------------|-----------|
| @cucumber/cucumber | Engine BDD para Node.js |
| Gherkin | Lenguaje de especificacion |
| Jest / Vitest | Runner de pruebas (integrado con cucumber) |

## Reglas

- Un archivo `.feature` por feature de negocio
- Cada scenario debe ser independiente (usar `this` World de cucumber)
- Mantener los step definitions reusables (usar expresiones regulares con parametros)
- Las pruebas BDD son pruebas de aceptacion, no unitarias: validan el sistema completo
- Ejecutar con `npx cucumber-js features/`
