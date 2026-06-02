---
name: git-flow
description: Estrategia de branching Git Flow para microservicios .NET. Usar cuando se gestione el ciclo de ramas: feature/*, develop, release/*, hotfix/* y main. Cada feature se desarrolla en su propia rama.
---

# Git Flow para Microservicios .NET Core

## Ramas principales

```
main          # Produccion (solo mergea desde release/* y hotfix/*)
develop       # Integracion continua (mergea desde feature/* y release/*)
```

## Ramas de soporte

| Rama | Proposito | Nomenclatura | Se crea desde | Mergea a |
|------|-----------|-------------|---------------|----------|
| `feature/*` | Nueva funcionalidad | `feature/F001-crear-pedido` | `develop` | `develop` |
| `release/*` | Preparar release | `release/1.0.0` | `develop` | `main` + `develop` |
| `hotfix/*` | Correccion urgente | `hotfix/1.0.1-corregir-pago` | `main` | `main` + `develop` |

## Flujo de feature con arneses

Cuando `leader` invoca `features start F001`:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/F001-crear-pedido
```

El desarrollo se realiza en esta rama. Al completar la feature:

```bash
git checkout develop
git merge --no-ff feature/F001-crear-pedido
git push origin develop
git branch -d feature/F001-crear-pedido
```

## Convenciones de commit

```
feat: agregar creacion de pedidos con validacion de stock
fix: corregir calculo de total con descuentos
refactor: extraer OrderCalculator a servicio de dominio
test: agregar pruebas de integracion para OrderRepository
docs: actualizar architecture.md con ADR-003
```

## Reglas

- `main` nunca recibe commits directos
- `develop` nunca recibe commits directos (solo merges)
- Cada feature tiene su propia rama `feature/{id}-{slug}`
- Usar `--no-ff` al mergear features para preservar historial
- Eliminar la rama feature despues del merge exitoso
- Antes de mergear a `develop`, ejecutar `dotnet test` y `dotnet format --verify-no-changes`
