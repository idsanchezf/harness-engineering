# Plantilla: NFR Catalog

> Fase: Inception > Track A — Discovery
> Artefacto: `docs/inception/nfr-catalog.md`

---

# Catalogo de Requisitos No Funcionales (NFR): {Nombre del Proyecto}

## 1. Rendimiento

| NFR | Objetivo | Metrica | Medicion |
|-----|----------|---------|----------|
| Tiempo de respuesta API | < 200ms (p95) para lecturas, < 500ms (p95) para escrituras | Latencia | APM / load testing |
| Throughput | > 1000 req/s por instancia | req/s | Load testing |
| Tiempo de inicio | < 30s (cold start) | segundos | Health check |

## 2. Seguridad

| NFR | Objetivo | Estandar |
|-----|----------|----------|
| Autenticacion | OAuth2 / OpenID Connect con JWT | RFC 7519 |
| Autorizacion | RBAC con roles y permisos granulares | — |
| Datos en transito | TLS 1.3 | NIST SP 800-52 |
| Datos en reposo | AES-256 | FIPS 140-2 |
| Secrets | Gestionados via vault, no en codigo ni config | OWASP A07:2021 |
| Escaneo de dependencias | CI/CD con alertas automaticas en vulnerabilidades criticas | OWASP A06:2021 |

## 3. Disponibilidad

| NFR | Objetivo | Estrategia |
|-----|----------|------------|
| Uptime | 99.9% (8.7h downtime/ano) o 99.99% (52min/ano) | Multi-AZ, auto-scaling |
| RPO (Recovery Point Objective) | < 1 hora | Backups incrementales cada hora |
| RTO (Recovery Time Objective) | < 4 horas | Infraestructura como codigo, runbooks |
| Degradacion graceful | Fallback a funcionalidad reducida (no error total) | Circuit breaker, cache |

## 4. Escalabilidad

| NFR | Objetivo | Estrategia |
|-----|----------|------------|
| Escalado horizontal | Auto-escalar basado en CPU > 70% o memoria > 80% | HPA (Kubernetes) o equivalente cloud |
| Picos de carga | Soportar 3x trafico normal en eventos especiales | Pre-warming, rate limiting |
| Crecimiento proyectado | 2x usuarios en 12 meses | Arquitectura stateless, particionamiento |

## 5. Compliance / Regulatorio

| NFR | Objetivo | Marco |
|-----|----------|-------|
| Proteccion de datos personales | Cumplir con normativa aplicable | GDPR, LGPD, CCPA, etc. |
| Residencia de datos | Datos almacenados en region {region} | — |
| Auditoria | Logs de acceso y cambios retenidos por {N} meses | SOC 2, ISO 27001 |
| Retencion de datos | Politica de borrado tras {N} meses de inactividad | — |

## 6. Observabilidad

| NFR | Objetivo | Herramienta |
|-----|----------|-------------|
| Logging | Estructurado (JSON), con correlation ID y niveles | {Serilog, Winston, Zap, etc.} |
| Tracing | Trazabilidad end-to-end entre servicios | OpenTelemetry + {Jaeger, Zipkin, etc.} |
| Metrics | Metricas de negocio y tecnicas expuestas | Prometheus + Grafana |
| Alerting | Alertas por latencia, tasa de error, saturation | Alertmanager / PagerDuty |
| Health checks | Liveness, Readiness, Startup probes | Kubernetes probes |

## 7. Mantenibilidad

| NFR | Objetivo | Estrategia |
|-----|----------|------------|
| Cobertura de pruebas | > 80% dominio, > 70% aplicacion | CI/CD bloqueante |
| Complejidad ciclomatica | < 10 por metodo | Linter en CI |
| Documentacion | API documentada con OpenAPI/Swagger | Generacion automatica |
| Versionado | Versionado semantico (MAJOR.MINOR.PATCH) | Git tags |
