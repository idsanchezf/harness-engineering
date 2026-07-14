# Plantilla: Quality Tooling

> Fase: Inception > Track B — Bootstrapping Tecnico > Tooling
> Artefacto: `docs/inception/quality-tooling.md`

---

# Configuracion de Tooling de Calidad y Seguridad: {Nombre del Proyecto}

## 1. Linter y Formateador

| Herramienta | Stack | Proposito | Configuracion | CI/CD |
|-------------|-------|-----------|---------------|-------|
| {nombre} | {lenguaje} | Estilo de codigo / Formateo | {archivo de config} | Bloqueante / Advertencia |

### Reglas clave

- Indentacion: {espacios/tabs}
- Longitud maxima de linea: {N} caracteres
- Complejidad ciclomatica maxima: 10
- Nombrado: {convencion} (PascalCase, camelCase, snake_case)

---

## 2. Analisis Estatico (SAST)

| Herramienta | Stack | Proposito | Cobertura |
|-------------|-------|-----------|-----------|
| {SonarQube, SonarCloud, CodeQL, etc.} | {lenguaje} | Code smells, bugs, vulnerabilidades | Todo el codigo |

### Umbrales de calidad (Quality Gates)

| Metrica | Umbral | Accion si no cumple |
|---------|--------|---------------------|
| Cobertura de pruebas | > 70% | Bloquear PR |
| Duplicacion de codigo | < 3% | Advertencia |
| Issues criticos | 0 | Bloquear PR |
| Issues mayores | < 5 | Advertencia |
| Complejidad ciclomatica | < 10 | Advertencia |

---

## 3. Escaneo de Seguridad

| Herramienta | Stack | Proposito | Frecuencia |
|-------------|-------|-----------|------------|
| Dependabot / Renovate | Universal | Dependencias desactualizadas | Diario / Semanal |
| {Trivy, Snyk, Grype} | Universal | Vulnerabilidades en dependencias | Cada PR + Diario |
| {npm audit, pip-audit, cargo audit, govulncheck} | {stack} | Vulnerabilidades especificas del ecosistema | Cada PR |
| {Trivy, Dockle, Hadolint} | Docker | Escaneo de imagen de contenedor | Cada build |

### Politica de vulnerabilidades

| Severidad | Accion | Tiempo maximo de resolucion |
|-----------|--------|---------------------------|
| Critica | Bloquear deploy, fix inmediato | 24 horas |
| Alta | Bloquear PR, fix prioritario | 1 semana |
| Media | Crear ticket, fix en sprint actual | 2 semanas |
| Baja | Registrar en backlog | 1 mes |

---

## 4. Pre-commit Hooks

Usar {Husky, pre-commit, Lefthook} para ejecutar antes de cada commit:

| Hook | Comando | Proposito |
|------|---------|-----------|
| pre-commit | `{linter} --fix` | Formateo y linting |
| pre-commit | `{typecheck}` | Verificacion de tipos |
| pre-push | `{test}` | Pruebas unitarias |

---

## 5. Integracion en CI/CD

### Pipeline de calidad

```
Pull Request creado
  │
  ├──▶ Linter + Formateo
  ├──▶ Pruebas unitarias + Cobertura
  ├──▶ Analisis estatico (SAST)
  ├──▶ Escaneo de dependencias
  └──▶ Build de imagen + Escaneo de contenedor
```

Si todo pasa: PR se puede mergear.
Si algo falla: PR se bloquea con el reporte del fallo.
