---
name: tdd-java
description: Test-Driven Development para Java con JUnit 5 y Mockito. Usar cuando se implemente codigo nuevo o se modifique existente. Ciclo RED-GREEN-REFACTOR resiliente a interrupciones via tasks.json (el progreso TDD en si no se persiste en .harness-state.json). Organizacion: una carpeta por clase, un archivo por metodo con todos sus escenarios, nombramiento Gherkin y patron AAA.
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

## Resiliencia entre sesiones

El progreso del ciclo TDD (que escenario esta en RED/GREEN/REFACTOR) es interno a la ejecucion de `develop` y **no se persiste** en `.harness-state.json` — solo el estado de la fase `develop` de la HU se persiste (via `features hu phase start/complete`). Si la sesion se interrumpe a mitad de un ciclo:

1. Al retomar, `develop` relee el `tasks.json` de la HU para identificar que tarea estaba `in_progress`.
2. Ejecuta `./mvnw test -Dtest={Clase}Test` de esa tarea para determinar en que estado quedo: si hay un `@Test` fallando, retoma en RED/GREEN sobre ese escenario; si todos los existentes pasan, retoma en REFACTOR o continua con el siguiente escenario.
3. El unico estado persistido es el de la tarea en `tasks.json` (`pending`/`in_progress`/`done`), actualizado via `features task start`/`features task done`.

El codigo y los tests existentes son siempre la fuente de verdad del punto exacto donde quedo el ciclo TDD.

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
