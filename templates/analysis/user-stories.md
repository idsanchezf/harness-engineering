# Plantilla: User Stories

> Fase: Analysis (feature-level)
> Artefacto: `docs/features/{id}-{slug}/user-stories.md`

---

# User Stories: {Nombre de la Feature}

> Feature: {id}
> Bounded Context: {contexto del dominio — de docs/inception/domain-model.md}
> Fecha: {fecha}

---

## US-001: {Titulo descriptivo}

**Prioridad**: Must have / Should have / Could have

**Entidades afectadas**: {User, AuthToken, etc. — del modelo de dominio}
**Eventos de dominio**: {UserRegistered, etc. — del catalogo de eventos}

### Criterios de aceptacion (Gherkin)

> Los escenarios Gherkin aqui definidos son la fuente de verdad para el BDD.

```gherkin
Feature: {Nombre de la feature — US-001}
  Como {rol}
  Quiero {accion}
  Para {beneficio}

  # === Happy Path ===

  Scenario: Should_{ResultadoEsperado}_When_{Condicion}
    Given {precondicion o estado inicial del sistema}
    When {accion que ejecuta el usuario/sistema}
    Then {resultado esperado}

  # === Edge Cases ===

  Scenario: Should_{Resultado}_When_{CondicionLimite}
    Given {precondicion}
    When {accion}
    Then {resultado}

  # === Error Cases ===

  Scenario: Should_ReturnError_When_{CondicionInvalida}
    Given {precondicion}
    When {accion}
    Then {codigo de error y mensaje esperado}

  Scenario: Should_ReturnError_When_{Conflicto}
    Given {precondicion — recurso ya existe, estado invalido}
    When {accion}
    Then {codigo de error 409 Conflict}

  Scenario: Should_ReturnError_When_{SinPermisos}
    Given {precondicion — usuario sin permisos}
    When {accion}
    Then {codigo de error 403 Forbidden}
```

### Ejemplo concreto

```gherkin
Feature: Registro con Google OAuth2
  Como usuario nuevo
  Quiero registrarme usando mi cuenta de Google
  Para no tener que crear otra cuenta y contraseña

  # Happy Path
  Scenario: Should_ReturnAuthToken_When_GoogleCodeIsValid
    Given que Google devuelve un codigo de autorizacion valido
    When el usuario envia POST /api/auth/google con { code: "valid-google-code" }
    Then el sistema retorna 200 OK con { accessToken, refreshToken, expiresIn }
    And se crea un nuevo usuario en la base de datos
    And se publica el evento UserRegistered

  # Edge Case
  Scenario: Should_ReturnExistingToken_When_UserAlreadyRegistered
    Given que el usuario ya esta registrado con la misma cuenta de Google
    When el usuario envia POST /api/auth/google con { code: "valid-google-code" }
    Then el sistema retorna 200 OK con el token existente
    And no se crea un usuario duplicado

  # Error Cases
  Scenario: Should_ReturnUnauthorized_When_GoogleCodeIsInvalid
    Given que Google rechaza el codigo de autorizacion
    When el usuario envia POST /api/auth/google con { code: "invalid-code" }
    Then el sistema retorna 401 Unauthorized
    And el mensaje de error indica "Codigo de autorizacion invalido o expirado"
```

---

## US-002: {Titulo}

**Como** {rol}
**Quiero** {accion}
**Para** {beneficio}

**Prioridad**: Must have / Should have / Could have

**Entidades afectadas**: {lista}
**Eventos de dominio**: {lista}

### Criterios de aceptacion (Gherkin)

```gherkin
Feature: {Nombre de la feature — US-002}
  Como {rol}
  Quiero {accion}
  Para {beneficio}

  Scenario: Should_{Resultado}_When_{Condicion}
    Given {precondicion}
    When {accion}
    Then {resultado esperado}
```

(Repetir estructura para cada HU)

---

## Resumen de HUs

| ID | Titulo | Prioridad | Entidades clave | Escenarios |
|----|--------|-----------|-----------------|------------|
| US-001 | {titulo} | Must have | {entidades} | {N} escenarios |
| US-002 | {titulo} | Should have | {entidades} | {N} escenarios |
