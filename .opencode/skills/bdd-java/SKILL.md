---
name: bdd-java
description: Behavior-Driven Development para Java con Cucumber-JVM. Usar cuando se definan criterios de aceptacion con lenguaje Gherkin (Given-When-Then) y se automaticen como pruebas vivas de especificacion.
---

# BDD — Behavior-Driven Development para Java (Cucumber-JVM)

## Flujo BDD

```
Descubrimiento  ->  Formulacion  ->  Automatizacion
```

### 1. Descubrimiento — Refinar requisitos con ejemplos concretos

Realizar sesiones de Example Mapping o Specification by Example con stakeholders.

### 2. Formulacion — Escribir en Gherkin

```gherkin
# src/test/resources/features/orders/create_order.feature
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

```java
public class CreateOrderSteps {

    @Autowired
    private CreateOrderHandler handler;

    private Product product;
    private Result<OrderDto> result;

    @Given("un producto {string} con stock {int} y precio {int} USD")
    public void unProductoConStockYPrecio(String name, int stock, int price) {
        product = new Product(name, stock, Money.of(price, "USD"));
    }

    @When("el cliente crea un pedido con {int} unidades de {string}")
    public void elClienteCreaUnPedidoConUnidadesDe(int qty, String productName) {
        var cmd = new CreateOrderCommand(product.getId(), qty);
        result = handler.handle(cmd);
    }

    @Then("el pedido se registra con estado {string}")
    public void elPedidoSeRegistraConEstado(String status) {
        assertThat(result.getValue().getStatus()).isEqualTo(status);
    }
}
```

## Herramientas

| Herramienta | Proposito |
|------------|-----------|
| Cucumber-JVM | Engine BDD para Java |
| Gherkin | Lenguaje de especificacion |
| JUnit 5 | Runner de pruebas (via `cucumber-junit-platform-engine`) |
| AssertJ | Aserciones en step definitions |

## Reglas

- Un archivo `.feature` por feature de negocio en `src/test/resources/features/`
- Cada scenario debe ser independiente (inyectar el estado compartido via `@Autowired`/`PicoContainer`, no campos estaticos)
- Mantener los step definitions reusables (usar parametros de Cucumber Expressions, no duplicar)
- Las pruebas BDD son pruebas de aceptacion, no unitarias: validan el sistema completo
- Ejecutar con `./mvnw test` (Cucumber corre como suite JUnit 5)
