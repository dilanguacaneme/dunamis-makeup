# Especificación 001: Autenticación, Sesión y Control de Acceso (RBAC)

## 1. Propósito y Contexto
- **QUÉ:** Proveer un mecanismo seguro de autenticación por credenciales enviadas en JSON, gestión de sesiones de servidor protegidas contra CSRF y fijación de sesión, y control de autorizaciones basado en roles (`ADMIN` y `VENDEDOR`), garantizando respuestas de error uniformes en JSON y compatibilidad con datos históricos.
- **POR QUÉ:** La tienda Dunamis Makeup requiere proteger la privacidad de su inventario y facturación, asegurando que solo usuarios autenticados accedan al sistema, que los vendedores operen exclusivamente dentro de su alcance comercial sin modificar tarifas o catálogo, y que el cliente web reciba contratos de error predecibles y seguros según los principios de la Constitución.

---

## 2. Requisitos Funcionales (Sintaxis EARS)

### Handshake CSRF y Preparación de Sesión
- **RF-001 (Event-driven):** Cuando un cliente envíe una solicitud `GET /api/auth/csrf`, el sistema deberá generar y emitir una cookie de seguridad `XSRF-TOKEN` (`HttpOnly = false`, `SameSite = Lax`, `Path = /`, y `Secure = true` en entornos HTTPS de producción o `Secure = false` en desarrollo local/test) y responder con estado HTTP `200 OK` y el cuerpo JSON `{ "ready": true }`.
  - *Por qué:* Permite a la SPA en React obtener el token anti-falsificación necesario antes de iniciar sesión o realizar cualquier mutación.

- **RF-002 (Unwanted behavior):** Si un cliente envía una solicitud con método mutable (`POST`, `PATCH`, `DELETE`) sin la cabecera `X-XSRF-TOKEN` o con un valor que no coincida con el token CSRF activo, el sistema deberá rechazar la solicitud con estado HTTP `403 Forbidden` y un cuerpo JSON uniforme `{ "error": "CSRF_INVALID", "message": "Token CSRF inválido o faltante", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Previene ataques de falsificación de peticiones en sitios cruzados (CSRF) y cumple el Principio 11 de la Constitución con errores estructurados.

### Inicio de Sesión (Login) y Contrato DTO
- **RF-003 (Event-driven):** Cuando un cliente envíe una solicitud `POST /api/auth/login` con cabecera `Content-Type: application/json`, cabecera `X-XSRF-TOKEN` válida y un cuerpo deserializable en el DTO `LoginRequest` con `username` y `password` no vacíos, el sistema deberá normalizar el `username` aplicando `trim()` y minúsculas (`toLowerCase()`), autenticar las credenciales contra el hash BCrypt, invalidar cualquier sesión previa, crear una nueva sesión de servidor con cookie `JSESSIONID` (`HttpOnly = true`, `SameSite = Lax`, `Path = /`, y `Secure = true` en producción o `false` en dev), rotar y emitir un nuevo `XSRF-TOKEN`, y responder con estado HTTP `200 OK` y el cuerpo JSON `{ "authenticated": true }`.
  - *Por qué:* Centraliza la autenticación en el servidor mediante sesiones seguras, previene la fijación de sesión (*Session Fixation*), normaliza el identificador de usuario y cumple con el Principio 2 de contratos API con DTOs validados.

- **RF-004 (Unwanted behavior):** Si un cliente envía una solicitud `POST /api/auth/login` con cuerpo malformado, tipo de contenido no JSON o campos que violen las validaciones del DTO (`username` en blanco o mayor a 50 caracteres, o `password` en blanco), el sistema deberá rechazar la petición con estado HTTP `400 Bad Request` y el cuerpo JSON uniforme `{ "error": "BAD_REQUEST", "message": "Los datos de inicio de sesión son inválidos o están incompletos", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Falla de manera temprana y explícita ante solicitudes sintácticamente inválidas antes de consultar la persistencia.

- **RF-005 (Unwanted behavior):** Si un cliente envía credenciales cuyo `username` no existe en la base de datos o cuya `password` no coincide con el hash almacenado, el sistema deberá rechazar la solicitud con estado HTTP `401 Unauthorized` y el cuerpo JSON uniforme `{ "error": "UNAUTHORIZED", "message": "Usuario o contraseña incorrectos", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Protege contra la enumeración de usuarios conforme a los estándares de seguridad OWASP.

- **RF-006 (Unwanted behavior):** Si un cliente intenta iniciar sesión con una cuenta que exista pero tenga su estado deshabilitado (`activo = false`), el sistema deberá rechazar la solicitud con estado HTTP `401 Unauthorized` y exactamente el mismo cuerpo JSON genérico `{ "error": "UNAUTHORIZED", "message": "Usuario o contraseña incorrectos", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Impide el acceso a personal dado de baja sin revelar información interna sobre el estado de la cuenta.

- **RF-007 (Optional):** Donde un mismo usuario inicie sesión simultáneamente desde múltiples navegadores o dispositivos, el sistema deberá permitir la coexistencia de sesiones concurrentes independientes sin invalidar los accesos previos.
  - *Por qué:* Facilita la operación comercial permitiendo a la administración consultar el sistema desde el móvil y el ordenador al mismo tiempo.

### Ciclo de Vida y Consulta de Sesión (`/me`)
- **RF-008 (State-driven):** Mientras exista una sesión de servidor activa asociada a la cookie `JSESSIONID` y no hayan transcurrido más de 120 minutos de inactividad, cuando el cliente invoque `GET /api/auth/me`, el sistema deberá responder con estado HTTP `200 OK` y el DTO `UsuarioResponse` en formato JSON `{ "username": "...", "fullName": "...", "role": "..." }`.
  - *Por qué:* Provee a la interfaz de usuario los datos necesarios para hidratar la sesión y adaptar las vistas según el rol sin exponer jamás entidades JPA ni hashes de contraseñas (Principio 2).

- **RF-009 (Unwanted behavior):** Si un cliente invoca `GET /api/auth/me` sin una cookie de sesión válida o si han transcurrido más de 120 minutos sin actividad, el sistema deberá responder con estado HTTP `401 Unauthorized` y el cuerpo JSON uniforme `{ "error": "UNAUTHORIZED", "message": "Se requiere iniciar sesión", "timestamp": <timestamp_ms> }`.
  - *Por qué:* Notifica oportunamente a la SPA la caducidad de la sesión para redirigir a la pantalla de acceso.

### Cierre de Sesión (Logout)
- **RF-010 (Event-driven):** Cuando un cliente envíe una solicitud `POST /api/auth/logout` con la cabecera `X-XSRF-TOKEN`, el sistema deberá invalidar la sesión HTTP en el servidor (si existiere), ordenar al navegador la eliminación de las cookies `JSESSIONID` y `XSRF-TOKEN`, y responder con estado HTTP `200 OK` y el cuerpo JSON `{ "authenticated": false }`.
  - *Por qué:* Asegura la terminación explícita del acceso y previene el secuestro de credenciales residuales.

- **RF-011 (Event-driven):** Si un cliente invoca `POST /api/auth/logout` sin tener una sesión activa o habiendo expirado la misma, el sistema deberá comportarse de forma idempotente, respondiendo con estado HTTP `200 OK` y el cuerpo `{ "authenticated": false }`, asegurando la orden de limpieza de cookies sin emitir error.
  - *Por qué:* Garantiza robustez y previene bloqueos en la interfaz cuando el usuario intenta salir de una sesión ya caducada.

### Control de Acceso Basado en Roles (RBAC) y Límites de Seguridad
- **RF-012 (Ubiquitous):** El sistema deberá asignar a todo usuario autenticado exactamente uno de dos roles válidos: `ADMIN` o `VENDEDOR`. Si un registro histórico en la base de datos presenta un valor nulo en su rol (`rol == null`), el sistema deberá interpretarlo bajo el principio de mínimo privilegio asignándole el rol `VENDEDOR` en memoria.
  - *Por qué:* Cumple el Principio 12 de la Constitución de tolerancia brownfield sin comprometer la seguridad.

- **RF-013 (State-driven):** Mientras un usuario cuente con el rol `VENDEDOR`, el filtro de seguridad de URLs deberá permitirle invocar operaciones de lectura (`GET`) en `/producto/**`, `/marcas/**`, `/factura/**` y la creación de ventas en `/factura/crear`.
  - *Por qué:* Garantiza la operatividad diaria del mostrador de ventas en tienda.

- **RF-014 (Unwanted behavior):** Si un usuario con rol `VENDEDOR` intenta invocar operaciones restringidas de administración (como `POST`, `PATCH` o `DELETE` sobre `/producto/**` o `/marcas/**`), el filtro de seguridad de URLs deberá interceptar la solicitud y responder con estado HTTP `403 Forbidden` y el cuerpo JSON uniforme `{ "error": "FORBIDDEN", "message": "Acceso denegado: permisos insuficientes", "timestamp": <timestamp_ms> }`, sin ejecutar la lógica de los controladores subyacentes.
  - *Por qué:* Establece la frontera estricta de seguridad de la Spec 001 sobre los filtros web de Spring Security, protegiendo las rutas administrativas.

- **RF-015 (State-driven):** Mientras un usuario cuente con el rol `ADMIN`, el filtro de seguridad deberá concederle autorización para invocar la totalidad de endpoints de la aplicación.
  - *Por qué:* Otorga el control administrativo total del Atelier Dunamis Makeup.

### Sembrado Inicial y Aislamiento de Entorno
- **RF-016 (Event-driven):** Al iniciar el backend, si las cuentas administradoras predeterminadas (`maryuri` y `caterin`) no existen en la base de datos, el sistema deberá crearlas asignándoles el rol `ADMIN` y hasheando sus contraseñas mediante BCrypt (factor 12) a partir de las variables de entorno `ADMIN_MARYURI_PASSWORD` y `ADMIN_CATERIN_PASSWORD`. Si dichas variables no están configuradas o tienen menos de 12 caracteres en este primer arranque, el sistema deberá detener el inicio con una excepción descriptiva.
  - *Por qué:* Garantiza la existencia de cuentas maestras iniciales sin almacenar claves en texto plano y cumpliendo el Principio 3 de la Constitución.

- **RF-017 (State-driven):** En arranques subsecuentes del sistema donde las cuentas administradoras ya existen en la base de datos, el sistema deberá iniciar normalmente sin exigir la presencia activa de las variables de entorno `ADMIN_*_PASSWORD` y sin alterar las contraseñas ya persistidas.
  - *Por qué:* Resuelve la disponibilidad operativa y previene fallos de inicio en reinicios de servidores en producción.

- **RF-018 (Optional):** Donde el backend se ejecute bajo el perfil de pruebas automatizadas (`test`), el sistema deberá aprovisionar automáticamente credenciales de prueba predefinidas en memoria para permitir la ejecución reproducible de la suite de pruebas sin requerir variables en el sistema anfitrión.
  - *Por qué:* Cumple con el Principio 8 de la Constitución, permitiendo la ejecución aislada y reproducible de tests.

---

## 3. Fuera de Alcance
Los siguientes aspectos quedan formalmente excluidos de esta especificación:
1. Endpoints de auto-registro público de usuarios.
2. Interfaz visual (UI) y endpoints de administración para crear, editar o eliminar usuarios vendedores (pertenecerán a una especificación posterior de gestión de personal).
3. Mecanismos de recuperación o cambio de contraseña por correo electrónico o autoservicio.
4. Autenticación federada o multifactor (OAuth2, Google, SAML).
5. Lógica interna de negocio o validación de datos dentro de los controladores de `/producto/**`, `/marcas/**` o `/factura/**` (pertenecientes a las Specs 002, 003 y 004).

---

## 4. Criterios de Finalización (Definition of Done)
La especificación se considerará cumplida y apta para integración cuando se verifiquen formalmente las siguientes condiciones:

1. **Pruebas de Integración Backend con `MockMvc`:**
   Existe una suite de pruebas automatizadas que valida con éxito:
   - Handshake CSRF en `GET /api/auth/csrf` con cookie y cuerpo `{ "ready": true }`.
   - Rechazo de mutaciones con HTTP 403 y cuerpo JSON `{ "error": "CSRF_INVALID", ... }` ante token ausente o no coincidente.
   - Login con payload `application/json` emitiendo cookie `JSESSIONID` y rotando el token CSRF.
   - Respuesta HTTP 400 ante DTO malformado o campos en blanco en login.
   - Respuesta HTTP 401 unificada `{ "error": "UNAUTHORIZED", "message": "Usuario o contraseña incorrectos", ... }` ante credenciales erróneas o cuenta inactiva.
   - Consulta de identidad en `GET /api/auth/me` con sesión válida retornando DTO `UsuarioResponse`, y HTTP 401 si expiró.
   - Cierre de sesión en `POST /api/auth/logout` con eliminación de cookies, funcionando de manera idempotente ante llamadas sin sesión.
   - Intercepción de seguridad RBAC: confirmación de que `VENDEDOR` recibe HTTP 403 con `{ "error": "FORBIDDEN", ... }` ante mutaciones en `/producto/**` o `/marcas/**`, mientras que `ADMIN` tiene acceso permitido.

2. **Pruebas Automatizadas en Frontend:**
   Existe una suite de pruebas automatizadas en el frontend que valida:
   - Que `inventoryApi.login()` despache la solicitud en formato `application/json` adjuntando la cabecera `X-XSRF-TOKEN`.
   - Que `inventoryApi.ensureCsrf()` gestione el ciclo del token previo a solicitudes mutables.
   - Que `LoginScreen.tsx` procese y despliegue el mensaje de error legible ante respuestas 401 o caída del servidor, y bloquee el envío de formularios incompletos.

3. **Aislamiento y Reproducibilidad:**
   - La suite de pruebas de backend se ejecuta y pasa limpiamente con `.\mvnw.cmd test` sin requerir conexión a una base de datos PostgreSQL externa ni variables de entorno del sistema.

4. **Conformidad de Calidad y Compilación:**
   - Cero advertencias y cero errores en el linter del frontend (`oxlint`).
   - Compilación exitosa de TypeScript y Vite (`npm run build`).
   - Compilación limpia del backend (`.\mvnw.cmd test-compile`).
