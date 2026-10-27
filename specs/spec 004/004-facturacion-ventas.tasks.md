# Tareas de Implementación — Spec 004: Facturación, Ventas, Abonos y Descuento Atómico de Stock

Documento de desglose de tareas ordenadas por dependencia técnica (<30 min por tarea), agrupadas en la **cantidad mínima necesaria** (5 tareas cohesivas) para agilizar el desarrollo sin comprometer la integridad constitucional de `docs/constitution.md` ni los requisitos de `specs/spec 004/004-facturacion-ventas.spec.md`.

---

## Cadena de Dependencias

```
[Tarea 1: DTOs Tipados, Enums Financieros y Modelo de Entidades (Factura, Detalle, Abono)]
       │
       ▼
[Tarea 2: Lógica de Servicio Transaccional: Emisión de Venta, Stock Atómico y Abonos]
       │
       ▼
[Tarea 3: Endpoints REST, Flujo de Anulación con Reposición de Stock y RBAC MockMvc]
       │
       ▼
[Tarea 4: Frontend UI, Visor de Detalle con Abonos, Anulación ADMIN, PDF y Modo Demo]
       │
       ▼
[Tarea 5: Verificación Integral E2E, Cobertura Transaccional y Cierre de Spec 004]
```

---

## Desglose de Tareas (<30 min)

- [x] **Tarea 1: DTOs Tipados, Enums Financieros y Modelo de Entidades (`Factura`, `DetalleFactura`, `AbonoFactura`)**
  - **Estimación:** ~20-25 min
  - **Dependencias:** Ninguna (Cimiento de contratos y persistencia).
  - **Requisitos cubiertos:** RF-001, RF-002, RF-007, RF-014, RF-020.
  - **Descripción:**
    1. *Rojo:* Crear `FacturaDtoTest` validando:
       - `CrearFacturaRequest` rechaza cliente en blanco, lista de detalles vacía o nula, o detalles con productoId nulo o cantidad `<= 0`.
       - `RegistrarAbonoRequest` rechaza monto `<= 0` o nulo, medio de pago nulo o notas de longitud excesiva (`> 255`).
       - `FacturaResponse` y `AbonoResponse` serializan todos los campos requeridos (`id`, `cliente`, `fecha` ISO-8601, `total`, `estadoPago`, `valorAbonado`, `saldoPendiente`, `anulada`, etc.).
    2. *Verde:*
       - Crear los enumeradores `EstadoPagoFactura` (`PAGADA`, `ABONO_PARCIAL`, `PENDIENTE`) y `MedioPago` (`EFECTIVO`, `TRANSFERENCIA`, `NEQUI`, `DAVIPLATA`, `TARJETA`, `OTRO`) en `com.dunamis.makeup.model` o `com.dunamis.makeup.Entity`.
       - Crear los records inmutables `CrearFacturaRequest`, `CrearDetalleFacturaRequest`, `FacturaResponse`, `DetalleFacturaResponse`, `RegistrarAbonoRequest`, `AbonoResponse` y `AnularFacturaRequest` en el paquete `com.dunamis.makeup.dto.factura`.
       - Actualizar la entidad `Factura.java`:
         - Migrar `fecha` a `LocalDateTime` (`@Column(nullable = false)` con valor por defecto `LocalDateTime.now()`).
         - Incorporar campos: `estadoPago`, `valorAbonado`, `saldoPendiente`, `anulada` (default `false`), `fechaAnulacion` y `motivoAnulacion`.
         - Relacionar lista `@OneToMany` de `AbonoFactura`.
       - Actualizar `DetalleFactura.java` para incorporar el campo inmutable `precioUnitario` (snapshot histórico).
       - Crear la nueva entidad `AbonoFactura.java` y su repositorio `AbonoFacturaRepository.java`.
       - Agregar métodos de consulta en `FacturaRepository` para filtrado por estado de pago y anulación.
  - **Hecho cuando:** `.\mvnw.cmd test -Dtest=FacturaDtoTest` pasa al 100% en verde y `.\mvnw.cmd test-compile` compila limpiamente sin errores.

---

- [x] **Tarea 2: Lógica de Servicio Transaccional: Emisión de Venta, Stock Atómico y Abonos**
  - **Estimación:** ~25-30 min
  - **Dependencias:** Tarea 1.
  - **Requisitos cubiertos:** RF-003, RF-004, RF-005, RF-006, RF-007, RF-014, RF-015, RF-016.
  - **Descripción:**
    1. *Rojo:* Crear `FacturaServiceTest` (Mockito) cubriendo:
       - Venta exitosa: sanitización de cliente, consolidación de cantidades repetidas, validación de productos activos, decremento atómico de stock, recálculo de `totalProducto`, snapshot de precio unitario y cálculo determinista del total.
       - Registro financiero inicial según `estadoPago`: `PAGADA` (abono total), `PENDIENTE` (abono 0), `ABONO_PARCIAL` (abono parcial válido).
       - Rechazo con rollback si algún producto no existe (404 `ProductoNoEncontradoException`).
       - Rechazo con rollback si algún producto está inactivo (`activo = false`, 400).
       - Rechazo con rollback ante stock insuficiente (409/400 `ProductoInsuficienteException`), garantizando que ningún producto quede descontado.
       - Registro de abono exitoso: decremento de `saldoPendiente`, incremento de `valorAbonado` y transición automática a `PAGADA` cuando `saldoPendiente == 0.0`.
       - Rechazo de abono si supera el saldo pendiente (no sobrepago, 400).
       - Rechazo de abono si la factura ya está totalmente pagada o anulada.
    2. *Verde:*
       - Refactorizar `FacturaService.java` para operar con DTOs inmutables bajo `@Transactional`.
       - Implementar método `crearFactura(CrearFacturaRequest request, String vendedorUsuario)`.
       - Implementar método `registrarAbono(Long facturaId, RegistrarAbonoRequest request, String usuarioRegistro, boolean esAdmin)`.
       - Implementar método `listarAbonosPorFactura(Long facturaId, String usuario, boolean esAdmin)`.
  - **Hecho cuando:** `.\mvnw.cmd test -Dtest=FacturaServiceTest` pasa al 100% con 0 fallos.

---

- [x] **Tarea 3: Endpoints REST, Flujo de Anulación con Reposición de Stock y RBAC MockMvc**
  - **Estimación:** ~25-30 min
  - **Dependencias:** Tareas 1 y 2.
  - **Requisitos cubiertos:** RF-008, RF-009, RF-010, RF-011, RF-012, RF-013, RF-017, RF-018, RF-019.
  - **Descripción:**
    1. *Rojo:* Crear `FacturaIntegrationTest` y `FacturaRbacSecurityTest` con `MockMvc` cubriendo:
       - `POST /factura/crear`: 201 Created con cookie de sesión y CSRF para ADMIN y VENDEDOR; verificación de persistencia y stock descontado.
       - `GET /factura/obtener-facturas`: 200 OK; ADMIN ve todas las facturas; VENDEDOR solo ve sus propias facturas (segregación RBAC).
       - `GET /factura/obtener-factura-por-id/{id}`: 200 OK con DTO completo o 404 estructurado `{ "error": "NOT_FOUND" }`; VENDEDOR recibe 403 Forbidden al consultar factura ajena.
       - `POST /factura/{id}/abonos`: 201 Created con nuevo abono registrado.
       - `GET /factura/{id}/abonos`: 200 OK con historial cronológico de pagos.
       - `POST /factura/{id}/anular`:
         - Como `ADMIN`: 200 OK, la factura se marca `anulada = true` y las existencias de los productos se restituyen automáticamente en base de datos.
         - Si ya está anulada: 409 Conflict impidiendo doble restitución.
         - Como `VENDEDOR`: 403 Forbidden interceptado por Spring Security.
       - Peticiones no autenticadas devuelven HTTP 401 Unauthorized estructurado.
    2. *Verde:*
       - Implementar en `FacturaService` el método `@Transactional public FacturaResponse anularFactura(Long id, AnularFacturaRequest request)`.
       - Refactorizar `FacturaController.java` adoptando los contratos DTO tipados, respuestas `ResponseEntity<FacturaResponse>` y eliminación de entidades JPA directas.
       - Configurar autorizaciones en `SecurityConfig.java` (`/factura/*/anular` restringido a `ROLE_ADMIN`).
       - Asegurar que `GlobalExceptionHandler` capture `ProductoInsuficienteException` y conflictos de anulación retornando `ErrorResponse` en JSON uniforme.
  - **Hecho cuando:** `.\mvnw.cmd test -Dtest=FacturaIntegrationTest,FacturaRbacSecurityTest` pasa al 100% en verde.

---

- [ ] **Tarea 4: Frontend UI, Visor de Detalle con Abonos, Anulación ADMIN, PDF y Modo Demostración**
  - **Estimación:** ~25-30 min
  - **Dependencias:** Tareas 1, 2 y 3.
  - **Requisitos cubiertos:** RF-010, RF-014, RF-016, RF-017, RF-021.
  - **Descripción:**
    1. Actualizar `frontend/src/types/index.ts`:
       - Verificar tipado estricto de `Factura`, `DetalleFactura`, `AbonoFactura`, `EstadoPagoFactura` y `MedioPago`.
       - Añadir campos `anulada?: boolean`, `fechaAnulacion?: string`, `motivoAnulacion?: string`.
    2. Actualizar `frontend/src/services/api.ts`:
       - Integrar endpoint real `addPayment(invoiceId, monto, medioPago, notas)` consumiendo `POST /factura/{id}/abonos` (reemplazando el mensaje de advertencia actual).
       - Agregar función `cancelInvoice(invoiceId, motivo)` consumiendo `POST /factura/{id}/anular`.
       - Propagar filtros opcionales de estado de pago y facturas anuladas.
    3. Integrar en componentes de UI:
       - `InvoiceDetailModal.tsx`:
         - Conectar el formulario de abonos al backend Spring Boot.
         - Incorporar botón y confirmación de "Anular Factura" visible únicamente para rol `ADMIN`.
         - Mostrar badge "ANULADA" y deshabilitar formulario de abonos si la factura ya está cancelada.
       - `InvoiceHistoryView.tsx`:
         - Estilos visuales diferenciados para facturas anuladas (tachado suave o badge gris pizarra).
       - `pdfGenerator.ts`:
         - Reflejar sello de "ANULADA" si corresponde, y desglose de abonos y saldo por pagar.
    4. Sincronizar `demoData.ts` y `demoStore`:
       - Replicar el registro de abonos y transición a `PAGADA`.
       - Replicar el flujo de anulación con restitución de existencias en el inventario local.
  - **Hecho cuando:** `npm --prefix frontend run lint` reporta 0 advertencias/0 errores, `npm --prefix frontend run build` compila con éxito, y la gestión de abonos/anulación funciona en la interfaz.

---

- [ ] **Tarea 5: Verificación Integral E2E, Cobertura Transaccional y Cierre de Spec 004**
  - **Estimación:** ~15-20 min
  - **Dependencias:** Tareas 1, 2, 3 y 4.
  - **Requisitos cubiertos:** RF-001 a RF-021 (Definition of Done completa).
  - **Descripción:**
    1. Ejecutar la suite completa de pruebas unitarias y de integración del backend (`.\mvnw.cmd test`).
    2. Ejecutar el linter y compilación de producción del frontend (`npm run lint` y `npm run build`).
    3. Verificar que una factura histórica (brownfield) cargue correctamente con fecha y estado `PAGADA` por defecto.
    4. Verificar que la anulación de factura devuelva existencias sin modificar el estado `activo` de un producto descontinuado.
    5. Actualizar [checklist-sdd.md](file:///C:/Users/Dilan/Documents/workSpace/JAVA/Dunamis%20Makeup/docs/checklist-sdd.md) marcando las tareas del Módulo 004 como completadas `[x]`.
  - **Hecho cuando:** Todas las suites de pruebas pasan al 100% con cero errores, cero advertencias y el árbol de git en `intregacion-sdd` está completamente limpio.
