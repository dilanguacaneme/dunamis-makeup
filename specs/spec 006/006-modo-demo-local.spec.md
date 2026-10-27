# Especificación 006: Modo Demostración Local (Offline) y Paridad de Reglas de Negocio

## 1. Propósito y Contexto
- **QUÉ:** Consolidar, blindar y asegurar la paridad funcional del **Modo Demostración Local (Offline)** de Dunamis Makeup (`demoStore` y servicios asociados en el frontend):
  1. Garantizar la persistencia integral y resiliencia en recargas de página (`F5`) de todas las operaciones realizadas en modo demo (marcas, productos, facturas, abonos y rol activo) mediante `localStorage`.
  2. Alinear estrictamente las reglas de negocio, validaciones y contratos de datos del modo demo con las especificaciones del backend (Specs 001 a 005 y Constitución del proyecto).
  3. Soporte fidedigno del modelo de facturación transaccional: abonos parciales, transiciones de estado de pago (`PENDIENTE`, `PARCIAL`, `PAGADA`), anulación con restitución atómica de inventario y segregación de visibilidad según el rol activo (`ADMIN` vs `VENDEDOR`).
  4. Garantizar un mecanismo seguro y confiable de restablecimiento (`resetToDefaults`) que permita retornar el catálogo demo a su estado inicial en cualquier momento.
  5. Dotar a `demoStore` de una suite de pruebas automatizadas que certifique la integridad de sus operaciones y persistencia.
- **POR QUÉ:** El modo demostración es una funcionalidad central para Dunamis Makeup, permitiendo a las dueñas y usuarias explorar la aplicación en cualquier entorno sin necesidad de conectividad con la base de datos PostgreSQL ni el servidor Spring Boot. Sin embargo, existían inconsistencias menores en la persistencia del usuario/rol seleccionado tras recargas, desalineaciones sutiles en la nomenclatura de estados de pago frente a los DTOs del backend (`ABONO_PARCIAL` vs `PARCIAL`), y ausencia de pruebas automatizadas sobre el motor en memoria (`demoStore`). Esta especificación cierra el Nivel 6 del checklist SDD.

---

## 2. Requisitos Funcionales (Sintaxis EARS)

### Persistencia y Gestión de Estado Demo
- **RF-001 (Ubiquitous):** El almacén local `demoStore` deberá persistir de manera atómica e inmediata en `localStorage` cualquier modificación sobre marcas (`dunamis_demo_brands_v3`), productos (`dunamis_demo_inventory_v3`), facturas (`dunamis_demo_invoices_v3`) y el usuario/rol activo de demostración (`dunamis_demo_user`).
  - *Por qué:* Evita la pérdida de cambios cuando la usuaria recarga el navegador o navega entre pestañas.

- **RF-002 (Event-driven):** Cuando la usuaria alterne el rol de demostración (`ADMIN` ↔ `VENDEDOR`), el sistema actualizará la sesión demo en memoria y guardará la selección en `localStorage`, garantizando que al presionar `F5` se mantenga el rol previamente seleccionado.
  - *Por qué:* Facilita las pruebas de auditoría y visualización de permisos RBAC sin fricción.

- **RF-003 (Event-driven):** Cuando la usuaria invoque la acción de restablecimiento (`demoStore.resetToDefaults()`), el sistema limpiará las claves de datos en `localStorage`, restaurará las colecciones de marcas, productos y facturas a los valores semilla originales, y restablecerá el rol a la Administradora predeterminada (`DEMO_ADMIN_USER`).
  - *Por qué:* Permite volver a un estado limpio y predecible para nuevas demostraciones comerciales.

---

### Catálogo y Gestión de Marcas en Modo Demo (Paridad con Spec 002)
- **RF-004 (Ubiquitous):** `demoStore` deberá normalizar los nombres de marca colapsando espacios múltiples consecutivos y eliminando espacios iniciales y finales antes de validar unicidad. La comprobación de unicidad será insensible a mayúsculas y minúsculas (ej. `"  Trendy   Cosmetics  "` colapsa a `"Trendy Cosmetics"`).
  - *Por qué:* Replica con exactitud el comportamiento del servicio Java `MarcaService`.

- **RF-005 (Ubiquitous):** `demoStore.getBrands(incluirInactivas)` deberá filtrar marcas inactivas (`activa === false`) cuando `incluirInactivas` sea falso, y retornar todas las marcas ordenadas alfabéticamente por nombre cuando sea verdadero.
  - *Por qué:* Garantiza coherencia con el endpoint `GET /marcas?incluirInactivas=...`.

- **RF-006 (Event-driven):** Si se intenta registrar un producto nuevo asociado a una marca inactiva o inexistente, `demoStore.createProduct` deberá rechazar la operación lanzando un error con mensaje descriptivo en español.
  - *Por qué:* Cumple con la regla de negocio RF-008 de la Spec 002.

---

### Catálogo e Inventario de Productos en Modo Demo (Paridad con Spec 003)
- **RF-007 (Ubiquitous):** El borrado de productos en `demoStore` (`deleteProduct(id)`) deberá operar exclusivamente mediante borrado lógico (`activo = false`) si el producto está referenciado en facturas existentes, prohibiendo la pérdida física de datos históricos (Principio 5 de la Constitución).
  - *Por qué:* Preserva la integridad referencial y auditoría de ventas históricas.

- **RF-008 (Ubiquitous):** `demoStore.getLowStockProducts(umbral)` deberá admitir un umbral numérico configurable mayor o igual a cero (por defecto `0`), retornando todos los productos activos con existencias menores o iguales a dicho umbral.
  - *Por qué:* Brinda paridad con el endpoint `GET /producto/acabarse?umbral=...` de la Spec 003.

- **RF-009 (Ubiquitous):** Las existencias (`cantidad`) de un producto en `demoStore` jamás podrán ser negativas en ninguna operación de creación, actualización o venta rápida.
  - *Por qué:* Salvaguarda el Principio 4 de la Constitución.

---

### Facturación, Abonos y Descuento de Stock en Modo Demo (Paridad con Spec 004)
- **RF-010 (Event-driven):** Al invocar `createInvoice`, `demoStore` deberá validar existencias de cada ítem, descontar las unidades vendidas del inventario en memoria, registrar la fecha con componente horario y asignar el estado financiero inicial (`PENDIENTE`, `PARCIAL` o `PAGADA`).
  - *Por qué:* Emula la transacción atómica `@Transactional` del backend.

- **RF-011 (Ubiquitous):** La nomenclatura del estado de pago en `demoStore` y DTOs del frontend deberá unificarse estrictamente con el backend (`EstadoPagoFactura = 'PENDIENTE' | 'PARCIAL' | 'PAGADA'`), manteniendo retrocompatibilidad en lectura con facturas históricas que contengan `'ABONO_PARCIAL'`.
  - *Por qué:* Corrige la inconsistencia semántica detectada entre el frontend y el backend (Principio 2).

- **RF-012 (Event-driven):** Al registrar un abono mediante `updateInvoicePayment(id, additionalPayment, medioPago, notas)`:
  - Deberá validar que la factura no esté anulada (409 Conflict).
  - Deberá validar que la factura no esté totalmente pagada ni que el monto supere el saldo pendiente (400 Bad Request).
  - Registrará en el historial de la factura un objeto `AbonoFactura` con `monto`, `fecha`, `medioPago` (`EFECTIVO`, `TRANSFERENCIA`, `NEQUI`, `DAVIPLATA`, `TARJETA`) y `notas`.
  - Recalculará automáticamente `valorAbonado`, `saldoPendiente` y actualizará el estado a `PAGADA` si el saldo llega a 0.
  - *Por qué:* Paridad estricta con `FacturaService.registrarAbono`.

- **RF-013 (Event-driven):** Al anular una factura con `cancelInvoice(id, motivo)`:
  - Si la factura ya se encuentra anulada, deberá lanzar un error descriptivo.
  - Restituirá automáticamente al inventario las cantidades vendidas de cada producto.
  - Marcará `anulada = true`, registrando `fechaAnulacion` y `motivoAnulacion`.
  - *Por qué:* Emula `FacturaService.anularFactura` y garantiza balance de existencias.

- **RF-014 (Ubiquitous):** `demoStore.getInvoices` y `getInvoiceById` deberán aplicar segregación por rol:
  - Cuando el usuario activo sea `VENDEDOR`, solo se retornarán o permitirán consultar las facturas cuyo `vendedorUsuario` coincida con su nombre de usuario.
  - Cuando el usuario activo sea `ADMIN`, tendrá visibilidad completa de todas las facturas del sistema.
  - *Por qué:* Replica la segregación RBAC de `GET /factura/obtener-facturas` y `GET /factura/obtener-factura-por-id/{id}`.

---

### Pruebas Automatizadas y Calidad
- **RF-015 (Ubiquitous):** El frontend deberá contar con una suite de pruebas automatizadas verificable que valide exhaustivamente todos los métodos de `demoStore` (CRUD de productos, marcas con normalización, ciclo de vida de facturación, abonos, anulación y persistencia/reset en storage).
  - *Por qué:* Garantiza la verificabilidad continua bajo los Principios 6, 7 y 9 de la Constitución.

---

## 3. Casos Límite y Consideraciones de Error
1. **Recarga con rol VENDEDOR:** Si la usuaria cambia a rol Vendedora y recarga con F5, la app debe iniciar inmediatamente con el perfil de Vendedora y mostrar únicamente sus facturas.
2. **Abono mayor al saldo pendiente en Demo:** Debe arrojar error descriptivo indicando el valor máximo permitido.
3. **Anulación de factura ya anulada en Demo:** Debe arrojar error indicando que la factura ya fue anulada previamente sin duplicar la restitución de inventario.
4. **Venta con stock insuficiente en Demo:** Debe rechazar la factura indicando el stock disponible del producto infractor sin modificar las existencias de los demás productos de la lista.
5. **Normalización de nombre de marca con múltiples espacios:** `"  Trendy     Gold  "` debe guardarse como `"Trendy Gold"` y rechazar colisiones si ya existe `"trendy gold"`.
