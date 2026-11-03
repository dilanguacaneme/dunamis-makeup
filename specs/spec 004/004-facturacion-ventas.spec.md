# Especificación 004: Facturación, Ventas, Pagos/Abonos y Descuento Atómico de Stock

## 1. Propósito y Contexto
- **QUÉ:** Regularizar y blindar el módulo comercial transaccional de Dunamis Makeup: migración integral a contratos DTO tipados e inmutables, transacciones ACID con `@Transactional` para venta y anulación, validación atómica de existencias no negativas, trazabilidad horaria mediante migración de fecha a `LocalDateTime`, soporte completo para el modelo financiero de pagos y abonos diferidos (`EstadoPagoFactura`: `PAGADA`, `ABONO_PARCIAL`, `PENDIENTE`; entidad `AbonoFactura` y enum `MedioPago`), flujo de anulación de facturas con restitución atómica de existencias al inventario, segregación estricta de acceso por roles RBAC (`ADMIN` vs `VENDEDOR`), y sincronización bidireccional con el modo demostración (`demoStore`) y el visor/generador de comprobantes PDF.
- **POR QUÉ:** La facturación representa el cierre de la operación comercial y el punto donde el inventario se traduce en ingresos. Actualmente, `FacturaController` expone entidades JPA directamente, retorna textos planos ante excepciones, carece de soporte backend para registrar pagos parciales/abonos (pese a que el frontend ya dispone de interfaces para ello), registra únicamente `LocalDate` sin componente horario (impidiendo auditorías intra-día), no permite cancelar ventas por error ni devolver el stock al almacén, y carece de pruebas automatizadas transaccionales de concurrencia y reversión. Esta especificación formaliza los requisitos bajo el ciclo SDD y la Constitución de Dunamis Makeup.

---

## 2. Requisitos Funcionales (Sintaxis EARS)

### Contratos de Datos y DTOs Tipados
- **RF-001 (Ubiquitous):** La API de facturación deberá comunicarse exclusivamente mediante DTOs inmutables tipados, eliminando por completo la recepción o exposición directa de las entidades JPA `Factura`, `DetalleFactura` y `AbonoFactura`:
  - `CrearFacturaRequest`: `{ "cliente": String, "telefonoCliente": String?, "detalles": List<CrearDetalleFacturaRequest>, "estadoPago": EstadoPagoFactura?, "valorAbonado": Double?, "medioPagoInicial": MedioPago?, "notasPago": String? }`.
  - `CrearDetalleFacturaRequest`: `{ "productoId": Long, "cantidad": Integer }`.
  - `FacturaResponse`: `{ "id": Long, "cliente": String, "telefonoCliente": String?, "vendedorNombre": String?, "vendedorUsuario": String?, "fecha": LocalDateTime, "total": Double, "estadoPago": EstadoPagoFactura, "valorAbonado": Double, "saldoPendiente": Double, "anulada": Boolean, "fechaAnulacion": LocalDateTime?, "motivoAnulacion": String?, "detalles": List<DetalleFacturaResponse>, "abonos": List<AbonoResponse> }`.
  - `DetalleFacturaResponse`: `{ "id": Long, "productoId": Long, "productoNombre": String, "precioUnitario": Double, "cantidad": Integer, "subtotal": Double }`.
  - `RegistrarAbonoRequest`: `{ "monto": Double, "medioPago": MedioPago, "notas": String? }`.
  - `AbonoResponse`: `{ "id": Long, "facturaId": Long, "monto": Double, "fecha": LocalDateTime, "medioPago": MedioPago, "notas": String?, "usuarioRegistro": String }`.
  - `AnularFacturaRequest`: `{ "motivo": String? }`.
  - *Por qué:* Cumple estrictamente con el Principio 2 de la Constitución.

- **RF-002 (Ubiquitous):** El backend deberá utilizar los siguientes enumeradores tipados para la gestión financiera:
  - `EstadoPagoFactura`: `PAGADA`, `ABONO_PARCIAL`, `PENDIENTE` (con tolerancia para `SIN_REGISTRO` en deserialización o representación frontend retrocompatible).
  - `MedioPago`: `EFECTIVO`, `TRANSFERENCIA`, `NEQUI`, `DAVIPLATA`, `OTRO`.
  - *Por qué:* Homologa los estados de pago entre frontend, capa de persistencia y reportes tributarios.

---

### Creación de Factura y Descuento Atómico de Stock (`POST /factura/crear`)
- **RF-003 (Event-driven):** Cuando un usuario autenticado (`ADMIN` o `VENDEDOR`) envíe una solicitud `POST /factura/crear` con cabecera `X-XSRF-TOKEN` válida y cuerpo `CrearFacturaRequest`:
  1. Validará que `cliente` no esté en blanco y no supere 255 caracteres tras aplicar `trim()`.
  2. Si `telefonoCliente` está presente, aplicará `trim()` y validará longitud máxima de 30 caracteres.
  3. Validará que la lista `detalles` contenga al menos un elemento (`@NotEmpty`).
  4. Para cada detalle, validará que `productoId` sea no nulo y `cantidad` sea un entero estrictamente mayor que cero (`cantidad > 0`).
  5. Consolidará cantidades si existen líneas repetidas con el mismo `productoId` en la solicitud.
  6. En un contexto transaccional atómico (`@Transactional`):
     - Verificará que cada producto exista en la base de datos.
     - Verificará que cada producto se encuentre activo (`activo = true`).
     - Verificará que la cantidad solicitada no supere las existencias disponibles (`cantidad <= producto.getCantidad()`).
     - Descontará las existencias de cada producto (`producto.setCantidad(producto.getCantidad() - cantidad)`).
     - Actualizará el campo determinista `totalProducto` (`precio * cantidad`) de cada producto afectado.
     - Fijará el `precioUnitario` del detalle tomando el precio vigente del catálogo en ese instante y calculará `subtotal = precioUnitario * cantidad`.
     - Sumará los subtotales para determinar el `total` de la factura.
  7. Asignará `fecha = LocalDateTime.now()`, `anulada = false`, `vendedorUsuario` con el usuario de la sesión y `vendedorNombre` con su nombre completo.
  8. Resolverá la condición financiera de la venta:
     - Si `estadoPago == null` o `estadoPago == PAGADA`: fijará `estadoPago = PAGADA`, `valorAbonado = total`, `saldoPendiente = 0.0`. Registrará automáticamente un primer abono por el valor total si se indicó medio de pago (o por defecto `EFECTIVO`).
     - Si `estadoPago == PENDIENTE`: fijará `estadoPago = PENDIENTE`, `valorAbonado = 0.0`, `saldoPendiente = total`.
     - Si `estadoPago == ABONO_PARCIAL`: validará que `valorAbonado` sea mayor a cero y estrictamente menor al `total`. Fijará `saldoPendiente = total - valorAbonado` y registrará el abono inicial correspondiente en `abonos`.
  9. Persistirá la factura y sus detalles/abonos asociados en base de datos.
  10. Retornará estado HTTP `201 Created` y el DTO `FacturaResponse`.
  - *Por qué:* Garantiza integridad ACID, exactitud matemática y descuento instantáneo de inventario.

- **RF-004 (Unwanted behavior):** Si alguno de los productos especificados en `detalles` no existe en la base de datos, el sistema deberá realizar rollback total de la transacción y retornar estado HTTP `404 Not Found` con el JSON uniforme `{ "error": "NOT_FOUND", "message": "Producto no encontrado con id: <id>", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Erradica excepciones de base de datos y texto plano (Principio 11).

- **RF-005 (Unwanted behavior):** Si alguno de los productos en `detalles` se encuentra inactivo (`activo = false`), el sistema deberá abortar la transacción con rollback completo y responder con estado HTTP `400 Bad Request` y `{ "error": "BAD_REQUEST", "message": "El producto '<nombre>' (id: <id>) se encuentra inactivo y no puede ser facturado", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Garantiza consistencia con la Spec 003 impidiendo vender artículos dados de baja.

- **RF-006 (Unwanted behavior):** Si la cantidad solicitada de cualquiera de los productos excede las existencias actuales (`cantidad > producto.getCantidad()`), el sistema abortará inmediatamente la transacción con rollback total y responderá con estado HTTP `409 Conflict` (o `400 Bad Request`) estructurado: `{ "error": "CONFLICT", "message": "Stock insuficiente para el producto '<nombre>' (id: <id>). Existencias disponibles: <stock>, solicitadas: <cantidad>", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Salvaguarda el Principio 4 de la Constitución de que ninguna operación puede dejar stock negativo ni descontar existencias parciales.

- **RF-007 (Unwanted behavior):** Si en `CrearFacturaRequest` el `estadoPago` es `ABONO_PARCIAL` pero el `valorAbonado` es nulo, menor o igual a 0, o mayor/igual al total de la factura, el sistema rechazará la operación con HTTP `400 Bad Request` informando que el abono parcial debe ser un monto positivo menor al total de la venta.
  - *Por qué:* Previene estados financieros inconsistentes al emitir la factura.

---

### Consulta e Historial de Facturas (`GET /factura/obtener-facturas` y `GET /factura/obtener-factura-por-id/{id}`)
- **RF-008 (State-driven):** Cuando un usuario autenticado con rol `ADMIN` envíe una solicitud `GET /factura/obtener-facturas`, el sistema responderá con estado HTTP `200 OK` y la lista completa de DTOs `FacturaResponse` ordenadas descendentemente por fecha e identificador (`ORDER BY f.fecha DESC, f.id DESC`).
  - *Por qué:* Permite auditoría gerencial completa de todas las ventas del negocio.

- **RF-009 (State-driven):** Cuando un usuario autenticado con rol `VENDEDOR` envíe una solicitud `GET /factura/obtener-facturas`, el sistema responderá con estado HTTP `200 OK` retornando **únicamente las facturas emitidas por ese vendedor** (`vendedorUsuario = authentication.name`), excluyendo del listado las facturas de otros compañeros de trabajo o administradores.
  - *Por qué:* Aplica segregación de datos comercial y privacidad entre dependientes de mostrador.

- **RF-010 (State-driven):** Cuando un usuario autenticado (`ADMIN` o `VENDEDOR`) solicite `GET /factura/obtener-facturas` con parámetros de filtro opcionales (`?estadoPago=<ESTADO>&anuladas=<boolean>`):
  - Si se especifica `estadoPago`, filtrará exclusivamente las facturas que coincidan con dicho estado.
  - Si se especifica `anuladas=false` (o por defecto), incluirá facturas no anuladas; si `anuladas=true`, incluirá tanto activas como anuladas (o solo anuladas según el selector).
  - Responderá con HTTP `200 OK` y la lista de DTOs `FacturaResponse` correspondientes.
  - *Por qué:* Facilita arqueos de caja rápidos, seguimiento de saldos pendientes y revisión de cancelaciones.

- **RF-011 (State-driven):** Cuando un usuario autenticado envíe `GET /factura/obtener-factura-por-id/{id}`:
  1. Si el usuario es `ADMIN`, podrá visualizar el detalle completo de cualquier factura existente por su ID, respondiendo con HTTP `200 OK` y el DTO `FacturaResponse` con su lista de detalles y abonos.
  2. Si el usuario es `VENDEDOR`, podrá visualizar la factura únicamente si `vendedorUsuario` coincide con su usuario autenticado.
  - *Por qué:* Garantiza la inspección de comprobantes sin fuga de datos entre vendedores.

- **RF-012 (Unwanted behavior):** Si se solicita `GET /factura/obtener-factura-por-id/{id}` con un identificador inexistente, el sistema responderá con estado HTTP `404 Not Found` y el JSON uniforme `{ "error": "NOT_FOUND", "message": "Factura no encontrada con id: <id>", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Elimina respuestas en texto plano y uniforma códigos de error.

- **RF-013 (Unwanted behavior):** Si un usuario con rol `VENDEDOR` intenta consultar `GET /factura/obtener-factura-por-id/{id}` de una factura que pertenece a otro vendedor o a un administrador, el sistema responderá con estado HTTP `403 Forbidden` (o `404 Not Found` defensivo) estructurado en JSON.
  - *Por qué:* Previene ataques de referencia directa insegura a objetos (IDOR).

---

### Registro y Auditoría de Abonos (`POST /factura/{id}/abonos` y `GET /factura/{id}/abonos`)
- **RF-014 (Event-driven):** Cuando un usuario autenticado (`ADMIN` o `VENDEDOR` sobre su propia factura) envíe una solicitud `POST /factura/{id}/abonos` con cabecera `X-XSRF-TOKEN` válida y cuerpo `RegistrarAbonoRequest`:
  1. Verificará la existencia y pertenencia de la factura (respetando RBAC).
  2. Si la factura se encuentra `anulada == true`, rechazará la operación con HTTP `409 Conflict` estructurado: `"No es posible registrar abonos en una factura anulada"`.
  3. Si la factura ya se encuentra `estadoPago == PAGADA` (`saldoPendiente == 0.0`), rechazará la operación con HTTP `400 Bad Request`: `"La factura ya se encuentra totalmente pagada"`.
  4. Validará que `monto` sea estrictamente mayor a 0.0.
  5. Validará que `monto` no supere el `saldoPendiente` actual (`monto <= saldoPendiente`).
  6. En un contexto transaccional (`@Transactional`):
     - Creará y persistirá un nuevo registro de `AbonoFactura` asociando la fecha/hora actual (`LocalDateTime.now()`), medio de pago, notas opcionales y el usuario que registra.
     - Incrementará `valorAbonado = valorAbonado + monto`.
     - Decrementará `saldoPendiente = saldoPendiente - monto`.
     - Si tras el registro `saldoPendiente == 0.0` (o con tolerancia a micro-redondeo `< 0.01`), transicionará automáticamente el estado de la factura a `estadoPago = PAGADA`.
     - Si aún queda saldo positivo (`saldoPendiente > 0.0`), mantendrá el estado `estadoPago = ABONO_PARCIAL`.
     - Persistirá los cambios en la factura.
  7. Retornará estado HTTP `201 Created` junto con el DTO `AbonoResponse`.
  - *Por qué:* Permite el recaudo gradual de cuentas por cobrar asegurando que nunca se cobre más de lo adeudado.

- **RF-015 (Unwanted behavior):** Si el monto del abono en `POST /factura/{id}/abonos` es mayor que el saldo pendiente de la factura (`monto > factura.getSaldoPendiente()`), el sistema rechazará la solicitud con estado HTTP `400 Bad Request` y `{ "error": "BAD_REQUEST", "message": "El monto del abono ($<monto>) supera el saldo pendiente de la factura ($<saldoPendiente>)", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Evita sobrepagos y descuadres de caja.

- **RF-016 (State-driven):** Cuando un usuario autenticado consulte `GET /factura/{id}/abonos`, el sistema responderá con estado HTTP `200 OK` y la lista cronológica de DTOs `AbonoResponse` ordenados por fecha ascendente (`ORDER BY a.fecha ASC`).
  - *Por qué:* Brinda auditoría clara de los pagos parciales realizados por el cliente.

---

### Anulación de Facturas y Restitución Atómica de Stock (`POST /factura/{id}/anular`)
- **RF-017 (Event-driven):** Cuando un usuario autenticado exclusivamente con rol `ADMIN` envíe una solicitud `POST /factura/{id}/anular` (o `PATCH`) con cabecera `X-XSRF-TOKEN` y cuerpo opcional `AnularFacturaRequest`:
  1. Verificará que la factura exista en la base de datos (404 si no existe).
  2. Verificará que la factura no se encuentre previamente anulada.
  3. En un contexto transaccional atómico (`@Transactional`):
     - Para cada línea en `detalles`:
       - Consultará el producto asociado (`Producto`).
       - Restituirá las existencias incrementando la cantidad: `producto.setCantidad(producto.getCantidad() + detalle.getCantidad())`.
       - Recalculará deterministamente el campo `totalProducto = producto.getPrecio() * producto.getCantidad()`.
       - Persistirá la actualización del producto (independientemente de si el producto está activo o inactivo; no reactiva productos inactivos, solo reintegra su inventario).
     - Marcará en la factura `anulada = true`, `fechaAnulacion = LocalDateTime.now()` y guardará el `motivoAnulacion` (si fue provisto).
     - Persistirá la factura actualizada.
  4. Responderá con estado HTTP `200 OK` y el DTO `FacturaResponse` actualizado reflejando `anulada: true`.
  - *Por qué:* Permite corregir errores de facturación devolviendo los cosméticos al stock disponible de forma 100% íntegra y segura.

- **RF-018 (Unwanted behavior):** Si un usuario con rol `VENDEDOR` intenta anular una factura (`POST /factura/{id}/anular`), el sistema deberá interceptar la solicitud con HTTP `403 Forbidden` y el error JSON estándar `{ "error": "FORBIDDEN", "message": "Acceso denegado: solo los administradores pueden anular facturas", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Protege la tesorería y el inventario contra cancelaciones no autorizadas por parte del personal de mostrador.

- **RF-019 (Unwanted behavior):** Si se solicita la anulación de una factura que ya fue anulada previamente (`anulada == true`), el sistema rechazará la operación con estado HTTP `409 Conflict` y `{ "error": "CONFLICT", "message": "La factura con id <id> ya se encuentra anulada", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Evita doble restitución de existencias al almacén.

---

### Trazabilidad Temporal y Retrocompatibilidad Brownfield
- **RF-020 (Ubiquitous):** El campo `fecha` de la entidad `Factura` se migrará de `LocalDate` a `LocalDateTime`. Para registros preexistentes en la base de datos PostgreSQL donde la fecha fue almacenada como `DATE`:
  - El sistema deberá interpretar y mapear la fecha histórica asignándole la hora de inicio de día `00:00:00` sin corromper los registros históricos.
  - Para facturas históricas donde `estadoPago` sea `NULL`, el sistema las tratará por defecto como `PAGADA` con `valorAbonado = total` y `saldoPendiente = 0.0` para no desvirtuar el historial contable anterior.
  - En todas las serializaciones JSON, la fecha se emitirá en formato estándar ISO-8601 (`YYYY-MM-DDTHH:mm:ss`).
  - *Por qué:* Cumple con el Principio 12 de Compatibilidad Brownfield de la Constitución.

---

### Integración con Frontend y Modo Demostración (`demoStore`)
- **RF-021 (Ubiquitous):** El frontend (`QuickSaleModal.tsx`, `InvoiceHistoryView.tsx`, `InvoiceDetailModal.tsx`, `pdfGenerator.ts`, `api.ts`, `demoData.ts`):
  1. Consumirá y enviará los DTOs definidos (`CrearFacturaRequest`, `FacturaResponse`, `RegistrarAbonoRequest`).
  2. Mostrará con claridad los badges de estado de pago:
     - `PAGADA` (Verde / Sage): Saldo $0.
     - `ABONO_PARCIAL` (Amarillo / Ámbar): Con saldo pendiente y botón habilitado para registrar nuevo abono.
     - `PENDIENTE` (Rojo / Crimson): Sin pagos y con saldo total adeudado.
     - Indicador tachado o badge "ANULADA" (Gris / Pizarra) para facturas canceladas.
  3. En `InvoiceDetailModal.tsx`, habilitará el formulario de abonos tanto en modo conectado (consumiendo `POST /factura/{id}/abonos`) como en modo demostración.
  4. En `InvoiceDetailModal.tsx`, habilitará la acción "Anular Factura" exclusivamente para usuarias con rol `ADMIN`.
  5. En `pdfGenerator.ts`, el PDF generado reflejará fielmente el estado financiero: total facturado, valor abonado, saldo pendiente actual y sello de "ANULADA" en caso de cancelación.
  6. En `demoData.ts` (`demoStore`), emulará con exactitud las reglas de negocio de stock, abonos, validación de sobrepago y restitución de existencias al anular.
  - *Por qué:* Unifica la experiencia de usuario y garantiza que la funcionalidad opere idénticamente con o sin conexión a PostgreSQL.

---

## 3. Matriz de Permisos (RBAC)

| Endpoint | Método | Rol ADMIN | Rol VENDEDOR | No Autenticado |
|---|---|---|---|---|
| `/factura/crear` | `POST` | Permitido (201) | Permitido (201) | Rechazado (401) |
| `/factura/obtener-facturas` | `GET` | Permitido (200 - Todas) | Permitido (200 - Propias) | Rechazado (401) |
| `/factura/obtener-factura-por-id/{id}` | `GET` | Permitido (200 - Cualquiera) | Permitido (200 - Solo propias) | Rechazado (401) |
| `/factura/{id}/abonos` | `POST` | Permitido (201) | Permitido (201 - Propias) | Rechazado (401) |
| `/factura/{id}/abonos` | `GET` | Permitido (200) | Permitido (200 - Propias) | Rechazado (401) |
| `/factura/{id}/anular` | `POST` | Permitido (200) | Denegado (403) | Rechazado (401) |

---

## 4. Casos Límite y Manejo de Errores (Edge Cases & Resilience)

| Caso Límite / Escenario | Comportamiento Esperado | Código HTTP |
|---|---|---|
| Venta con múltiples líneas del mismo producto | Sumar cantidades totales antes de validar stock para evitar descontar dos veces o sobrepasar existencias | 201 OK o 409 Conflict |
| Stock en cero o insuficiente para 1 de 10 productos | Rollback total atómico; ningún producto sufre descuento de inventario ni se crea la factura | 409 Conflict |
| Factura con producto inactivo (`activo = false`) | Rechazo inmediato; no se permite facturar referencias descontinuadas | 400 Bad Request |
| Intento de abono mayor al saldo restante (`monto > saldoPendiente`) | Rechazo con mensaje explícito indicando saldo disponible; saldo y estado inalterados | 400 Bad Request |
| Abono que liquida exactamente el saldo restante | `saldoPendiente` pasa a 0.0 y `estadoPago` cambia automáticamente a `PAGADA` | 201 Created |
| Intento de registrar abono en factura ya `PAGADA` | Rechazo informando que la cuenta ya fue saldada | 400 Bad Request |
| Intento de registrar abono en factura anulada | Rechazo con código de conflicto | 409 Conflict |
| Intento de anular una factura ya anulada | Rechazo con código de conflicto; no se restituye stock por segunda vez | 409 Conflict |
| Vendedor intentando ver o abonar factura de otro vendedor | Rechazo de autorización; acceso prohibido | 403 Forbidden |
| Facturas históricas sin estado de pago en BD | Mapeo retrospectivo a `PAGADA`, `saldoPendiente: 0.0`, fecha convertida a `LocalDateTime` | 200 OK |

---

## 5. Criterios de Aceptación (Definition of Done)
1. **Contratos DTO y Cero Exposición JPA:** Ningún controlador o servicio expone las entidades JPA `Factura`, `DetalleFactura` o `AbonoFactura`.
2. **Cero Texto Plano:** Todas las excepciones de negocio y de validación devuelven el esquema JSON estándar `ErrorResponse` (`error`, `message`, `timestamp`).
3. **Atomicidad Transaccional:** La creación de facturas y la anulación garantizan rollback total si ocurre cualquier error, sin stock negativo en ningún escenario.
4. **Modelo de Pagos y Abonos Funcional:** La entidad `AbonoFactura` y el enum `EstadoPagoFactura` operan con cálculo determinista de `valorAbonado` y `saldoPendiente`, transicionando a `PAGADA` al saldar la deuda.
5. **Flujo de Anulación con Restitución de Existencias:** Las administradoras pueden anular facturas devolviendo el stock exacto al inventario sin descontinuar productos.
6. **Segregación RBAC:** Vendedores ven y operan exclusivamente sus facturas; anulación restringida a `ADMIN`.
7. **Suite de Pruebas Automatizadas:** Tests unitarios de servicio y tests de integración con `MockMvc` cubriendo el 100% de los requisitos funcionales (RF-001 a RF-021).
8. **Frontend y Demo Store:** `QuickSaleModal`, `InvoiceDetailModal`, `InvoiceHistoryView` y `demoStore` integran los endpoints, abonos y anulación sin advertencias de linter ni errores de compilación (`npm run lint`, `npm run build`, `mvnw test-compile`).

---

## 6. Fuera de Alcance (Out of Scope)
- Emisión formal de Facturación Electrónica DIAN (XML firmado y CUFE); esta versión cubre la gestión interna POS y comprobantes de mostrador en PDF.
- Pasarelas de pago automatizadas en línea (Webhooks de Wompi, PayU, MercadoPago); los medios de pago soportados se registran de forma operativa en punto de venta.
- Gestión de notas crédito tributarias formales; la reversión interna se gestiona a través del flujo de anulación con reposición de inventario.
