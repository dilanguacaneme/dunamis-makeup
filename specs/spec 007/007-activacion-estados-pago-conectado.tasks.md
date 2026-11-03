# Tareas de Implementación Técnica — Spec 007: Habilitación de Estados de Pago y Abonos Iniciales en Modo Conectado

Este documento desglosa los requisitos de la [especificación](007-activacion-estados-pago-conectado.spec.md) y el [plan técnico](007-activacion-estados-pago-conectado.plan.md) en tareas atómicas y verificables.

---

- [x] **Tarea 1: Resiliencia en Deserialización de `EstadoPagoFactura` en Backend**
  - **Estimación:** ~10 min
  - **Dependencias:** Ninguna.
  - **Requisitos cubiertos:** RF-005, RF-010.
  - **Descripción:**
    1. En `EstadoPagoFactura.java`, incorporar soporte flexible para deserialización JSON (`@JsonCreator` de Jackson) que acepte tanto `"ABONO_PARCIAL"` como `"PARCIAL"`.
    2. Ejecutar `.\mvnw.cmd test` para confirmar que las pruebas del backend siguen pasando al 100%.
  - **Hecho cuando:** La API acepte requests con `"estadoPago": "PARCIAL"` o `"estadoPago": "ABONO_PARCIAL"` sin fallas de binding.

---

- [x] **Tarea 2: Desbloqueo del Selector de Pago y Payload en `QuickSaleModal.tsx`**
  - **Estimación:** ~15 min
  - **Dependencias:** Tarea 1.
  - **Requisitos cubiertos:** RF-001, RF-002, RF-003, RF-004, RF-006, RF-007.
  - **Descripción:**
    1. En `QuickSaleModal.tsx`:
       - Retirar la alerta estática obsoleta que sustituía el selector en modo conectado (`!isDemo`).
       - Renderizar el bloque de selección de estados de pago (`PAGADA`, `PARCIAL`, `PENDIENTE`) de forma incondicional.
       - Aplicar la validación de montos para abono parcial universalmente (eliminando `if (isDemo && ...)`).
       - Enviar siempre `estadoPago`, `valorAbonado`, `medioPagoInicial: 'EFECTIVO'` en `facturaPayload` hacia `onSaleSuccess`.
    2. En `services/api.ts`:
       - Asegurar que `createFactura` mapee `'PARCIAL'` hacia `'ABONO_PARCIAL'` al componer el body JSON.
  - **Hecho cuando:** El selector de pagos sea completamente interactivo en modo conectado y las facturas se emitan con su estado financiero hacia Spring Boot.

---

- [x] **Tarea 3: Saneamiento de Mensajes Informativos en `MonthlySalesView.tsx`**
  - **Estimación:** ~5 min
  - **Dependencias:** Tarea 2.
  - **Requisitos cubiertos:** RF-008.
  - **Descripción:**
    1. En `MonthlySalesView.tsx`, actualizar el aviso de modo conectado para clarificar que las ventas, abonos y saldos pendientes se registran y procesan de forma persistente en PostgreSQL a través de Spring Boot.
  - **Hecho cuando:** No queden avisos contradictorios indicando que los abonos solo funcionan en modo demo.

---

- [x] **Tarea 4: Verificación Integral de Calidad y Pruebas (Frontend & Backend)**
  - **Estimación:** ~10 min
  - **Dependencias:** Tareas 1 a 3.
  - **Requisitos cubiertos:** RF-009, RF-010.
  - **Descripción:**
    1. Ejecutar linter del frontend: `npm --prefix frontend run lint`.
    2. Ejecutar typecheck y build del frontend: `npm --prefix frontend run build`.
    3. Ejecutar tests del frontend: `npm --prefix frontend run test`.
    4. Ejecutar tests completos del backend: `.\mvnw.cmd test`.
  - **Hecho cuando:** Todos los chequeos pasen con 0 errores y 0 advertencias.
