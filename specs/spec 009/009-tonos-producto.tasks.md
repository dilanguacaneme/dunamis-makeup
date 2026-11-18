# Tareas de Implementación 009: Tonos de Producto

- [x] **Fase 1: Entidad y Migración Backend**
  - [x] Agregar campo `tono` (`String`, `nullable = false`, default `"NO_APLICA"`) a `Producto.java`
  - [x] Actualizar `ensureDefaults()` en `Producto.java` para blindar `null` en registros históricos
  - [x] Ejecutar migración y backfill automático en base de datos al arrancar (Spec 009 - RF-010)

- [x] **Fase 2: DTOs y Validación Backend**
  - [x] Agregar campo `tono` con `@Pattern` a `CrearProductoRequest`
  - [x] Agregar campo `tono` con `@Pattern` a `ActualizarProductoRequest`
  - [x] Agregar campo `tono: String` a `ProductoResponse`

- [x] **Fase 3: Servicio, Controlador y Pruebas Backend**
  - [x] Actualizar `ProductoService.crearProducto()` para mapear `tono` con default `"NO_APLICA"`
  - [x] Actualizar `ProductoService.actualizarProducto()` para actualizar `tono` solo si viene en el request (semántica PATCH)
  - [x] Escribir tests unitarios de `ProductoService` para los casos: tono válido, tono ausente (default), tono inválido (`400`)
  - [x] Escribir tests de integración de `ProductoController`: `POST` con y sin tono, `PATCH` con y sin tono, `VENDEDOR` → `403`

- [x] **Fase 4: Tipos, API y DemoStore Frontend**
  - [x] Agregar campo `tono?: string` a `Producto` en `types/index.ts`
  - [x] Agregar campo `tono?: string` a `ProductoInput` en `types/index.ts`
  - [x] Incluir campo `tono` en los payloads de creación y actualización en `api.ts`
  - [x] Inicializar `tono` con valores representativos en los productos de ejemplo de `demoStore.ts`

- [x] **Fase 5: Interfaz de Usuario Frontend**
  - [x] Agregar selector `<select>` de tono en `ProductModal.tsx` (11 opciones: No aplica + Tono 1 al 10)
  - [x] Preseleccionar valor actual del `tono` al abrir el modal en modo edición
  - [x] Mostrar badge `Tono {n}` condicionalmente en `ProductGrid.tsx` (ocultar si `NO_APLICA`)
  - [x] Mostrar badge `Tono {n}` condicionalmente en `ProductTable.tsx` (ocultar si `NO_APLICA`)
  - [x] Mostrar `"{nombre} (Tono {n})"` en el detalle de factura / POS si `tono !== "NO_APLICA"`

- [x] **Fase 6: Verificación Final**
  - [x] Ejecutar `npm --prefix frontend run lint` sin errores ni advertencias
  - [x] Ejecutar `npm --prefix frontend run build` sin errores de TypeScript
  - [x] Ejecutar `.\mvnw.cmd test-compile` limpiamente
  - [x] Ejecutar `.\mvnw.cmd test` con todos los tests en verde
