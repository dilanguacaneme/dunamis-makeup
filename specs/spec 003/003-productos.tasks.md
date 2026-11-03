# Tareas de Implementación — Spec 003: Catálogo e Inventario de Productos

Documento de desglose de tareas ordenadas por dependencia técnica (<30 min por tarea), agrupadas en la **cantidad mínima necesaria** (5 tareas cohesivas) para agilizar el desarrollo sin comprometer la integridad constitucional de `docs/constitution.md` ni los requisitos de `specs/spec 003/003-productos.spec.md`.

---

## Cadena de Dependencias

```
[Tarea 1: DTOs Tipados, Modelo de Entidad ('activo') y Validaciones]
       │
       ▼
[Tarea 2: Lógica de Servicio, Integridad Referencial con Facturas y Stock]
       │
       ▼
[Tarea 3: Endpoints REST, Control de Acceso RBAC y Pruebas MockMvc]
       │
       ▼
[Tarea 4: Frontend UI, Filtro de Inactivos, Reactivación y Modo Demo]
       │
       ▼
[Tarea 5: Verificación Integral E2E, Cobertura y Cierre de Spec 003]
```

---

## Desglose de Tareas (<30 min)

- [x] **Tarea 1: DTOs Tipados, Modelo de Entidad (`activo`) y Validaciones de Entrada**
  - **Estimación:** ~20-25 min
  - **Dependencias:** Ninguna (Cimiento de contratos).
  - **Requisitos cubiertos:** RF-001, RF-002, RF-008, RF-010, RF-012, RF-013, RF-014.
  - **Descripción:**
    1. *Rojo:* Crear `ProductoDtoTest` validando:
       - `CrearProductoRequest` rechaza nombre en blanco, precios o cantidades negativas, y categoría o marca nulas.
       - `ActualizarProductoRequest` rechaza cuerpos vacíos (`{}`) y valores negativos en precio o existencias.
       - `ProductoResponse` serializa todos los campos requeridos (`id`, `nombre`, `precio`, `cantidad`, `cantidadInicial`, `totalProducto`, `categoria`, `marca`, `activo`).
    2. *Verde:*
       - Actualizar la entidad `Producto.java` para incorporar el atributo `@Column(nullable = false) private Boolean activo = true;` con tolerancia retrospectiva para registros históricos brownfield (`activo == null -> true`).
       - Crear los records inmutables `ProductoResponse`, `CrearProductoRequest` y `ActualizarProductoRequest` en el paquete `com.dunamis.makeup.dto.producto`.
       - Integrar en `GlobalExceptionHandler` el mapeo uniforme de validaciones de bean validation a `ErrorResponse` (`BAD_REQUEST`).
  - **Hecho cuando:** `.\mvnw.cmd test -Dtest=ProductoDtoTest` pasa al 100% en verde y `.\mvnw.cmd test-compile` compila limpiamente sin errores.

---

- [x] **Tarea 2: Lógica de Servicio, Integridad Referencial con Facturación y Valuación**
  - **Estimación:** ~25-30 min
  - **Dependencias:** Tarea 1.
  - **Requisitos cubiertos:** RF-002, RF-006, RF-008, RF-009, RF-012, RF-013, RF-015, RF-016, RF-017, RF-019.
  - **Descripción:**
    1. *Rojo:* Crear `ProductoServiceTest` (Mockito) cubriendo:
       - Creación de producto: sanitización de nombre (`trim()` y colapso de espacios), validación de marca existente y activa (400 si inactiva), asignación de `cantidadInicial` y cálculo determinista de `totalProducto`.
       - Actualización parcial de atributos y existencias recalculando `totalProducto`.
       - **Salvaguarda de borrado e integridad histórica (Principio 5):** Comprobar que si el producto posee facturas asociadas (`facturaRepository.existsByDetallesProductoId(id)`), no se realiza borrado físico sino **borrado lógico** (`activo = false`).
       - Consulta de stock bajo / agotados: filtrado por `umbral` considerando exclusivamente productos activos.
       - Valuación de inventario: retorno de `0.0` sin arrojar excepción ante catálogo vacío.
    2. *Verde:*
       - Agregar métodos en `ProductoRepository` (`findByActivoTrueOrderByNombreAsc`, `obtenerProductosPocoStock(Integer umbral)`, `totalInventario()`).
       - Agregar verificación en `FacturaRepository` para comprobar existencia de detalles de factura por producto.
       - Refactorizar `ProductoService` para operar con DTOs, borrado seguro y valuación determinista.
  - **Hecho cuando:** `.\mvnw.cmd test -Dtest=ProductoServiceTest` pasa al 100% con 0 fallos.

---

- [x] **Tarea 3: Endpoints REST, Control de Acceso RBAC y Pruebas MockMvc**
  - **Estimación:** ~25-30 min
  - **Dependencias:** Tarea 1, Tarea 2.
  - **Requisitos cubiertos:** RF-003, RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-011, RF-012, RF-013, RF-014, RF-016, RF-017, RF-018, RF-019.
  - **Descripción:**
    1. *Rojo:* Crear `ProductoIntegrationTest` y `ProductoRbacSecurityTest` con `MockMvc` cubriendo:
       - `GET /producto/obtener-productos`: retorno de productos activos con HTTP 200 (y `[]` si vacío, nunca 204).
       - `GET /producto/obtener-productos?incluirInactivos=true`: permitido para `ADMIN` (200), pero rechazado con `403 Forbidden` estructurado para `VENDEDOR`.
       - `GET /producto/obtener-productos-por-id/{id}`: 200 OK con DTO o 404 estructurado `{ "error": "NOT_FOUND" }` (cero texto plano).
       - `POST /producto/crear`: 201 Created con CSRF y `ADMIN`; 403 para `VENDEDOR`; 400 ante marca inactiva o validación fallida.
       - `PATCH /producto/actualizar/{id}`: 200 OK ante cambios válidos; 400 ante payload vacío o valores negativos; 403 para `VENDEDOR`.
       - `DELETE /producto/borrar-producto-por-id/{id}`: 200 OK con desactivación lógica si existen facturas; 403 para `VENDEDOR`.
       - `GET /producto/acabarse`: soporta `?umbral=X` excluyendo inactivos; 400 ante umbral negativo.
       - `GET /producto/total-inventario`: 200 OK con valuación numérica ($0.0 cuando vacío).
       - Peticiones no autenticadas devuelven `401 Unauthorized` estructurado.
    2. *Verde:* Refactorizar `ProductoController` para adoptar DTOs, responder en JSON estructurado y configurar las autorizaciones en `SecurityConfig`.
  - **Hecho cuando:** `.\mvnw.cmd test -Dtest=ProductoIntegrationTest,ProductoRbacSecurityTest` pasa al 100% en verde.

---

- [x] **Tarea 4: Frontend UI, Filtro de Inactivos, Reactivación y Modo Demostración**
  - **Estimación:** ~25-30 min
  - **Dependencias:** Tarea 3.
  - **Requisitos cubiertos:** RF-003, RF-004, RF-016, RF-017, RF-020.
  - **Descripción:**
    1. Actualizar `frontend/src/types/index.ts` incorporando `activo?: boolean` a la interfaz `Producto`.
    2. Actualizar `frontend/src/services/api.ts`:
       - `getProducts(isDemo, incluirInactivos?: boolean)` propagando el query parameter.
       - `getLowStockProducts(isDemo, umbral?: number)`.
       - Mapeo y propagación de errores estructurados.
    3. Actualizar `frontend/src/services/demoData.ts` y `demoStore`:
       - Replicar el campo `activo` (default `true`) en productos mockeados.
       - Soportar filtro `incluirInactivos`, borrado lógico / toggle de reactivación y cálculo de valuación.
    4. Integrar en `ProductToolbar.tsx`, `ProductTable.tsx` y `ProductGrid.tsx`:
       - Selector/pestaña "Solo Activos" vs "Todos los productos" para rol `ADMIN`.
       - Badge visual "Inactivo" y botón de acción "Reactivar" para productos descontinuados.
       - Restricción en módulo de ventas para que solo consuma productos con `activo = true`.
  - **Hecho cuando:** `npm --prefix frontend run lint` reporta 0 advertencias/0 errores, `npm --prefix frontend run build` compila con éxito, y la visualización/reactivación de productos funciona en la UI.

---

- [x] **Tarea 5: Verificación Integral E2E, Cobertura y Cierre de Spec 003**
  - **Estimación:** ~15-20 min
  - **Dependencias:** Tareas 1, 2, 3, 4.
  - **Requisitos cubiertos:** RF-001 a RF-020 (Definition of Done completa).
  - **Descripción:**
    1. Ejecutar la suite completa de pruebas unitarias y de integración del backend (`.\mvnw.cmd test`).
    2. Ejecutar el linter y compilación de producción del frontend (`npm run lint` y `npm run build`).
    3. Verificar que un producto inactivo con facturas asociadas mantenga intacta su relación con `DetalleFactura` y que la venta histórica permanezca inalterada (Principio 5 y 12).
    4. Actualizar [checklist-sdd.md](file:///C:/Users/Dilan/Documents/workSpace/JAVA/Dunamis%20Makeup/docs/checklist-sdd.md) marcando las tareas del Módulo 003 como completadas `[x]`.
  - **Hecho cuando:** Todas las suites de pruebas pasan al 100% con cero errores, cero advertencias y el árbol de git en `intregacion-sdd` está completamente limpio.
