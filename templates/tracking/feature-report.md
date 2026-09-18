# Plantilla: Tracking Report (por Feature)

> Fase: Tracking (HU-level, rollup a nivel feature)
> Artefacto: `docs/features/{id}-{slug}/tracking-report.md`

---

# Tracking Report: {Nombre de la Feature}

> Feature: {id}
> Generado: {fecha ISO8601} · Herramienta: `@idsanchezf/harness-engineering` track v{version}

## 1. Resumen de la feature

| Metrica | Valor |
|---------|-------|
| Tiempo total | {Xh Ym} |
| Tokens totales | {N} |
| Costo estimado (USD) | {N o "N/D"} |
| Cantidad de HUs | {N} |
| Cobertura de datos | {N}% de fases/tareas con tokens reales disponibles |

## 2. Desglose por HU

| HU | Titulo | Estado | Tiempo total | Tokens totales | Costo est. | Cobertura |
|----|--------|--------|--------------|-----------------|------------|-----------|
| US-001 | {titulo} | {estado} | {Xh Ym} | {N} | {N o "N/D"} | {N}% |

## 3. Desglose por HU y por fase

| HU | Fase | Duracion | Tokens input | Tokens output | Cache creation | Cache read | Total | Fuente |
|----|------|----------|--------------|----------------|-----------------|------------|-------|--------|
| US-001 | develop | {Xh Ym} | {N} | {N} | {N} | {N} | {N} | claude-transcript |
| US-001 | test | {Xh Ym} | {N} | {N} | {N} | {N} | {N} | {fuente} |
| US-001 | quality | {Xh Ym} | {N} | {N} | {N} | {N} | {N} | {fuente} |
| US-001 | deploy | {Xh Ym} | {N} | {N} | {N} | {N} | {N} | {fuente} |
| US-001 | tracking | {Xh Ym} | {N} | {N} | {N} | {N} | {N} | {fuente} |

> "Total" incluye tokens de cache read, que se facturan a una fraccion del costo de un token de input fresco (ver seccion 6, "Ratio cache-read / input fresco"). No asumas que Total ≈ costo lineal.

## 4. Desglose por HU y por tarea

| HU | Task | Descripcion | Capa | Duracion | Tokens totales | Fuente |
|----|------|-------------|------|----------|-----------------|--------|
| US-001 | T001 | {descripcion} | Domain | {Xm} | {N} | {fuente} |

## 5. Consumo por tipo de fase (donde se gasta mas)

| Fase | # ejecuciones | Tiempo total | Tiempo promedio | Tokens totales | Tokens promedio | % del total de tokens |
|------|---------------|--------------|-------------------|-----------------|--------------------|-------------------------|
| develop | {N} | {Xh} | {Xh} | {N} | {N} | {N}% |
| test | {N} | {Xh} | {Xh} | {N} | {N} | {N}% |
| quality | {N} | {Xh} | {Xh} | {N} | {N} | {N}% |
| deploy | {N} | {Xh} | {Xh} | {N} | {N} | {N}% |
| tracking | {N} | {Xh} | {Xh} | {N} | {N} | {N}% |

**Fase con mayor consumo de tokens**: {fase} ({N}% del total).
**Fase con mayor consumo de tiempo**: {fase} ({N}% del total).

## 6. Metricas derivadas

| Metrica | Valor |
|---------|-------|
| Promedio tokens/HU | {N} |
| Promedio tiempo/HU | {Xh Ym} |
| HU con mas tokens | {huId} ({N}) |
| HU mas lenta | {huId} ({Xh Ym}) |
| Tarea con mas tokens | {taskId} ({N}) |
| Ratio cache-read / input fresco | {N}x |

## 7. Cobertura y limitaciones de los datos

| Fase/Tarea | Motivo de falta de datos |
|------------|--------------------------|
| {ej. US-002 / quality} | {ej. ningun transcript coincidio por description ni por ventana de tiempo} |

> Los totales de las secciones 1 y 2 excluyen fases/tareas marcadas "N/D". Si la cobertura es menor a 100%, los totales NO representan el consumo real completo — son un piso, no el numero final.

## 8. Metadata de generacion

- Comando: `npx @idsanchezf/harness-engineering@{version} track collect --feature {id}`
- Generado: {fecha ISO8601}
