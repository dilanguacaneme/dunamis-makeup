# Tareas de Implementación 009: Tonos de Producto

- [ ] **Fase 1: Entidad y Migración Backend**
  - [x] Agregar campo `tono` (`String`, `nullable = false`, default `"NO_APLICA"`) a `Producto.java`
  - [x] Actualizar `ensureDefaults()` en `Producto.java` para blindar `null` en registros históricos
  - [ ] Ejecutar migración SQL (`ALTER TABLE` + `UPDATE`) en base de datos antes del primer despliegue

- [ ] **Fase 2: DTOs y Validación Backend**
  - [ ] Agregar campo `tono` con `@Pattern` a `CrearProductoRequest`
  - [ ] Agregar campo `tono` con `@Pattern` a `ActualizarProductoRequest`
  - [ ] Agregar campo `tono: String` a `ProductoResponse`

- [ ] **Fase 3: Servicio, Controlador y Pruebas Backend**
  - [ ] Actualizar `ProductoService.crearProducto()` para mapear `tono` con default `"NO_APLICA"`
  - [ ] Actualizar `ProductoService.actualizarProducto()` para actualizar `tono` solo si viene en el request (semántica PATCH)
  - [ ] Escribir tests unitarios de `ProductoService` para los casos: tono válido, tono ausente (default), tono inválido (`400`)
  - [ ] Escribir tests de integración de `ProductoController`: `POST` con y sin tono, `PATCH` con y sin tono, `VENDEDOR` → `403`

- [ ] **Fase 4: Tipos, API y DemoStore Frontend**
  - [ ] Agregar campo `tono?: string` a `Producto` en `types/index.ts`
  - [ ] Agregar campo `tono?: string` a `ProductoInput` en `types/index.ts`
  - [ ] Incluir campo `tono` en los payloads de creación y actualización en `api.ts`
  - [ ] Inicializar `tono` con valores representativos en los productos de ejemplo de `demoStore.ts`

- [ ] **Fase 5: Interfaz de Usuario Frontend**
  - [ ] Agregar selector `<select>` de tono en `ProductModal.tsx` (11 opciones: No aplica + Tono 1 al 10)
  - [ ] Preseleccionar valor actual del `tono` al abrir el modal en modo edición
  - [ ] Mostrar badge `Tono {n}` condicionalmente en `ProductGrid.tsx` (ocultar si `NO_APLICA`)
  - [ ] Mostrar badge `Tono {n}` condicionalmente en `ProductTable.tsx` (ocultar si `NO_APLICA`)
  - [ ] Mostrar `"{nombre} (Tono {n})"` en el detalle de factura / POS si `tono !== "NO_APLICA"`

- [ ] **Fase 6: Verificación Final**
  - [ ] Ejecutar `npm --prefix frontend run lint` sin errores ni advertencias
  - [ ] Ejecutar `npm --prefix frontend run build` sin errores de TypeScript
  - [ ] Ejecutar `.\mvnw.cmd test-compile` limpiamente
  - [ ] Ejecutar `.\mvnw.cmd test` con todos los tests en verde
