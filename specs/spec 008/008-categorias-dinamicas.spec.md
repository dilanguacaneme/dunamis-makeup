# Especificación 008: Catálogo y Gestión Dinámica de Categorías

## 1. Propósito y Contexto
- **QUÉ:** Evolucionar la clasificación cosmética de Dunamis Makeup desde un enum estático (`CategoriaProducto`) hacia un modelo dinámico y configurable mediante una entidad `Categoria`, con su ciclo de vida completo (creación, edición, activación, inactivación y consulta diferenciada por rol) respaldado por DTOs validados, manejo uniforme de errores JSON (`ErrorResponse`), protección CSRF, control de acceso RBAC (`ADMIN` gestiona; `VENDEDOR` solo consulta categorías activas), salvaguarda estricta de integridad referencial (prohibición de borrado físico; borrado lógico exclusivo), integración simétrica en frontend (`CategoryModal`, filtros reactivos) y soporte local en el modo demostración (`demoStore.ts`).
- **POR QUÉ:** El catálogo cosmético del negocio es dinámico y requiere adaptarse a nuevas líneas de productos (p. ej. *Uñas*, *Brochas*, *Skincare Corporal*, *Fragancias*, etc.) que una administradora pueda incorporar libremente sin requerir cambios de código o redespliegues. Actualmente, las categorías están restringidas a un enum fijo en Java y TypeScript, lo que impide al cliente expandir su inventario. Esta especificación formaliza los requisitos bajo el ciclo SDD y los principios constitucionales de Dunamis Makeup.

---

## 2. Requisitos Funcionales (Sintaxis EARS)

### Contratos de Datos (DTOs)
- **RF-001 (Ubiquitous):** La API de categorías deberá comunicarse exclusivamente mediante DTOs inmutables tipados, eliminando por completo la exposición directa de la entidad JPA `Categoria`:
  - `CategoriaResponse`: `{ "id": Long, "nombre": String, "activa": Boolean }`.
  - `CrearCategoriaRequest`: `{ "nombre": String }` con validación `@NotBlank` y longitud entre 2 y 60 caracteres.
  - `ActualizarCategoriaRequest`: `{ "nombre": String?, "activa": Boolean? }` (al menos uno de los dos campos debe ser no nulo; si `nombre` está presente, no puede estar en blanco ni superar 60 caracteres).
  - *Por qué:* Cumple con el Principio 2 de la Constitución de Dunamis Makeup.

---

### Consulta y Listado de Categorías (`GET /categorias`)
- **RF-002 (State-driven):** Mientras un usuario autenticado con rol `ADMIN` o `VENDEDOR` envíe una solicitud `GET /categorias` (sin parámetros o con `incluirInactivas=false`), el sistema deberá retornar estado HTTP `200 OK` y una lista JSON de DTOs `CategoriaResponse` ordenados alfabéticamente de forma ascendente (`nombre ASC`), conteniendo exclusivamente las categorías activas (`activa = true`).
  - *Por qué:* Abastece los selectores de creación/edición de productos, filtros de la barra superior y catálogos de venta con opciones vigentes.

- **RF-003 (State-driven):** Mientras un usuario autenticado con rol `ADMIN` envíe una solicitud `GET /categorias?incluirInactivas=true`, el sistema deberá retornar estado HTTP `200 OK` y la lista JSON completa de DTOs `CategoriaResponse` (incluyendo categorías activas e inactivas) ordenadas alfabéticamente por nombre.
  - *Por qué:* Permite a la administradora auditar las categorías históricas y reactivarlas según sea necesario.

- **RF-004 (Unwanted behavior):** Si un usuario autenticado con rol `VENDEDOR` envía `GET /categorias?incluirInactivas=true`, el sistema deberá rechazar la solicitud con estado HTTP `403 Forbidden` y el error JSON estructurado `{ "error": "FORBIDDEN", "message": "Acceso denegado: la consulta de categorías inactivas es exclusiva de administradores", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Aplica el principio de menor privilegio al personal de ventas.

- **RF-005 (Unwanted behavior):** Si un cliente no autenticado intenta invocar `GET /categorias`, el filtro de seguridad de Spring Security deberá interceptar la solicitud y responder con HTTP `401 Unauthorized` y el cuerpo JSON estructurado `{ "error": "UNAUTHORIZED", "message": "Se requiere iniciar sesión", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Mantiene la barrera de seguridad de sesión obligatoria fijada en la Constitución.

---

### Creación de Categorías (`POST /categorias`)
- **RF-006 (Event-driven):** Cuando un usuario con rol `ADMIN` envíe una solicitud `POST /categorias` con cabecera `Content-Type: application/json`, cabecera `X-XSRF-TOKEN` válida y un cuerpo deserializable en `CrearCategoriaRequest`, el sistema deberá:
  1. Sanitizar el `nombre` aplicando `trim()` y colapsando secuencias de espacios múltiples internos a un único espacio.
  2. Validar que la longitud resultante esté entre 2 y 60 caracteres.
  3. Verificar que no exista otra categoría registrada con el mismo nombre (comparación insensible a mayúsculas y minúsculas: `equalsIgnoreCase`), independientemente de si está activa o inactiva.
  4. Persistir la categoría con `activa = true`.
  5. Responder con estado HTTP `201 Created` y el DTO `CategoriaResponse`.
  - *Por qué:* Garantiza la creación normalizada, consistente y sin duplicados de categorías utilizables en el inventario.

- **RF-007 (Unwanted behavior):** Si un cliente envía una solicitud `POST /categorias` con un payload inválido, cuerpo no deserializable o campo `nombre` en blanco, menor a 2 caracteres o mayor a 60 caracteres, el sistema deberá responder con estado HTTP `400 Bad Request` y el JSON uniforme `{ "error": "BAD_REQUEST", "message": "El nombre de la categoría es obligatorio y debe tener entre 2 y 60 caracteres", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Falla de forma temprana ante violaciones de validación de entrada sin alcanzar la base de datos.

- **RF-008 (Unwanted behavior):** Si un usuario con rol `ADMIN` intenta crear una categoría cuyo nombre normalizado ya coincide con una categoría existente en la base de datos (sea activa o inactiva), el sistema deberá responder con estado HTTP `409 Conflict` y el JSON uniforme `{ "error": "CONFLICT", "message": "Ya existe una categoría con ese nombre", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Preserva la unicidad comercial de los nombres de categorías.

- **RF-009 (Unwanted behavior):** Si un usuario con rol `VENDEDOR` intenta invocar `POST /categorias`, el sistema responderá con estado HTTP `403 Forbidden` y el error JSON `{ "error": "FORBIDDEN", "message": "Acceso denegado: permisos insuficientes", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Restringe la gestión de categorías a administradores.

---

### Actualización y Toggle de Estado (`PATCH /categorias/{id}`)
- **RF-010 (Event-driven):** Cuando un usuario con rol `ADMIN` envíe una solicitud `PATCH /categorias/{id}` con cabecera `X-XSRF-TOKEN` válida y un cuerpo `ActualizarCategoriaRequest`:
  1. El sistema verificará la existencia de la categoría por su `id`. Si no existe, responderá con HTTP `404 Not Found`.
  2. Si `nombre` está presente: se sanitiza (`trim` y colapso de espacios). Si difiere del nombre actual de la categoría, se validará que ninguna otra categoría (`id != {id}`) posea dicho nombre (insensible a mayúsculas); ante colisión responderá con HTTP `409 Conflict`.
  3. Si `activa` está presente: se actualizará el estado booleano de la categoría (`true` para reactivar, `false` para desactivar).
  4. El sistema guardará los cambios y responderá con estado HTTP `200 OK` y el DTO `CategoriaResponse`.
  - *Por qué:* Permite renombrar categorías y alternar su disponibilidad operativa sin inconsistencias.

- **RF-011 (Unwanted behavior):** Si se envía `PATCH /categorias/{id}` con cuerpo vacío `{}` o con `nombre` y `activa` nulos simultáneamente, responderá con HTTP `400 Bad Request` y `{ "error": "BAD_REQUEST", "message": "Debe especificar al menos un campo para actualizar ('nombre' o 'activa')", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Evita transacciones no operativas y valida la semántica del método PATCH.

- **RF-012 (Unwanted behavior):** Si se invoca `PATCH /categorias/{id}` con un `id` inexistente, responderá con HTTP `404 Not Found` y `{ "error": "NOT_FOUND", "message": "Categoría no encontrada con id: <id>", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Señaliza inequívocamente la ausencia del recurso solicitado.

---

### Integridad Referencial y Prohibición de Borrado Físico
- **RF-013 (Ubiquitous):** Queda expresamente prohibido implementar cualquier endpoint de borrado físico (`DELETE /categorias/**`). El retiro de una categoría se ejecutará exclusivamente mediante borrado lógico alternando su bandera a `activa = false`.
  - *Por qué:* Cumple con el Principio 5 de la Constitución y garantiza que ningún producto histórico quede con referencias huérfanas en PostgreSQL.

- **RF-014 (State-driven):** Cuando una categoría se encuentre inactiva (`activa = false`):
  - No aparecerá en los listados regulares para crear nuevos productos (`GET /categorias`).
  - Los productos previamente asociados a dicha categoría conservarán su integridad y seguirán visualizándose normalmente.
  - No se permitirá asociar una categoría inactiva a un nuevo producto en `POST /producto/crear` ni en `PATCH /producto/actualizar/{id}`.

---

### Sembrado Inicial Idempotente (`CategoriasIniciales`)
- **RF-015 (Event-driven):** Al iniciar la aplicación, un componente `ApplicationRunner` (`CategoriasIniciales`) verificará si existen categorías en la base de datos. Si la tabla está vacía, sembrará de manera idempotente las 6 categorías base históricas:
  1. *Rostro* (`activa = true`)
  2. *Ojos* (`activa = true`)
  3. *Labios* (`activa = true`)
  4. *Cejas* (`activa = true`)
  5. *Cuidado Facial* (`activa = true`)
  6. *Accesorios* (`activa = true`)
  - *Por qué:* Garantiza la compatibilidad inmediata sin requerir configuración manual inicial.

---

### Relación entre Producto y Categoría
- **RF-016 (Ubiquitous):** La entidad `Producto` se vinculará a la entidad `Categoria` (`@ManyToOne`).
- **RF-017 (Ubiquitous):** Los DTOs de producto se adaptarán al nuevo modelo:
  - `ProductoResponse`: expondrá el objeto `categoria: CategoriaResponse` (`{ "id": Long, "nombre": String, "activa": Boolean }`).
  - `CrearProductoRequest`: aceptará `categoriaId: Long` (obligatorio, no nulo, debe corresponder a una categoría activa).
  - `ActualizarProductoRequest`: aceptará `categoriaId: Long?` (si se especifica, debe corresponder a una categoría activa).
- **RF-018 (Ubiquitous):** Migración brownfield segura: al inicializarse la aplicación, si existen productos históricos vinculados al enum o con `categoria_id` nulo, el sembrador asociará automáticamente el producto a su categoría correspondiente por nombre coincidente.

---

### Frontend, Modo Demostración y Despliegue
- **RF-019 (Ubiquitous):** En la interfaz web:
  - Se creará el componente modal `CategoryModal.tsx` accesible para administradoras (junto al botón de gestión de marcas en la barra superior o cabecera).
  - El modal permitirá ver las categorías, alternar su estado activo/inactivo y registrar nuevas categorías.
  - Los selectores de categoría en `ProductModal.tsx` y en los filtros de catálogo se poblarán dinámicamente con las categorías activas.
- **RF-020 (Ubiquitous):** En modo demostración local (`demoStore.ts`):
  - Se incluirá la colección de categorías iniciales con persistencia en storage (`dunamis_demo_categories_v3`).
  - La creación y actualización de categorías operará de forma idéntica en memoria local sin requerir conexión a internet.
- **RF-021 (Ubiquitous):** En [frontend/vercel.json](file:///C:/Users/Dilan/Documents/workSpace/JAVA/Dunamis Makeup/frontend/vercel.json), se incorporarán las reglas de rewrite para `/categorias` y `/categorias/:path*` hacia el backend en Render.

---

## 3. Casos Límite y Consideraciones de Error
1. **Nombres con diferencias de mayúsculas:** Intentar registrar `"skincare"` cuando ya existe `"Skincare"` debe retornar `409 Conflict`.
2. **Espacios en blanco periféricos o repetidos:** `"  Uñas  Acrílicas  "` debe normalizarse y persistirse como `"Uñas Acrílicas"`.
3. **Inactivación de categoría con productos asociados:** La categoría pasa a `activa = false`; los productos existentes no se alteran ni eliminan; la categoría deja de ofrecerse para productos nuevos.
4. **Resiliencia en modo demo:** Si el usuario resetea los datos de demo con `handleResetDemoData`, las categorías de prueba volverán a su estado base inicial.
