---
name: bdd-dotnet
description: Behavior-Driven Development con SpecFlow/Reqnroll para .NET Core. Usar cuando se definan criterios de aceptacion con lenguaje Gherkin (Given-When-Then) y se automaticen como pruebas vivas de especificacion.
---

# BDD — Behavior-Driven Development para .NET Core

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

```csharp
[Binding]
public class CreateOrderSteps
{
    private readonly IOrderRepository _repo;
    private readonly IMediator _mediator;
    private Result<OrderDto> _result;

    [Given(@"un producto ""(.*)"" con stock (\d+) y precio (\d+) USD")]
    public async Task GivenProductWithStockAndPrice(string name, int stock, decimal price) { ... }

    [When(@"el cliente crea un pedido con (\d+) unidades de ""(.*)""")]
    public async Task WhenClientCreatesOrder(int qty, string product) { ... }

    [Then(@"el pedido se registra con estado ""(.*)""")]
    public void ThenOrderRegisteredWithStatus(string status) { ... }
}
```

## Herramientas

| Herramienta | Proposito |
|------------|-----------|
| Reqnroll (antes SpecFlow) | Engine BDD para .NET |
| Gherkin | Lenguaje de especificacion |
| xUnit | Runner de pruebas (integrado con Reqnroll) |
| FluentAssertions | Aserciones en step definitions |

## Reglas

- Un archivo `.feature` por feature de negocio
- Cada scenario debe ser independiente (no compartir estado entre scenarios)
- Mantener los step definitions reusables (usar parametros, no duplicar)
- Las pruebas BDD son pruebas de aceptacion, no unitarias: validan el sistema completo
