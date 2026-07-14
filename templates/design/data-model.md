# Plantilla: Data Model

> Fase: Design (feature-level)
> Artefacto: `docs/features/{id}-{slug}/data-model.md`

---

# Modelo de Datos: {Nombre de la Feature}

> Feature: {id}
> Bounded Context: {contexto del dominio}

## 1. Diagrama de entidades (ER)

```mermaid
erDiagram
  {EntidadA} ||--o{ {EntidadB} : "tiene"
  {EntidadA} }o--|| {EntidadC} : "pertenece a"

  {EntidadA} {
    uuid Id PK
    string Campo1
    string Campo2
    decimal Monto
    string Estado
    datetime CreatedAt
    datetime UpdatedAt
  }

  {EntidadB} {
    uuid Id PK
    uuid EntidadAId FK
    string Descripcion
    int Cantidad
    datetime CreatedAt
  }
```

## 2. Tablas / Colecciones

### {Nombre de la tabla o coleccion}

| Columna | Tipo | Constraints | Descripcion |
|---------|------|-------------|-------------|
| Id | UUID / INT / BIGINT | PK, NOT NULL | Identificador unico |
| {campo} | VARCHAR(N) / TEXT / INT / DECIMAL / BOOLEAN / JSONB | NOT NULL / NULLABLE / UNIQUE / DEFAULT {valor} | {descripcion} |
| {ForeignId} | UUID | FK → {OtraTabla}(Id) | Referencia a otra entidad |
| CreatedAt | TIMESTAMP / DATETIME | NOT NULL, DEFAULT NOW() | Fecha de creacion |
| UpdatedAt | TIMESTAMP / DATETIME | NULLABLE | Fecha de ultima actualizacion |

### Indices

| Indice | Columnas | Tipo | Proposito |
|--------|----------|------|-----------|
| IX_{Tabla}_{Columna} | {columna} | BTREE / HASH / GIN | {busqueda por, filtro, join} |

## 3. Migraciones

### Estrategia
- **Herramienta**: {EF Core Migrations, Flyway, Alembic, Prisma Migrate, golang-migrate}
- **Convencion de nombres**: {V{YYYYMMDDHHMMSS}__{descripcion}.sql}
- **Rollback**: {soportado / no soportado, requiere migracion inversa manual}

### Migraciones de esta feature

| Version | Descripcion | Tablas afectadas | Rollback |
|---------|-------------|-----------------|----------|
| V001 | Crear tabla {X} | {X} | DROP TABLE {X} |
| V002 | Agregar columna {Y} a {X} | {X} | ALTER TABLE DROP COLUMN {Y} |

## 4. Relaciones con otras features

| Feature | Entidad local | Entidad remota | Tipo de relacion | Consistencia |
|---------|--------------|----------------|-----------------|-------------|
| F00{X} | {Tabla} | {Tabla en feature X} | FK referencial / Logica (no FK) / Eventual | Inmediata / Eventual |

## 5. Consideraciones de rendimiento

- **Particionamiento**: {si aplica, criterio}
- **Archivado**: {politica de purga o archivado de datos antiguos}
- **Cache**: {que datos se cachean, TTL}
- **Paginacion**: {offset-based / cursor-based}
