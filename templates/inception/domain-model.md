# Plantilla: Domain Model (DDD)

> Fase: Inception > Track B — Bootstrapping Tecnico > DDD
> Artefacto: `docs/inception/domain-model.md`

---

# Modelo de Dominio: {Nombre del Proyecto}

## 1. Bounded Contexts

### Mapa de contexts

| Bounded Context | Responsabilidad | Tipo | Dependencias |
|----------------|-----------------|------|--------------|
| {Nombre BC} | {que gestiona este contexto} | Core / Supporting / Generic | {otros BCs} |

### Relaciones entre contexts

```
┌──────────────┐     eventos     ┌──────────────┐
│  {Context A}  │ ─────────────▶ │  {Context B}  │
└──────────────┘                 └──────────────┘
        │
        │ API sync
        ▼
┌──────────────┐
│  {Context C}  │
└──────────────┘
```

### Patrones de integracion

| Origen | Destino | Tipo | Mecanismo |
|--------|---------|------|-----------|
| {Context A} | {Context B} | Async (eventos) | Message broker |
| {Context C} | {Context A} | Sync (API) | REST / gRPC |

---

## 2. Bounded Context: {Nombre}

### Proposito
{Descripcion de la responsabilidad del bounded context}

### Entidades

| Entidad | Descripcion | Identidad | Invariantes |
|---------|-------------|-----------|-------------|
| {Entidad} | {que representa} | {campo(s) de identidad} | {reglas que siempre debe cumplir} |

### Value Objects

| Value Object | Descripcion | Campos | Validaciones |
|-------------|-------------|--------|-------------|
| {VO} | {que representa} | {lista de campos} | {reglas de validacion} |

### Agregados

#### {Nombre del Agregado}

- **Raiz**: {Entidad raiz}
- **Entidades internas**: {lista de entidades que pertenecen al agregado}
- **Value Objects**: {lista de VOs del agregado}
- **Invariantes**:
  - {regla 1}
  - {regla 2}
- **Reglas de consistencia**: {que debe ser consistente dentro del agregado}

### Repositorios (interfaces)

| Interfaz | Agregado | Operaciones |
|----------|----------|-------------|
| I{Nombre}Repository | {Agregado} | GetById, Save, Delete, FindBy{...} |

### Servicios de dominio

| Servicio | Proposito | Entradas | Salidas |
|----------|-----------|----------|---------|
| {Servicio} | {que logica de dominio encapsula que no pertenece a una entidad} | {parametros} | {resultado} |

---

## 3. Bounded Context: {Siguiente contexto}

(Repetir estructura de la seccion 2 para cada bounded context)
