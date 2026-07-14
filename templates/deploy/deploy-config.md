# Plantilla: Deploy Config (por HU)

> Fase: Deploy (HU-level)
> Artefacto: `docs/features/{id}-{slug}/US-{huId}/deploy-config.md`

---

# Deploy Configuration: {Titulo de la HU}

> Feature: {id}
> HU: {huId} — {titulo}
> Fecha: {fecha}

## 1. CI/CD Pipeline

### Pipeline stages

```yaml
# .github/workflows/deploy.yml (ejemplo)

name: Deploy — {feature}/{huId}

on:
  push:
    branches: [hu/{featureId}-{huId}-{slug}]
  pull_request:
    branches: [feature/{featureId}-{slug}]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup {lenguaje}
        uses: {action}
      - name: Build
        run: {build-command}
      - name: Test
        run: {test-command}

  scan:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: SAST
        run: {sast-command}
      - name: Dependency scan
        run: {dependency-scan-command}

  docker:
    needs: scan
    runs-on: ubuntu-latest
    steps:
      - name: Build image
        run: docker build -t {registry}/{service}:{tag} .
      - name: Scan image
        run: {container-scan-command}
      - name: Push image
        run: docker push {registry}/{service}:{tag}

  deploy-staging:
    needs: docker
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: {deploy-command}
      - name: Health check
        run: curl -f https://{service}.staging.{domain}/health

  deploy-prod:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: {deploy-command}
      - name: Health check
        run: curl -f https://{service}.{domain}/health/ready
      - name: Smoke test
        run: {smoke-test-command}
```

## 2. Dockerfile (multi-stage)

```dockerfile
# Stage 1: Build
FROM {base-image} AS build
WORKDIR /src
COPY . .
RUN {build-command}

# Stage 2: Runtime
FROM {runtime-image} AS runtime
WORKDIR /app
COPY --from=build /src/publish .
USER nonroot
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1
ENTRYPOINT ["{entrypoint}"]
```

## 3. Kubernetes Manifests (si aplica)

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {service}
  labels:
    app: {service}
    feature: {featureId}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: {service}
  template:
    metadata:
      labels:
        app: {service}
    spec:
      containers:
        - name: {service}
          image: {registry}/{service}:{tag}
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "256Mi"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          env:
            - name: ASPNETCORE_ENVIRONMENT
              value: "Production"
            - name: ConnectionStrings__Default
              valueFrom:
                secretKeyRef:
                  name: {service}-secrets
                  key: connection-string
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {service}
spec:
  selector:
    app: {service}
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP
```

## 4. Health Checks

| Endpoint | Tipo | Que verifica | Respuesta esperada |
|----------|------|-------------|-------------------|
| `GET /health` | Liveness | Proceso vivo | 200 OK — `{ "status": "Healthy" }` |
| `GET /health/ready` | Readiness | Dependencias listas (BD, cache, broker) | 200 OK si todo OK, 503 si no |

### Formato de respuesta

```json
{
  "status": "Healthy",
  "checks": {
    "database": { "status": "Healthy", "duration": "5ms" },
    "cache": { "status": "Healthy", "duration": "2ms" },
    "messageBroker": { "status": "Healthy", "duration": "3ms" }
  },
  "duration": "10ms"
}
```

## 5. Observabilidad

### Logging
- **Formato**: JSON estructurado
- **Niveles**: Trace, Debug, Information, Warning, Error, Critical
- **Campos por log**: timestamp, level, message, correlationId, featureId, huId, exception (si aplica)

### Metrics (Prometheus)

| Metrica | Tipo | Descripcion |
|---------|------|-------------|
| `{service}_requests_total` | Counter | Total de requests HTTP |
| `{service}_request_duration_seconds` | Histogram | Latencia de requests (p50, p95, p99) |
| `{service}_errors_total` | Counter | Errores por tipo (4xx, 5xx) |
| `{service}_db_queries_duration_seconds` | Histogram | Duracion de queries a BD |

### Tracing

- **Propagacion**: Header `traceparent` (W3C Trace Context)
- **Spans**: Entrypoint (API), Handler, Repository, External call

## 6. Alertas

| Alerta | Condicion | Severidad | Canal |
|--------|-----------|-----------|-------|
| High error rate | `rate({service}_errors_total[5m]) > 0.01` | Critical | PagerDuty / Teams |
| High latency | `histogram_quantile(0.95, {service}_request_duration_seconds[5m]) > 0.5` | Warning | Slack / Teams |
| Service down | `up{job="{service}"} == 0` for 3m | Critical | PagerDuty / Teams |
| DB connection pool exhausted | `{service}_db_connections_active > 80` | Warning | Slack / Teams |

## 7. Estrategia de despliegue

| Parametro | Valor |
|-----------|-------|
| Estrategia | {Blue-green / Canary / Rolling update} |
| Health check grace period | {N} segundos |
| Timeout de despliegue | {N} minutos |
| Rollback automatico | Si — condicion: {health check falla, tasa de error > 1%} |
| Rollback manual | `{rollback-command}` |
