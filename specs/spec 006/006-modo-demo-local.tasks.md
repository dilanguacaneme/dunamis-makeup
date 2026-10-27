# Tareas de Implementación Técnica — Spec 006: Modo Demostración Local (Offline) y Paridad de Reglas de Negocio

Este documento desglosa los requisitos de la [especificación](006-modo-demo-local.spec.md) y el [plan técnico](006-modo-demo-local.plan.md) en tareas atómicas y verificables.

---

- [ ] **Tarea 1: Estandarización de Tipos y Normalización en `demoStore`**
  - **Estimación:** ~15 min
  - **Dependencias:** Ninguna.
  - **Requisitos cubiertos:** RF-004, RF-005, RF-006, RF-011.
  - **Descripción:**
    1. Actualizar `types/index.ts` para homologar `EstadoPagoFactura = 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'ABONO_PARCIAL'` manteniendo retrocompatibilidad.
    2. En `demoData.ts`:
       - Normalizar nombres de marca colapsando espacios múltiples (`.trim().replace(/\s+/g, ' ')`) en creación y edición.
       - Asegurar que `createProduct` valide que la marca no solo exista, sino que esté activa (`activa !== false`).
       - Sincronizar el estado por defecto de abonos en `createInvoice` y `updateInvoicePayment` hacia `'PARCIAL'`.
  - **Hecho cuando:** Los tipos de pago coinciden con el backend, y las marcas no admiten colisiones por espacios múltiples ni marcas inactivas en productos nuevos.

---

- [ ] **Tarea 2: Consolidación de Facturación Atómica, Abonos y Anulación en `demoStore`**
  - **Estimación:** ~15 min
  - **Dependencias:** Tarea 1.
  - **Requisitos cubiertos:** RF-007, RF-008, RF-009, RF-010, RF-012, RF-013, RF-014.
  - **Descripción:**
    1. En `createInvoice`:
       - Emular atomicidad verificando stock de todos los ítems antes de decrementar existencias.
       - Asignar fecha con formato ISO o legible manteniendo coherencia horaria.
    2. En `updateInvoicePayment`:
       - Validar no sobrepago, rechazar si la factura está anulada o pagada, registrar el historial de `abonos` con `MedioPago` y transicionar a `'PAGADA'` cuando el saldo llegue a 0.
    3. En `cancelInvoice`:
       - Validar que la factura no esté previamente anulada.
       - Restituir inmediatamente las existencias al inventario de `products` y recalcular `totalProducto`.
    4. En `getInvoices` y `getInvoiceById`:
       - Aplicar segregación estricta cuando el rol sea `VENDEDOR`.
  - **Hecho cuando:** La facturación y anulación en modo demo emula fielmente las transacciones atómicas del backend, impidiendo sobrepagos y stock negativo.

---

- [ ] **Tarea 3: Persistencia de Sesión y Rol Demo en `App.tsx` y Resiliencia en Recarga**
  - **Estimación:** ~15 min
  - **Dependencias:** Tarea 2.
  - **Requisitos cubiertos:** RF-001, RF-002, RF-003.
  - **Descripción:**
    1. En `App.tsx`:
       - Al alternar el rol de demostración (`handleToggleDemoRole`), guardar el usuario activo en `localStorage.setItem('dunamis_demo_user', JSON.stringify(nextUser))`.
       - En `checkInitialSession`: restaurar el usuario y rol guardado si existe, en lugar de resetear siempre a la administradora.
       - En `handleEnterDemo`: establecer y persistir el usuario inicial.
       - En `handleResetDemoData`: limpiar `dunamis_demo_user` y retornar al estado base.
    2. En `demoStore.resetToDefaults()`:
       - Limpiar `localStorage` y restaurar los datos semilla iniciales de forma idempotente.
  - **Hecho cuando:** Al cambiar de rol a Vendedora y recargar la página con F5, la app permanece en rol Vendedora y muestra sus facturas correspondientes.

---

- [ ] **Tarea 4: Suite de Pruebas Automatizadas de `demoStore` y Cierre de Spec 006**
  - **Estimación:** ~15 min
  - **Dependencias:** Tareas 1, 2 y 3.
  - **Requisitos cubiertos:** RF-015 y Checklist SDD Nivel 6.
  - **Descripción:**
    1. Crear suite de pruebas automatizadas para `demoStore` (ej. en `frontend/src/services/demoStore.test.ts`) ejecutada mediante runner de Node/TypeScript validando:
       - CRUD de marcas y normalización de espacios.
       - Creación y borrado lógico de productos.
       - Facturación atómica y rechazo por stock insuficiente.
       - Registro de abonos y transición automática a PAGADA.
       - Anulación de factura con restitución de existencias.
       - Segregación de facturas por rol.
    2. Ejecutar `npm --prefix frontend run lint` y `npm --prefix frontend run build`.
    3. Ejecutar `.\mvnw.cmd test` para asegurar que el backend se mantenga en 100% verde.
    4. Actualizar `docs/checklist-sdd.md` marcando el **Nivel 6 — Módulo 006** como completado `[x]`.
  - **Hecho cuando:** Todas las pruebas pasan sin errores, el linter y build del frontend están limpios y el checklist SDD refleja el Nivel 6 completado.
