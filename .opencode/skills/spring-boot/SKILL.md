---
name: spring-boot
description: Convenciones, stack tecnologico y patrones de arquitectura para microservicios Java con Spring Boot. Usar cuando se desarrolle cualquier microservicio Java con clean architecture, DDD, Spring Data JPA, JUnit y Mockito.
---

# Spring Boot Microservice Conventions

## Estructura de solucion (Clean Architecture)

```
src/main/java/{basePackage}/
  {service}/
    api/                 # Controllers REST, advice, middleware
    application/         # Casos de uso, services, DTOs, interfaces
    domain/              # Entidades, value objects, eventos de dominio, interfaces de repositorio
    infrastructure/      # JPA repositories, servicios externos, config
    contracts/           # DTOs compartidos (opcional)
src/test/java/{basePackage}/
  unit/
  integration/
  contract/
```

## Stack tecnologico

| Categoria | Tecnologia |
|-----------|------------|
| Runtime | Java 21 LTS |
| Framework | Spring Boot 3.x |
| API | Spring Web (REST Controllers) |
| ORM | Spring Data JPA + Hibernate |
| Base de datos | PostgreSQL |
| Cache | Redis (Spring Cache) |
| Mensajeria | Spring AMQP + RabbitMQ / Kafka |
| Validacion | Bean Validation (jakarta.validation) |
| Mapeo | MapStruct |
| Logging | SLF4J + Logback |
| Pruebas | JUnit 5 + Mockito + TestContainers |
| Contenerizacion | Docker multi-stage, docker-compose |
| Observabilidad | Micrometer, Prometheus, OpenTelemetry |

## Convenciones de codigo

### Nombrado
- Clases, interfaces: PascalCase
- Metodos, variables: camelCase
- Constantes: UPPER_SNAKE_CASE
- Paquetes: lowercase, jerarquico
- Interfaces: sin prefijo `I` (convencion Java)

### Patrones obligatorios
- **Repository Pattern**: Spring Data JPA repositories
- **Domain Events**: `ApplicationEventPublisher` de Spring
- **Specification Pattern**: `JpaSpecificationExecutor<T>`
- **Guard Clause**: validaciones con `Objects.requireNonNull`
- **Dependency Injection**: inyeccion por constructor (obligatorio)
- **@Transactional**: en capa de aplicacion

### Dependency Injection
- Inyeccion por constructor con `@RequiredArgsConstructor` (Lombok)
- NO inyeccion por campo (`@Autowired` en campos)
- NO Service Locator

### Spring Data JPA
- `@Entity`, `@Table`, `@Id`, `@GeneratedValue`
- `JpaRepository<T, ID>` para CRUD
- `@Query` para consultas JPQL/nativas
- Flyway o Liquibase para migraciones
- `@EntityListeners` para audit fields

### API
- `@RestController` + `@RequestMapping`
- `@Valid` para validacion de request bodies
- `@ControllerAdvice` para manejo global de excepciones
- Problem Details (RFC 7807) via `ErrorAttributes`
- Health checks: Spring Actuator `/actuator/health`

## Comandos frecuentes

```bash
# Maven
./mvnw spring-boot:run
./mvnw test
./mvnw clean package -DskipTests
./mvnw flyway:migrate

# Gradle
./gradlew bootRun
./gradlew test
./gradlew build -x test
./gradlew flywayMigrate

# Calidad
./mvnw checkstyle:check
./mvnw spotbugs:check
./mvnw pmd:check
./mvnw dependency-check:check   # OWASP
```
