# Plantilla: Domain Events

> Fase: Inception > Track B — Bootstrapping Tecnico > DDD
> Artefacto: `docs/inception/domain-events.md`

---

# Catalogo de Eventos de Dominio: {Nombre del Proyecto}

## Eventos por Bounded Context

### {Nombre del Bounded Context}

| Evento | Disparador (comando) | Agregado origen | Datos del evento | Consumidores |
|--------|---------------------|-----------------|-----------------|-------------|
| {NombreEvento} | {que comando lo causa} | {Agregado} | {campos clave del evento} | {BCs que reaccionan} |

Ejemplo:
| OrderPlaced | PlaceOrderCommand | Order | orderId, customerId, total, items[] | Inventory, Billing, Notification |

---

## Flujos de procesos (Sagas / Workflows)

### {Nombre del proceso}

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ {Evento1} │───▶│ {Evento2} │───▶│ {Evento3} │───▶│ {Evento4} │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │
     ▼               ▼               ▼               ▼
 {BC origen}     {BC destino}   {BC destino}    {BC destino}
```

### Estados del workflow

| Paso | Evento de entrada | Accion | Evento de salida | Rollback (evento compensatorio) |
|------|------------------|--------|-----------------|--------------------------------|
| 1 | (comando inicial) | {que ocurre} | {evento} | {evento compensatorio} |
| 2 | {evento paso 1} | {que ocurre} | {evento} | {evento compensatorio} |

---

## Mapa de integracion (cross-context)

| Evento | Publicador (BC) | Suscriptor (BC) | Tipo de suscripcion | Procesamiento |
|--------|----------------|-----------------|--------------------|---------------|
| {evento} | {BC origen} | {BC destino} | Eventual / Transaccional | At-least-once / Exactly-once |
