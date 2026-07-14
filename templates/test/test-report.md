# Plantilla: Test Report (por HU)

> Fase: Test (HU-level)
> Artefacto: `docs/features/{id}-{slug}/US-{huId}/test-report.md`

---

# Test Report: {Titulo de la HU}

> Feature: {id}
> HU: {huId} — {titulo}
> Fecha: {fecha}

## 1. Resumen de resultados

| Tipo de prueba | Total | Pasaron | Fallaron | Skipped | Duracion |
|---------------|-------|---------|----------|---------|----------|
| Unitarias | {N} | {N} | {N} | {N} | {tiempo} |
| Integracion | {N} | {N} | {N} | {N} | {tiempo} |
| Contract | {N} | {N} | {N} | {N} | {tiempo} |
| **Total** | **{N}** | **{N}** | **{N}** | **{N}** | **{tiempo}** |

**Resultado**: {PASO / FALLO}

## 2. Cobertura

| Capa | Cobertura | Umbral | Cumple |
|------|-----------|--------|--------|
| Domain | {N}% | 80% | Si / No |
| Application | {N}% | 70% | Si / No |
| Infrastructure | {N}% | 60% | Si / No |
| Api | {N}% | 60% | Si / No |
| **Total** | **{N}%** | **70%** | **Si / No** |

## 3. Pruebas unitarias por escenario

| Escenario (Gherkin) | Test | Resultado | Duracion |
|---------------------|------|-----------|----------|
| Should_{X}_When_{Y} | {TestMethod} | Pass / Fail | {ms} |

### Fallos detectados (si aplica)

| Test fallido | Error | Causa raiz | Accion |
|-------------|-------|------------|--------|
| {test} | {mensaje de error} | {causa} | {fix aplicado o pendiente} |

## 4. Pruebas de integracion

| Flujo | Descripcion | Resultado | Dependencias externas |
|-------|-------------|-----------|----------------------|
| {flujo end-to-end} | {descripcion} | Pass / Fail | {BD, cache, broker, API externa} |

## 5. Contract tests (si aplica)

| Contrato | Consumidor | Proveedor | Resultado |
|----------|-----------|-----------|-----------|
| {nombre del contrato} | {servicio} | {servicio} | Pass / Fail |

## 6. Comandos ejecutados

```bash
# Pruebas unitarias
{comando de test unitario del stack}

# Pruebas de integracion
{comando de test de integracion del stack}

# Cobertura
{comando de cobertura del stack}
```

## 7. Recomendaciones

- {recomendacion si la cobertura no alcanza el umbral}
- {recomendacion si hay tests inestables (flaky)}
- {recomendacion de tests adicionales si se detectaron casos no cubiertos}
