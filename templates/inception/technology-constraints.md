# Plantilla: Technology Constraints

> Fase: Inception > Track A — Discovery
> Artefacto: `docs/inception/technology-constraints.md`

---

# Restricciones Tecnologicas: {Nombre del Proyecto}

## 1. Plataformas obligatorias

- **Cloud provider**: {AWS, Azure, GCP} — motivo: {contrato existente, compliance, expertise}
- **Container orchestration**: Kubernetes / Docker Swarm / Serverless — motivo: {razon}
- **CI/CD**: {GitHub Actions, GitLab CI, Azure DevOps, Jenkins} — motivo: {razon}

## 2. Lenguajes / Runtimes permitidos

| Lenguaje | Version | Permitido | Restriccion |
|----------|---------|-----------|-------------|
| {lenguaje} | {version} | Si / No | {motivo de la restriccion} |

## 3. Proveedores cloud y servicios

| Servicio | Proveedor | Obligatorio | Alternativa |
|----------|-----------|-------------|-------------|
| Base de datos | {AWS RDS, Azure SQL, GCP Cloud SQL} | Si / No | {PostgreSQL, MySQL, etc.} |
| Cache | {Redis, Memcached} | Si / No | — |
| Message broker | {Kafka, RabbitMQ, SQS, Azure Service Bus} | Si / No | — |
| Object storage | {S3, Azure Blob, GCS} | Si / No | — |
| Secrets management | {Vault, AWS Secrets Manager, Azure Key Vault} | Si / No | — |

## 4. Restricciones de compliance tecnica

- Datos deben residir en region: {region}
- Certificaciones requeridas: {SOC 2, ISO 27001, PCI-DSS, HIPAA}
- Frameworks de seguridad obligatorios: {NIST, CIS Benchmarks}
- Herramientas de seguridad pre-aprobadas: {lista}

## 5. Make vs Buy

| Componente | Decision | Justificacion |
|------------|----------|---------------|
| Autenticacion | Build / Buy / Open Source | {Auth0, Keycloak, implementacion propia} |
| Pagos | Buy | {Stripe, Adyen} — certificacion PCI-DSS |
| Notificaciones | Buy / Open Source | {SendGrid, Firebase, SMTP propio} |
| Busqueda | Buy / Open Source | {Elasticsearch, Algolia} |
| Feature flags | Buy / Open Source | {LaunchDarkly, Unleash} |

## 6. Stack tecnologico propuesto (preliminar)

Basado en las restricciones anteriores, el stack preliminar es:

| Capa | Tecnologia | Justificacion |
|------|-----------|---------------|
| Runtime | {.NET 8, Node.js 20, Python 3.12, Go 1.22, Java 21, Rust} | {razon} |
| Framework | {ASP.NET Core, Express, FastAPI, Chi, Spring Boot, Axum} | {razon} |
| Base de datos | {PostgreSQL, SQL Server, MongoDB} | {razon} |
| ORM | {EF Core, Prisma, SQLAlchemy, sqlc, JPA, sqlx} | {razon} |

> Nota: El stack definitivo se define durante el bootstrapping tecnico (Track B) y se registra en `docs/architecture.md`.
