# Plantilla: Quality Report (por HU)

> Fase: Quality (HU-level)
> Artefacto: `docs/features/{id}-{slug}/US-{huId}/quality-report.md`

---

# Quality Report: {Titulo de la HU}

> Feature: {id}
> HU: {huId} — {titulo}
> Fecha: {fecha}

## 1. Resumen

| Categoria | Issues | Criticos | Mayores | Menores |
|-----------|--------|----------|---------|---------|
| Code Smells | {N} | {N} | {N} | {N} |
| Seguridad | {N} | {N} | {N} | {N} |
| Duplicacion | {N} | — | — | — |
| Cobertura | {N}% | — | — | — |
| **Total** | **{N}** | **{N}** | **{N}** | **{N}** |

**Quality Gate**: {PASO / FALLO}

## 2. Analisis estatico (Code Smells)

### Issues criticos (bloqueantes)

| ID | Archivo | Linea | Issue | Regla | Recomendacion |
|----|---------|-------|-------|-------|---------------|
| {ID} | {ruta} | {N} | {descripcion} | {regla violada} | {como corregir} |

### Issues mayores

| ID | Archivo | Issue | Recomendacion |
|----|---------|-------|---------------|

### Issues menores (advertencias)

| ID | Archivo | Issue | Recomendacion |
|----|---------|-------|---------------|

## 3. Seguridad (OWASP Top 10)

| ID OWASP | Categoria | Estado | Evidencia |
|-----------|-----------|--------|-----------|
| A01:2021 | Broken Access Control | Pass / Fail / N/A | {hallazgo} |
| A02:2021 | Cryptographic Failures | Pass / Fail / N/A | {hallazgo} |
| A03:2021 | Injection | Pass / Fail / N/A | {hallazgo} |
| A04:2021 | Insecure Design | Pass / Fail / N/A | {hallazgo} |
| A05:2021 | Security Misconfiguration | Pass / Fail / N/A | {hallazgo} |
| A06:2021 | Vulnerable Components | Pass / Fail / N/A | {hallazgo} |
| A07:2021 | Auth Failures | Pass / Fail / N/A | {hallazgo} |
| A08:2021 | Software/Data Integrity | Pass / Fail / N/A | {hallazgo} |
| A09:2021 | Logging/Monitoring Failures | Pass / Fail / N/A | {hallazgo} |
| A10:2021 | SSRF | Pass / Fail / N/A | {hallazgo} |

### Vulnerabilidades en dependencias

| Paquete | Version actual | Vulnerabilidad | Severidad | Version fix | Accion |
|---------|---------------|----------------|-----------|-------------|--------|
| {paquete} | {version} | {CVE-ID o descripcion} | Critica/Alta/Media/Baja | {version} | Actualizar/Ignorar (motivo) |

## 4. Deuda tecnica

| ID | Descripcion | Ubicacion | Esfuerzo estimado | Prioridad |
|----|-------------|-----------|-------------------|-----------|
| TD-001 | {TODO/FIXME/HACK encontrado} | {archivo:linea} | {horas} | Alta/Media/Baja |

### Duplicacion de codigo

| Archivo A | Archivo B | % Duplicado | Recomendacion |
|-----------|-----------|-------------|---------------|

### Codigo muerto

| Ubicacion | Tipo | Recomendacion |
|-----------|------|---------------|

## 5. Metricas

| Metrica | Valor | Umbral | Cumple |
|---------|-------|--------|--------|
| Complejidad ciclomatica promedio | {N} | < 10 | Si / No |
| Lineas por metodo (max) | {N} | < 30 | Si / No |
| Lineas por archivo (max) | {N} | < 300 | Si / No |
| Metodos publicos por clase (max) | {N} | < 10 | Si / No |
| Acoplamiento eferente (max) | {N} | < 15 | Si / No |

## 6. Herramientas ejecutadas

| Herramienta | Comando | Resultado |
|-------------|---------|-----------|
| Linter | `{comando}` | {N} issues |
| SAST | `{comando}` | {N} issues |
| Security scan | `{comando}` | {N} vulnerabilidades |
| Dependency scan | `{comando}` | {N} vulnerabilidades |

## 7. Plan de accion

| Accion | Prioridad | Responsable | Fecha limite |
|--------|-----------|-------------|-------------|
| {corregir issue X} | Critica | {rol} | {fecha} |
| {actualizar paquete Y} | Alta | {rol} | {fecha} |
| {refactorizar Z} | Media | {rol} | {fecha} |
