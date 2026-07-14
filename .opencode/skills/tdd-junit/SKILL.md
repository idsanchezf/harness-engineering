---
name: tdd-junit
description: Test-Driven Development para Java con JUnit 5 y Mockito. Usar cuando se implemente codigo nuevo o se modifique existente. Ciclo RED-GREEN-REFACTOR con persistencia automatica del progreso en .harness-state.json. Organizacion: una carpeta por clase, un archivo por metodo con todos sus escenarios, nombramiento Gherkin y patron AAA.
---

# TDD — Test-Driven Development para Java (JUnit 5 + Mockito)

## Flujo TDD estricto

```
RED  ->  GREEN  ->  REFACTOR
```

## Estructura de archivos de prueba

```
src/test/java/{basePackage}/
├── unit/
│   ├── application/
│   │   └── orders/
│   │       └── CreateOrderHandlerTest.java       ← handler
│   └── domain/
│       └── orders/
│           ├── OrderTest.java                     ← entidad Order
│           └── MoneyTest.java                     ← Value Object Money
```

### Reglas de organizacion

| Regla | Ejemplo |
|-------|---------|
| Carpeta refleja paquete | `unit/application/orders/` |
| Archivo `{Clase}Test.java` | `CreateOrderHandlerTest.java` |
| N escenarios dentro | Todos los metodos `@Test` del handler en el mismo archivo |
| Metodo `{escenario}()` | `createsOrderWhenCommandIsValid()` |

## Nombramiento Gherkin para escenarios

```java
void {resultadoEsperado}When{Condicion}()
```

### Prefijos segun tipo de escenario

| Prefijo | Uso |
|---------|-----|
| `{result}_When_` | Camino feliz |
| `error_When_` | Error de validacion o dominio |
| `throws_When_` | Excepcion esperada |
| `rollback_When_` | Compensacion |

## Patron AAA (Arrange, Act, Assert)

```java
@ExtendWith(MockitoExtension.class)
class CreateOrderHandlerTest {
    
    @Mock
    private OrderRepository repoMock;
    
    @Mock
    private UnitOfWork uowMock;
    
    @InjectMocks
    private CreateOrderHandler sut;
    
    @Test
    void createsOrderWhenCommandIsValid() {
        // Arrange --------------------------------------------------------
        var cmd = new CreateOrderCommand("p1", 2, new Money(100, "USD"));
        
        when(uowMock.saveChanges()).thenReturn(1);
        
        // Act ------------------------------------------------------------
        var result = sut.handle(cmd);
        
        // Assert ----------------------------------------------------------
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getValue().getId()).isNotNull();
        verify(repoMock).add(any(Order.class));
    }
    
    @Test
    void errorWhenQuantityIsNegative() {
        // Arrange --------------------------------------------------------
        var cmd = new CreateOrderCommand("p1", -5, new Money(100, "USD"));
        
        // Act ------------------------------------------------------------
        var result = sut.handle(cmd);
        
        // Assert ----------------------------------------------------------
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getErrors()).anyMatch(e -> e.getCode().equals("Order.Quantity.Negative"));
    }
}
```

## Convenciones de testing en Java

- `@ExtendWith(MockitoExtension.class)` para inicializar mocks
- `@Mock` para dependencias
- `@InjectMocks` para inyectar mocks en el SUT
- `when().thenReturn()` / `when().thenThrow()` para configurar comportamiento
- `verify()` para verificar interacciones
- AssertJ (`assertThat()`) para aserciones fluidas

## Flujo TDD paso a paso

### 1. RED — Escribir el primer escenario que falle

```bash
./mvnw test -Dtest=CreateOrderHandlerTest
# → ROJO: Tests run: 1, Failures: 1
```

### 2. GREEN — Escribir el minimo codigo para pasar

```bash
./mvnw test -Dtest=CreateOrderHandlerTest
# → VERDE: Tests run: 1, Failures: 0
```

### 3. REFACTOR — Mejorar sin romper

```bash
./mvnw test
# → VERDE: BUILD SUCCESS
```

## Herramientas

| Herramienta | Proposito |
|------------|-----------|
| JUnit 5 | Framework de pruebas |
| Mockito | Mocking |
| AssertJ | Aserciones fluidas |
| TestContainers | Contenedores reales para integration tests |
| JaCoCo | Cobertura |
| MockMvc | Pruebas de controllers Spring MVC |

## Reglas

- Nunca escribas codigo de produccion sin una prueba que lo exija
- Nunca escribas mas de una prueba unitaria que falle a la vez
- Nunca escribas mas codigo del necesario para pasar la prueba actual
- Corre `./mvnw test` despues de cada ciclo RED-GREEN-REFACTOR
- Una clase `{Clase}Test.java` con todos sus escenarios
- Nombramiento Gherkin: `{resultadoEsperado}When{Condicion}()`
- Patron AAA obligatorio con comentarios `// Arrange ----`, `// Act ----`, `// Assert ----`
