---
name: bdd-go
description: Behavior-Driven Development para Go con Godog. Usar cuando se definan criterios de aceptacion con lenguaje Gherkin (Given-When-Then) y se automaticen como pruebas vivas de especificacion.
---

# BDD — Behavior-Driven Development para Go (Godog)

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

```go
// features/steps/create_order_steps.go
func aProductWithStockAndPrice(ctx context.Context, name string, stock, price int) (context.Context, error) {
    product := domain.NewProduct(name, stock, money.New(price, "USD"))
    return context.WithValue(ctx, productKey, product), nil
}

func theClientCreatesOrderWithUnitsOf(ctx context.Context, qty int, productName string) (context.Context, error) {
    product := ctx.Value(productKey).(*domain.Product)
    cmd := application.CreateOrderCommand{ProductID: product.ID, Quantity: qty}
    result, err := handler.Handle(ctx, cmd)
    return context.WithValue(ctx, resultKey, result), err
}

func theOrderIsRegisteredWithStatus(ctx context.Context, status string) error {
    result := ctx.Value(resultKey).(application.Result)
    if result.Value.Status != status {
        return fmt.Errorf("expected status %q, got %q", status, result.Value.Status)
    }
    return nil
}

func InitializeScenario(sc *godog.ScenarioContext) {
    sc.Given(`^un producto "([^"]*)" con stock (\d+) y precio (\d+) USD$`, aProductWithStockAndPrice)
    sc.When(`^el cliente crea un pedido con (\d+) unidades de "([^"]*)"$`, theClientCreatesOrderWithUnitsOf)
    sc.Then(`^el pedido se registra con estado "([^"]*)"$`, theOrderIsRegisteredWithStatus)
}
```

## Herramientas

| Herramienta | Proposito |
|------------|-----------|
| Godog | Engine BDD para Go (implementacion oficial de Cucumber) |
| Gherkin | Lenguaje de especificacion |
| testing (stdlib) | Runner de pruebas (integrado via `godog.TestSuite`) |

## Reglas

- Un archivo `.feature` por feature de negocio
- Cada scenario debe ser independiente (usar `context.Context` para pasar estado entre steps, no variables globales)
- Mantener los step definitions reusables (usar expresiones regulares parametrizadas, no duplicar)
- Las pruebas BDD son pruebas de aceptacion, no unitarias: validan el sistema completo
- Ejecutar con `go test -run TestFeatures` (suite que invoca `godog.TestSuite`)
