# Plantilla: Tracking Report (Global)

> Fase: Tracking (transversal, rollup de todas las features)
> Artefacto: `docs/tracking/global-report.md`

---

# Tracking Report Global: {Nombre del Proyecto}

> Generado: {fecha ISO8601} · Herramienta: `@idsanchezf/harness-engineering` track v{version}

## 1. Resumen global

| Metrica | Valor |
|---------|-------|
| Features | {N} |
| HUs | {N} |
| Tiempo total del proyecto | {Xh} |
| Tokens totales del proyecto | {N} |
| Costo estimado total (USD) | {N o "N/D"} |
| Cobertura de datos | {N}% |

## 2. Por feature

| Feature | Nombre | Estado | HUs | Tiempo total | Tokens totales | Costo est. | Cobertura |
|---------|--------|--------|-----|--------------|-----------------|------------|-----------|
| F001 | {nombre} | {estado} | {N} | {Xh} | {N} | {N o "N/D"} | {N}% |

## 3. Consumo por tipo de fase (proyecto completo)

| Fase | # ejecuciones | Tiempo total | Tiempo promedio | Tokens totales | Tokens promedio | % del total |
|------|---------------|--------------|-------------------|-----------------|--------------------|--------------|
| analysis | {N} | {Xh} | {Xh} | {N} | {N} | {N}% |
| design | {N} | {Xh} | {Xh} | {N} | {N} | {N}% |
| develop | {N} | {Xh} | {Xh} | {N} | {N} | {N}% |
| test | {N} | {Xh} | {Xh} | {N} | {N} | {N}% |
| quality | {N} | {Xh} | {Xh} | {N} | {N} | {N}% |
| deploy | {N} | {Xh} | {Xh} | {N} | {N} | {N}% |
| tracking | {N} | {Xh} | {Xh} | {N} | {N} | {N}% |

**Fase que mas consume tokens en todo el pipeline**: {fase} ({N}% del total).
**Fase que mas consume tiempo en todo el pipeline**: {fase} ({N}% del total).

> `inception` (pre-fase de proyecto, una sola vez) no esta incluida en esta tabla: el tracking de sus fases queda fuera de alcance en esta version (ver `HARNESS.md`, seccion de riesgos y limitaciones).

## 4. Top 5 HUs mas costosas (todas las features)

| Feature | HU | Tokens totales | Tiempo total |
|---------|-----|-----------------|--------------|
| F001 | US-001 | {N} | {Xh Ym} |

## 5. Top 5 tareas mas costosas

| Feature | HU | Task | Tokens totales |
|---------|-----|------|-----------------|
| F001 | US-001 | T001 | {N} |

## 6. Tendencia (por fecha de completacion de feature)

| Feature | Completada | Tokens | Tiempo | Tokens/HU promedio |
|---------|------------|--------|--------|----------------------|
| F001 | {fecha} | {N} | {Xh} | {N} |

> Util para ver si el consumo por HU sube o baja a medida que el equipo/agentes ganan practica con el stack del proyecto.

## 7. Cobertura y limitaciones

| Feature/HU/Tarea | Motivo de falta de datos |
|-------------------|--------------------------|
| {ej. F002 / US-003 / develop} | {ej. transcript rotado, fuera del rango disponible} |

> Los totales de las secciones 1-3 excluyen entradas marcadas "N/D". Si la cobertura es menor a 100%, son un piso, no el consumo real completo.

## 8. Metadata de generacion

- Comando: `npx @idsanchezf/harness-engineering@{version} track collect`
- Generado: {fecha ISO8601}
