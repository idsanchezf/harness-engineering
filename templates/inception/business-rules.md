# Plantilla: Business Rules

> Fase: Inception > Track B — Bootstrapping Tecnico > DDD
> Artefacto: `docs/inception/business-rules.md`

---

# Reglas de Negocio: {Nombre del Proyecto}

## Bounded Context: {Nombre}

### Reglas de negocio

| ID | Regla | Tipo | Invariante / Restriccion | Origen | Implementacion |
|----|-------|------|--------------------------|--------|---------------|
| BR-001 | {descripcion de la regla en lenguaje de negocio} | Invariante / Calculo / Validacion / Proceso | {que siempre debe cumplirse} | {stakeholder, regulacion, analisis} | {donde se implementa: agregado, servicio de dominio, handler} |

Ejemplos:
| BR-001 | Una orden no puede exceder $10,000 sin aprobacion de supervisor | Invariante | Order.total <= 10000 OR Order.approvedBy IS NOT NULL | Politica de compliance | Agregado Order |
| BR-002 | El precio final incluye IVA (19%) para clientes nacionales | Calculo | finalPrice = basePrice * 1.19 cuando customer.country = pais local | Regulacion tributaria | Value Object Money |
| BR-003 | Al cancelar una orden, se debe liberar el inventario reservado | Proceso | OrderCancelled → ReleaseInventory | Experto de dominio | Saga / Domain Event |

### Categorias de reglas

- **Invariante**: Regla que siempre debe cumplirse. Se protege en el agregado.
- **Calculo**: Formula o algoritmo de negocio. Se implementa en value objects o servicios de dominio.
- **Validacion**: Regla de entrada que previene estados invalidos. Se implementa en comandos/handlers.
- **Proceso**: Regla que describe un flujo multi-paso. Se implementa como saga o workflow.

---

## Bounded Context: {Siguiente}

(Repetir estructura para cada bounded context)

---

## Reglas cross-cutting

| ID | Regla | Aplica en |
|----|-------|-----------|
| BR-X01 | {regla que aplica a multiples BCs} | BC{A}, BC{B} |
