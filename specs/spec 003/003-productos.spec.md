# Especificación 003: Catálogo e Inventario de Productos

## 1. Propósito y Contexto
- **QUÉ:** Regularizar y blindar la gestión integral del catálogo de productos y control de existencias de Dunamis Makeup: migración a contratos tipados (DTOs inmutables validados), eliminación de exposición directa de entidades JPA, erradicación de respuestas en texto plano sustituyéndolas por el contrato uniforme de error JSON (`ErrorResponse`), soporte de borrado lógico (`activo: Boolean`) con salvaguarda estricta de integridad histórica (prohibición de borrado físico ante facturas asociadas), umbrales configurables de alerta de existencias (stock bajo y agotado), recálculo automático y saneamiento del campo redundante `totalProducto`, y control de acceso RBAC diferenciado (`ADMIN` gestiona el catálogo; `VENDEDOR` consulta existencias activas).
- **POR QUÉ:** El inventario de productos constituye el núcleo comercial del sistema: define qué artículos existen, a qué marca pertenecen, su categoría cosmética, su precio unitario y sus existencias disponibles para la venta. Actualmente, el controlador expone la entidad JPA `Producto`, arroja errores no controlados en texto plano ante ausencias o catálogo vacío, y expone un endpoint de borrado físico que desencadena excepciones de base de datos (`DataIntegrityViolationException`) cuando un producto ya ha sido facturado. Esta especificación formaliza los requisitos bajo el ciclo SDD y la Constitución de Dunamis Makeup.

---

## 2. Requisitos Funcionales (Sintaxis EARS)

### Contratos de Datos (DTOs)
- **RF-001 (Ubiquitous):** La API de productos deberá comunicarse exclusivamente mediante DTOs inmutables tipados, eliminando por completo la exposición directa de la entidad JPA `Producto`:
  - `ProductoResponse`: `{ "id": Long, "nombre": String, "precio": Double, "cantidad": Integer, "cantidadInicial": Integer?, "totalProducto": Double, "categoria": CategoriaProducto, "marca": MarcaResponse?, "activo": Boolean }`.
  - `CrearProductoRequest`: `{ "nombre": String, "precio": Double, "cantidad": Integer, "categoria": CategoriaProducto, "marcaId": Long }`.
  - `ActualizarProductoRequest`: `{ "nombre": String?, "precio": Double?, "cantidad": Integer?, "categoria": CategoriaProducto?, "marcaId": Long?, "activo": Boolean? }` (al menos un campo debe ser no nulo).
  - *Por qué:* Cumple con el Principio 2 de la Constitución de Dunamis Makeup.

- **RF-002 (Ubiquitous):** En todas las respuestas de `ProductoResponse`, el valor de `totalProducto` deberá calcularse de forma consistente y determinista como `precio * cantidad` (redondeado a dos decimales o mantenido como valor de doble precisión equivalente), garantizando que el cliente web reciba siempre la valuación exacta de la línea de producto.
  - *Por qué:* Elimina desincronizaciones entre el valor persistido y los valores reales de `precio` y `cantidad`.

---

### Consulta de Productos (`GET /producto/obtener-productos` y `GET /producto/obtener-productos-por-id/{id}`)
- **RF-003 (State-driven):** Mientras un usuario autenticado con rol `ADMIN` o `VENDEDOR` envíe una solicitud `GET /producto/obtener-productos` (sin parámetros o con `incluirInactivos=false`), el sistema deberá retornar estado HTTP `200 OK` y una lista JSON de DTOs `ProductoResponse` que contengan únicamente productos activos (`activo = true` o productos históricos con `activo IS NULL`). Si no existen productos, retornará HTTP `200 OK` con un arreglo vacío `[]` (nunca HTTP 204).
  - *Por qué:* Proporciona el catálogo comercial activo disponible para mostrador y facturación sin exponer artículos descatalogados.

- **RF-004 (State-driven):** Mientras un usuario autenticado con rol `ADMIN` envíe una solicitud `GET /producto/obtener-productos?incluirInactivos=true`, el sistema deberá retornar estado HTTP `200 OK` y la lista JSON completa de DTOs `ProductoResponse`, incluyendo productos activos e inactivos.
  - *Por qué:* Permite al administrador auditar el inventario histórico, revisar productos descontinuados y proceder con su reactivación.

- **RF-005 (Unwanted behavior):** Si un usuario autenticado con rol `VENDEDOR` envía una solicitud `GET /producto/obtener-productos?incluirInactivos=true`, el sistema deberá rechazar la solicitud con estado HTTP `403 Forbidden` y el error JSON estructurado `{ "error": "FORBIDDEN", "message": "Acceso denegado: la consulta de productos inactivos es exclusiva de administradores", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Aplica el principio de menor privilegio al personal de ventas.

- **RF-006 (State-driven):** Cuando un usuario autenticado (`ADMIN` o `VENDEDOR`) solicite `GET /producto/obtener-productos-por-id/{id}`, el sistema deberá buscar el producto por su identificador. Si existe, responderá con HTTP `200 OK` y el DTO `ProductoResponse`.
  - *Por qué:* Permite inspeccionar o precargar el detalle de un producto específico.

- **RF-007 (Unwanted behavior):** Si se invoca `GET /producto/obtener-productos-por-id/{id}` con un identificador inexistente, el sistema deberá responder con estado HTTP `404 Not Found` y el JSON estructurado `{ "error": "NOT_FOUND", "message": "Producto no encontrado con id: <id>", "timestamp": <timestamp_ms> }` (nunca texto plano).
  - *Por qué:* Satisface el Principio 11 de la Constitución erradicando las respuestas en texto plano actuales.

---

### Creación de Productos (`POST /producto/crear`)
- **RF-008 (Event-driven):** Cuando un usuario autenticado con rol `ADMIN` envíe una solicitud `POST /producto/crear` con cabecera `X-XSRF-TOKEN` válida y cuerpo `CrearProductoRequest`:
  1. El sistema sanitizará el `nombre` (`trim()` y colapso de espacios múltiples).
  2. Validará que `nombre` no esté en blanco y tenga entre 2 y 120 caracteres.
  3. Validará que `precio` sea mayor o igual a 0.0.
  4. Validará que `cantidad` sea un entero mayor o igual a 0.
  5. Validará que `categoria` pertenezca a los valores válidos del enum `CategoriaProducto` (`ROSTRO`, `CEJAS`, `LABIOS`, `OJOS`).
  6. Validará que `marcaId` no sea nulo, corresponda a una marca existente en base de datos y que dicha marca se encuentre activa (`activa = true`).
  7. Inicializará `cantidadInicial` con el mismo valor que `cantidad`, `activo = true` y calculará `totalProducto = precio * cantidad`.
  8. Persistirá el producto y retornará estado HTTP `201 Created` junto con el DTO `ProductoResponse`.
  - *Por qué:* Asegura la consistencia y completitud del catálogo en el alta de nuevos cosméticos.

- **RF-009 (Unwanted behavior):** Si `marcaId` no existe en la base de datos o corresponde a una marca inactiva (`activa = false`), el sistema deberá rechazar la creación con estado HTTP `400 Bad Request` y el JSON uniforme `{ "error": "BAD_REQUEST", "message": "La marca seleccionada no existe o está inactiva", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Garantiza la regla de negocio cruzada entre Marcas (Spec 002) y Productos (Spec 003).

- **RF-010 (Unwanted behavior):** Si los datos del producto violan las validaciones de entrada (`nombre` en blanco, `precio < 0`, `cantidad < 0`, o `categoria` nula/inválida), el sistema responderá con estado HTTP `400 Bad Request` y el JSON uniforme con el mensaje de validación descriptivo correspondiente.
  - *Por qué:* Falla de forma temprana antes de intentar persistir en la base de datos.

- **RF-011 (Unwanted behavior):** Si un usuario con rol `VENDEDOR` intenta invocar `POST /producto/crear`, el filtro de seguridad de Spring Security deberá interceptar la petición y retornar HTTP `403 Forbidden` con `{ "error": "FORBIDDEN", "message": "Acceso denegado: permisos insuficientes", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Restringe la creación de catálogo a usuarios administradores.

---

### Actualización Parcial y Gestión de Stock (`PATCH /producto/actualizar/{id}`)
- **RF-012 (Event-driven):** Cuando un usuario con rol `ADMIN` envíe una solicitud `PATCH /producto/actualizar/{id}` con cabecera `X-XSRF-TOKEN` válida y cuerpo `ActualizarProductoRequest`:
  1. Si el producto no existe por su `id`, responderá con HTTP `404 Not Found` en JSON estructurado.
  2. Si `nombre` está presente: se sanitiza y valida (longitud 2-120 caracteres, no en blanco).
  3. Si `precio` está presente: valida `precio >= 0.0`.
  4. Si `cantidad` está presente: valida `cantidad >= 0`.
  5. Si `categoria` está presente: valida contra `CategoriaProducto`.
  6. Si `marcaId` está presente: valida que la marca exista y esté activa.
  7. Si `activo` está presente: actualiza el estado lógico del producto (`true` o `false`).
  8. Recalcula `totalProducto = producto.getPrecio() * producto.getCantidad()`.
  9. Persiste las modificaciones y responde con estado HTTP `200 OK` y el DTO `ProductoResponse`.
  - *Por qué:* Permite mantenimiento flexible de atributos, precios, ajustes de stock y reactivación sin inconsistencias.

- **RF-013 (Unwanted behavior):** Si el payload de `PATCH /producto/actualizar/{id}` contiene campos que intenten establecer un precio negativo (`precio < 0`) o existencias negativas (`cantidad < 0`), el sistema deberá responder con HTTP `400 Bad Request` y el mensaje de error estructurado correspondiente.
  - *Por qué:* Salvaguarda el Principio 4 de la Constitución de existencias nunca negativas.

- **RF-014 (Unwanted behavior):** Si el payload enviado está vacío `{}` o todos sus campos son nulos, el sistema responderá con estado HTTP `400 Bad Request` y `{ "error": "BAD_REQUEST", "message": "Debe especificar al menos un campo válido para actualizar", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Evita transacciones de actualización redundantes o vacías.

---

### Borrado Lógico e Integridad Referencial (`DELETE /producto/borrar-producto-por-id/{id}`)
- **RF-015 (Ubiquitous):** En estricto cumplimiento del Principio 5 de la Constitución, queda terminantemente prohibido el borrado físico de productos que posean facturas históricas asociadas (`DetalleFactura`).
  - *Por qué:* Previene fallos catastróficos de integridad referencial (`DataIntegrityViolationException` / Error 500) y garantiza la trazabilidad contable y tributaria de las ventas pasadas.

- **RF-016 (State-driven):** Cuando un usuario con rol `ADMIN` envíe una solicitud `DELETE /producto/borrar-producto-por-id/{id}`:
  1. Si el producto no existe, responderá con HTTP `404 Not Found` y JSON estructurado.
  2. Si el producto posee al menos un detalle de factura asociado en base de datos:
     - El sistema ejecutará el **borrado lógico** marcando `activo = false` en el producto, registrará la operación y responderá con estado HTTP `200 OK` retornando el DTO `ProductoResponse` con `activo = false`.
     - Alternativamente, si el cliente exige eliminación física explícita, el sistema rechazará el borrado físico con estado HTTP `409 Conflict` informando: `"No es posible eliminar físicamente el producto porque posee historial de facturación asociado. El producto ha sido desactivado lógicamente."`.
  3. Si el producto NO posee facturas asociadas en ninguna venta histórica:
     - El sistema podrá proceder con la eliminación física del registro o su desactivación lógica, respondiendo con HTTP `200 OK` y el DTO del producto eliminado.
  - *Por qué:* Unifica la experiencia de borrado protegiendo la base de datos contra inconsistencias.

---

### Alerta de Existencias y Stock Bajo (`GET /producto/acabarse`)
- **RF-017 (State-driven):** Cuando un usuario autenticado (`ADMIN` o `VENDEDOR`) consulte `GET /producto/acabarse` con el parámetro opcional `?umbral=<entero>`:
  1. Si no se especifica `umbral`, se asumirá por defecto `umbral = 0` (productos totalmente agotados), garantizando 100% de retrocompatibilidad con el cliente web actual.
  2. Si se especifica `?umbral=X` (con `X >= 0`), el sistema filtrará todos los productos donde `cantidad <= X`.
  3. En todos los casos, el filtro deberá considerar **únicamente productos activos** (`activo = true`). Los productos inactivos (`activo = false`) quedan explícitamente excluidos de las alertas de reposición de stock.
  4. Responderá con estado HTTP `200 OK` y una lista de DTOs `ProductoResponse` ordenados ascendentemente por cantidad (`cantidad ASC`).
  - *Por qué:* Convierte la consulta pasiva de agotados en un monitor preventivo de inventario para compras y alertas en mostrador.

- **RF-018 (Unwanted behavior):** Si el valor de `umbral` es un número negativo (`umbral < 0`) o no es numérico, el sistema responderá con estado HTTP `400 Bad Request` y `{ "error": "BAD_REQUEST", "message": "El umbral de existencias debe ser un número entero mayor o igual a cero", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Valida parámetros de consulta y evita errores de conversión en el servicio.

---

### Valuación Total del Inventario (`GET /producto/total-inventario`)
- **RF-019 (State-driven):** Cuando un usuario autenticado (`ADMIN` o `VENDEDOR`) solicite `GET /producto/total-inventario`:
  1. El sistema calculará la sumatoria total del inventario activo: `SUM(p.precio * p.cantidad)` sobre todos los productos donde `activo = true` (o histórico `activo IS NULL`).
  2. Si el catálogo no contiene productos activos o todas las existencias son cero, el sistema responderá con HTTP `200 OK` y el valor numérico `0.0` (o `{ "totalInventario": 0.0 }`), eliminando la excepción `InventarioVacioException` que provocaba un HTTP 404 falso.
  - *Por qué:* La ausencia de stock o un catálogo nuevo representa un valor contable de $0.0 y no un recurso ausente (404).

---

### Compatibilidad con Modo Demostración y Frontend
- **RF-020 (Ubiquitous):** La capa de simulación en frontend (`demoStore` y `demoData.ts`) deberá reflejar fielmente las reglas de la presente especificación:
  1. Manejo del atributo `activo: boolean` en cada producto (por defecto `true`).
  2. Filtrado de inactivos en catálogo salvo cuando el usuario solicite explícitamente ver todos (`incluirInactivos`).
  3. Desactivación lógica en `deleteProduct()` y reactivación mediante `updateProduct(id, { activo: true })`.
  4. Sincronización del cálculo `totalProducto = precio * cantidad` y cálculo de valuación total.
  - *Por qué:* Garantiza coherencia absoluta entre el comportamiento en producción conectada a PostgreSQL y la demostración local desconectada.

---

## 3. Matriz de Permisos (RBAC)

| Endpoint | Método | Rol ADMIN | Rol VENDEDOR | No Autenticado |
|---|---|---|---|---|
| `/producto/obtener-productos` (solo activos) | `GET` | Permitido (200) | Permitido (200) | Rechazado (401) |
| `/producto/obtener-productos?incluirInactivos=true` | `GET` | Permitido (200) | Denegado (403) | Rechazado (401) |
| `/producto/obtener-productos-por-id/{id}` | `GET` | Permitido (200) | Permitido (200) | Rechazado (401) |
| `/producto/crear` | `POST` | Permitido (201) | Denegado (403) | Rechazado (401) |
| `/producto/actualizar/{id}` | `PATCH` | Permitido (200) | Denegado (403) | Rechazado (401) |
| `/producto/borrar-producto-por-id/{id}` | `DELETE` | Permitido (200/409) | Denegado (403) | Rechazado (401) |
| `/producto/acabarse` (con o sin `umbral`) | `GET` | Permitido (200) | Permitido (200) | Rechazado (401) |
| `/producto/total-inventario` | `GET` | Permitido (200) | Permitido (200) | Rechazado (401) |

---

## 4. Criterios de Aceptación (Definition of Done)
1. **Contratos DTO estrictos:** Cero exposición de entidades JPA en controladores y servicios de productos.
2. **Cero texto plano:** Todos los errores (400, 403, 404, 409) se serializan bajo `ErrorResponse` con `error`, `message` y `timestamp`.
3. **Borrado lógico y salvaguarda referencial:** Ningún producto con facturas es eliminado físicamente; la desactivación lógica preserva la integridad de `DetalleFactura`.
4. **Alerta de stock bajo:** Endpoint `/producto/acabarse` soporta `?umbral=X` y excluye productos inactivos.
5. **Valuación de inventario:** `/producto/total-inventario` responde `0.0` ante inventario vacío en lugar de HTTP 404.
6. **Tests Backend automatizados:** Suite de tests unitarios y de integración con `MockMvc` cubriendo el 100% de los requisitos funcionales (RF-001 a RF-020).
7. **Frontend y Demo Store sincronizados:** La interfaz de usuario muestra badges de inactividad, opción de reactivación/desactivación y linter `oxlint` con 0 errores/0 advertencias.

---

## 5. Fuera de Alcance (Out of Scope)
- Gestión de abonos parciales y pagos de facturas (corresponde a la **Spec 004**).
- Modificación de esquemas de seguridad de login/CSRF (ya regularizado en la **Spec 001**).
- Carga masiva de inventario mediante archivos CSV/Excel (se considerará en iteraciones futuras).
