# Especificación 002: Catálogo y Gestión de Marcas

## 1. Propósito y Contexto
- **QUÉ:** Estandarizar la gestión completa del catálogo de marcas cosméticas (creación, edición, activación, inactivación y consulta diferenciada por rol) mediante contratos tipados (DTOs validados), manejo uniforme de respuestas de error en JSON, protección CSRF y control de acceso RBAC (`ADMIN` gestiona; `VENDEDOR` solo consulta marcas activas), asegurando la preservación estricta de la integridad referencial (prohibición de borrado físico; borrado lógico exclusivo) y soporte bidireccional en la interfaz de usuario y modo demostración local.
- **POR QUÉ:** La marca es la entidad base indispensable del catálogo de Dunamis Makeup: ningún producto puede crearse ni catalogarse sin una marca válida. El negocio requiere gestionar marcas vigentes para compras y ventas, auditar y reactivar marcas históricas sin romper productos existentes ni facturas pasadas, impedir la manipulación del catálogo por usuarios no autorizados, y erradicar la exposición directa de entidades JPA hacia el cliente web en cumplimiento con la Constitución del proyecto.

---

## 2. Requisitos Funcionales (Sintaxis EARS)

### Contratos de Datos (DTOs)
- **RF-001 (Ubiquitous):** La API de marcas deberá comunicarse exclusivamente mediante DTOs tipados e inmutables:
  - `MarcaResponse`: `{ "id": Long, "nombre": String, "activa": Boolean }`.
  - `CrearMarcaRequest`: `{ "nombre": String }` con validación `@NotBlank` y longitud entre 2 y 80 caracteres.
  - `ActualizarMarcaRequest`: `{ "nombre": String?, "activa": Boolean? }` con validación condicional (al menos uno de los dos campos debe ser no nulo; si `nombre` está presente, no puede ser en blanco ni superar 80 caracteres).
  - *Por qué:* Cumple estrictamente con el Principio 2 de la Constitución prohibiendo la exposición de la entidad JPA `Marca`.

### Consulta y Listado de Marcas (`GET /marcas`)
- **RF-002 (State-driven):** Mientras un usuario autenticado con rol `ADMIN` o `VENDEDOR` envíe una solicitud `GET /marcas` (sin parámetros o con `incluirInactivas=false`), el sistema deberá retornar estado HTTP `200 OK` y una lista JSON de DTOs `MarcaResponse` ordenados alfabéticamente de forma ascendente (`nombre ASC`), conteniendo exclusivamente las marcas con `activa = true`.
  - *Por qué:* Abastece el catálogo de marcas activas para los selectores de creación/edición de productos, filtros de inventario y mostrador de ventas rápidas.

- **RF-003 (State-driven):** Mientras un usuario autenticado con rol `ADMIN` envíe una solicitud `GET /marcas?incluirInactivas=true`, el sistema deberá retornar estado HTTP `200 OK` y la lista JSON completa de DTOs `MarcaResponse` (incluyendo marcas con `activa = true` y `activa = false`) ordenadas alfabéticamente por nombre.
  - *Por qué:* Permite a la administración auditar el historial de marcas y acceder al listado de marcas inactivas para su reactivación.

- **RF-004 (Unwanted behavior):** Si un usuario autenticado con rol `VENDEDOR` envía una solicitud `GET /marcas?incluirInactivas=true`, el sistema deberá rechazar la solicitud con estado HTTP `403 Forbidden` y el cuerpo JSON uniforme `{ "error": "FORBIDDEN", "message": "Acceso denegado: la consulta de marcas inactivas es exclusiva de administradores", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Aplica el principio de menor privilegio y salvaguarda las operaciones de auditoría y gestión de catálogo contra usuarios del mostrador.

- **RF-005 (Unwanted behavior):** Si un cliente no autenticado intenta invocar `GET /marcas` (con o sin parámetros), el filtro de seguridad de Spring Security deberá interceptar la solicitud y retornar HTTP `401 Unauthorized` con el cuerpo JSON uniforme `{ "error": "UNAUTHORIZED", "message": "Se requiere iniciar sesión", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Cumple con la barrera de seguridad de sesión obligatoria fijada en la Spec 001.

### Creación de Marcas (`POST /marcas`)
- **RF-006 (Event-driven):** Cuando un usuario con rol `ADMIN` envíe una solicitud `POST /marcas` con cabecera `Content-Type: application/json`, cabecera `X-XSRF-TOKEN` válida y un cuerpo deserializable en `CrearMarcaRequest`, el sistema deberá:
  1. Sanitizar el `nombre` aplicando `trim()` y colapsando secuencias de espacios múltiples internos a un único espacio.
  2. Validar que la longitud resultante esté entre 2 y 80 caracteres.
  3. Verificar que no exista otra marca registrada con el mismo nombre (comparación insensible a mayúsculas y minúsculas: `equalsIgnoreCase`), independientemente de si está activa o inactiva.
  4. Persistir la marca con `activa = true`.
  5. Responder con estado HTTP `201 Created` y el DTO `MarcaResponse`.
  - *Por qué:* Garantiza la creación normalizada, consistente y atómica de marcas utilizables en el inventario.

- **RF-007 (Unwanted behavior):** Si un cliente envía una solicitud `POST /marcas` con un payload sintácticamente inválido, cuerpo no deserializable o campo `nombre` en blanco, ausente, menor a 2 caracteres o mayor a 80 caracteres, el sistema deberá responder con estado HTTP `400 Bad Request` y el JSON uniforme `{ "error": "BAD_REQUEST", "message": "El nombre de la marca es obligatorio y debe tener entre 2 y 80 caracteres", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Falla tempranamente ante violaciones de validación de entrada sin alcanzar la base de datos.

- **RF-008 (Unwanted behavior):** Si un usuario con rol `ADMIN` intenta crear una marca cuyo nombre normalizado ya coincide con una marca existente en la base de datos (sea activa o inactiva), el sistema deberá responder con estado HTTP `409 Conflict` y el JSON uniforme `{ "error": "CONFLICT", "message": "Ya existe una marca con ese nombre", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Preserva la unicidad comercial de nombres de marca y previene duplicidades en la base de datos.

- **RF-009 (Unwanted behavior):** Si un usuario con rol `VENDEDOR` intenta invocar `POST /marcas`, el filtro de seguridad deberá rechazar la petición con estado HTTP `403 Forbidden` y el error JSON estructurado `{ "error": "FORBIDDEN", "message": "Acceso denegado: permisos insuficientes", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Restringe la potestad de enriquecer el catálogo exclusivamente a la administración.

### Actualización y Toggle de Estado (`PATCH /marcas/{id}`)
- **RF-010 (Event-driven):** Cuando un usuario con rol `ADMIN` envíe una solicitud `PATCH /marcas/{id}` con cabecera `X-XSRF-TOKEN` válida y un cuerpo `ActualizarMarcaRequest`:
  1. El sistema verificará la existencia de la marca por su `id`. Si no existe, responderá con HTTP `404 Not Found`.
  2. Si `nombre` está presente: se sanitiza (`trim` y colapso de espacios). Si difiere del nombre actual de la marca, se validará que ninguna otra marca (`id != {id}`) posea dicho nombre (insensible a mayúsculas); ante colisión responderá con HTTP `409 Conflict`. Si es idéntico al actual, se considerará una operación válida e idempotente.
  3. Si `activa` está presente: se actualizará el estado booleano de la marca (`true` para reactivar, `false` para desactivar).
  4. El sistema guardará los cambios y responderá con estado HTTP `200 OK` y el DTO `MarcaResponse`.
  - *Por qué:* Permite renombrar marcas y alternar su disponibilidad operativa con validaciones completas y sin inconsistencias.

- **RF-011 (Unwanted behavior):** Si un cliente envía `PATCH /marcas/{id}` con un cuerpo JSON vacío `{}` o donde tanto `nombre` como `activa` son nulos, el sistema deberá responder con estado HTTP `400 Bad Request` y el JSON uniforme `{ "error": "BAD_REQUEST", "message": "Debe especificar al menos un campo para actualizar ('nombre' o 'activa')", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Evita transacciones no operativas y valida la semántica del método PATCH.

- **RF-012 (Unwanted behavior):** Si un cliente envía `PATCH /marcas/{id}` con un `id` que no corresponde a ningún registro en la base de datos, el sistema deberá responder con estado HTTP `404 Not Found` y el JSON uniforme `{ "error": "NOT_FOUND", "message": "Marca no encontrada con id: <id>", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Señaliza inequívocamente la ausencia del recurso solicitado.

- **RF-013 (Unwanted behavior):** Si un usuario con rol `VENDEDOR` intenta invocar `PATCH /marcas/{id}`, el sistema interceptará la petición respondiendo con HTTP `403 Forbidden` y el JSON uniforme `{ "error": "FORBIDDEN", "message": "Acceso denegado: permisos insuficientes", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Protege la consistencia del catálogo de modificaciones no autorizadas.

### Integridad Referencial y Prohibición de Borrado Físico
- **RF-014 (Ubiquitous):** Queda expresamente prohibido implementar cualquier endpoint de borrado físico (`DELETE /marcas/**`). El retiro de una marca del catálogo visible se ejecutará exclusivamente mediante borrado lógico alternando su bandera a `activa = false`.
  - *Por qué:* Cumple con el Principio 5 de la Constitución y asegura que ningún producto o factura histórica quede con referencias huérfanas en PostgreSQL.

- **RF-015 (State-driven):** Cuando una marca se encuentre en estado inactivo (`activa = false`):
  1. Los productos existentes históricamente asociados a ella mantendrán su integridad referencial intacta en base de datos.
  2. Las existencias de dichos productos continuarán disponibles para despacho en ventas hasta agotarse.
  3. Al intentar crear un nuevo producto o actualizar la marca de un producto existente hacia dicha marca inactiva, el servicio de productos (Spec 003) deberá rechazar la operación con HTTP `400 Bad Request`.
  - *Por qué:* Asegura la tolerancia brownfield (Principio 12) sin entorpecer la liquidación del stock remanente y previene la incorporación de nuevos productos bajo marcas descatalogadas.

### Sembrado Inicial Idempotente
- **RF-016 (Event-driven):** Al inicializarse el contexto de Spring Boot, el seeder `MarcasIniciales` deberá asegurar de forma idempotente la existencia de las marcas fundacionales del Atelier Dunamis Makeup ("Trendy", "Purpure", "Milagros", "Magna"). Si alguna marca ya existe (sea con `activa = true` o `activa = false`), el seeder respetará el registro y no generará duplicados ni arrojará errores de unicidad.
  - *Por qué:* Garantiza la disponibilidad inmediata del catálogo base en entornos limpios sin corromper cambios administrativos previos.

### Interfaz de Usuario y Modo Demostración
- **RF-017 (State-driven):** En la interfaz web de administración (`BrandManagementView.tsx` y `BrandManagementModal.tsx`):
  1. Para usuarios con rol `ADMIN`, la interfaz deberá incluir un selector/toggle para filtrar entre "Solo Activas" (por defecto) y "Todas las Marcas" (consultando `/marcas?incluirInactivas=true`).
  2. En el listado completo, las marcas inactivas deberán mostrarse con distintivo visual claro de "Inactiva" y un botón de acción "Reactivar" que ejecute `PATCH /marcas/{id}` con `{ activa: true }`.
  3. Desactivar una marca requerirá confirmación explícita del usuario y actualizará su estado a inactiva sin retirarla de la vista si el filtro "Todas" se encuentra seleccionado.
  - *Por qué:* Soluciona la inconsistencia detectada en la UI donde las marcas desactivadas desaparecían y se volvían imposibles de reactivar.

- **RF-018 (State-driven):** Si el usuario en sesión tiene el rol `VENDEDOR`:
  1. En el `Sidebar.tsx`, el acceso directo a la vista de gestión de marcas deberá estar oculto.
  2. Si el vendedor intenta acceder directamente por URL a la ruta de marcas, la SPA deberá redirigir al catálogo de inventario con notificación de permisos insuficientes.
  - *Por qué:* Proporciona coherencia entre las restricciones del backend y la navegación del cliente web.

- **RF-019 (Optional):** En el modo demostración local (`demoStore.ts`), el almacén de datos en memoria/localStorage deberá implementar la misma lógica: filtrado por estado `activa`, soporte del parámetro `incluirInactivas`, validación de unicidad de nombres insensible a mayúsculas, y toggle de activación/desactivación sin borrado físico.
  - *Por qué:* Mantiene paridad funcional absoluta entre el modo local offline y el entorno conectado con PostgreSQL.

---

## 3. Fuera de Alcance
Los siguientes aspectos quedan formalmente excluidos de esta especificación:
1. Endpoints de borrado físico (`DELETE /marcas/**`).
2. Carga, almacenamiento o redimensionamiento de logotipos o imágenes asociadas a la marca (perteneciente a una futura especificación de activos multimedia).
3. Agrupación jerárquica de marcas en sub-marcas, líneas de producto o casas matrices.
4. Reasignación o migración masiva de productos entre diferentes marcas (perteneciente a la especificación de utilidades de catálogo).

---

## 4. Criterios de Finalización (Definition of Done)
La especificación se considerará cumplida y apta para integración cuando se verifiquen formalmente las siguientes condiciones:

1. **Pruebas de Integración Backend con `MockMvc` (`MarcaIntegrationTest`):**
   - `GET /marcas` retorna únicamente marcas activas en orden alfabético con código 200 y DTO `MarcaResponse`.
   - `GET /marcas?incluirInactivas=true` invocado por `ADMIN` retorna marcas activas e inactivas.
   - `GET /marcas?incluirInactivas=true` invocado por `VENDEDOR` retorna `403 Forbidden` estructurado.
   - `POST /marcas` crea una marca con nombre normalizado, responde 201 y DTO `MarcaResponse`.
   - `POST /marcas` con nombre duplicado (misma marca o mayúsculas/minúsculas alternas) responde `409 Conflict` estructurado.
   - `POST /marcas` con payload inválido (en blanco o > 80 caracteres) responde `400 Bad Request` estructurado.
   - `PATCH /marcas/{id}` actualiza nombre y/o estado `activa` respondiendo 200 y DTO `MarcaResponse`.
   - `PATCH /marcas/{id}` con nombre en colisión responde `409 Conflict`.
   - `PATCH /marcas/{id}` con ID inexistente responde `404 Not Found`.
   - `PATCH /marcas/{id}` con cuerpo vacío responde `400 Bad Request`.
   - Acceso no autenticado a cualquier endpoint responde `401 Unauthorized`.
   - Mutaciones (`POST`, `PATCH`) ejecutadas por `VENDEDOR` responden `403 Forbidden`.

2. **Pruebas Unitarias Backend (`MarcaServiceTest`):**
   - Cobertura completa de la lógica de normalización de cadenas (`trim`, espacios múltiples).
   - Verificación de unicidad insensible a mayúsculas/minúsculas.
   - Manejo de excepciones de negocio (`ResponseStatusException` o excepciones dedicadas mapeadas al formato `ErrorResponse`).

3. **Pruebas Automatizadas Frontend:**
   - Pruebas en el servicio de API (`api.ts` o suite de tests frontend) validando el consumo de `GET /marcas` con y sin `incluirInactivas`.
   - Validación del flujo de reactivación y desactivación en `BrandManagementView`.
   - Ocultamiento de acciones de edición y desactivación ante sesiones con rol `VENDEDOR`.

4. **Aislamiento y Verificaciones de Calidad:**
   - La suite de pruebas de backend se ejecuta limpiamente con `.\mvnw.cmd test` bajo el perfil de pruebas con H2.
   - Frontend: cero advertencias y cero errores en el linter (`npm --prefix frontend run lint`).
   - Frontend: compilación de TypeScript y Vite limpia (`npm --prefix frontend run build`).
   - Backend: compilación limpia (`.\mvnw.cmd test-compile`).
