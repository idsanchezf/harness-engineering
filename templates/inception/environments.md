# Plantilla: Environments

> Fase: Inception > Track B — Bootstrapping Tecnico > Ambientes
> Artefacto: `docs/inception/environments.md`

---

# Definicion de Ambientes: {Nombre del Proyecto}

## Tabla de ambientes

| Ambiente | Proposito | Proveedor | Region | Recursos estimados | Costo mensual estimado |
|----------|-----------|-----------|--------|--------------------|-----------------------|
| **dev** | Desarrollo local con dependencias reales | Local (Docker Compose) | — | 4 GB RAM, 4 CPU | $0 |
| **staging** | Pruebas de integracion y QA | {AWS, Azure, GCP} | {region} | 2 nodos, 2 GB RAM c/u | ${costo} |
| **prod** | Produccion | {AWS, Azure, GCP} | {region} | 3+ nodos, 4 GB RAM c/u, multi-AZ | ${costo} |

---

## Ambiente: dev (Local)

### Servicios en Docker Compose

| Servicio | Imagen | Puerto | Volumenes |
|----------|--------|--------|-----------|
| API | build: . | 8080 | ./src:/app (hot reload) |
| Base de datos | {postgres:16, mongo:7, mcr.microsoft.com/mssql:2022} | 5432 | pgdata:/var/lib/postgresql |
| Cache | {redis:7-alpine} | 6379 | — |
| Message broker | {rabbitmq:3-management} | 5672, 15672 | — |

### Variables de entorno (`.env`)

```env
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__Default=Host=localhost;Port=5432;Database={db};Username={user};Password={pass}
Redis__ConnectionString=localhost:6379
MessageBroker__Host=localhost
```

---

## Ambiente: staging

### Infraestructura cloud

| Recurso | Tipo | Especificaciones | Cantidad |
|---------|------|-----------------|----------|
| Compute | {ECS Fargate, AKS, GKE, Cloud Run, App Service} | {spec} | {N} |
| Base de datos | {RDS, Cloud SQL, Cosmos DB} | {tier} | 1 |
| Cache | {ElastiCache, Memorystore} | {tier} | 1 |
| Message broker | {MSK, Event Hubs, Pub/Sub} | {tier} | 1 |
| Storage | {S3, Blob, GCS} | Standard | 2 buckets |

### CI/CD

- **Trigger**: Push a rama `feature/*` → deploy a staging
- **Pipeline**: build → test → scan → deploy
- **Health check**: `GET /health` cada 30s
- **Rollback**: Automatico si health check falla 3 veces consecutivas

---

## Ambiente: prod

### Infraestructura cloud

| Recurso | Tipo | Especificaciones | Cantidad | Alta disponibilidad |
|---------|------|-----------------|----------|-------------------|
| Compute | {ECS, AKS, GKE, Cloud Run} | {spec} | {N} pods x AZ | Multi-AZ |
| Base de datos | {RDS Multi-AZ, Cloud SQL HA} | {tier} | 1 primario + 1 replica | Failover automatico |
| Cache | {ElastiCache Cluster, Memorystore HA} | {tier} | 1 primario + 1 replica | Failover automatico |
| Message broker | {MSK, Event Hubs, Pub/Sub} | {tier} | {N} brokers | Multi-AZ |
| Storage | {S3, Blob, GCS} | Standard | 2 buckets | Multi-AZ |
| CDN | {CloudFront, Azure CDN, Cloud CDN} | — | 1 | Global |
| DNS / SSL | {Route53 + ACM, Azure DNS, Cloud DNS} | — | 1 | — |

### Estrategia de despliegue

| Parametro | Valor |
|-----------|-------|
| Estrategia | Blue-green / Canary / Rolling update |
| Health check | `GET /health/ready` cada 10s |
| Timeout de despliegue | 10 minutos |
| Rollback | Automatico si: health check falla, tasa de error > 1%, latencia p95 > 2x baseline |
| Ventana de mantenimiento | {horario} |
