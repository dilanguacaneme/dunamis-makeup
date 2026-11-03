# Plan de Implementación Técnica — Spec 001: Autenticación, Sesión y RBAC

## 1. Módulos y Arquitectura de la Solución

El sistema se estructura en componentes backend y frontend desacoplados que interactúan mediante contratos JSON y cookies de sesión:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Frontend SPA (React 19)                         │
│  - src/components/LoginScreen.tsx (Formulario, feedback y estados)     │
│  - src/services/api.ts (Cliente HTTP: handshake CSRF, login JSON, /me) │
│  - src/types/index.ts (Interfaces Usuario, LoginCredentials, etc.)     │
└────────────────────────────────▲───────────────────────────────────────┘
                                 │ HTTP (Cookie JSESSIONID + Header X-XSRF-TOKEN)
┌────────────────────────────────▼───────────────────────────────────────┐
│                      Backend Spring Boot (Java 17)                     │
│  - controller/AuthController.java (Endpoints /csrf, /me, /logout)      │
│  - controller/AuthenticationProcessing (Endpoint/Filtro /login JSON)   │
│  - dto/auth/LoginRequest.java (DTO de entrada validado)                │
│  - dto/auth/UsuarioResponse.java (DTO de salida desacoplado de JPA)    │
│  - dto/common/ErrorResponse.java (Esquema uniforme de error 4xx/5xx)   │
│  - config/SecurityConfig.java (Cadena de seguridad, CSRF SPA, RBAC)    │
│  - service/UsuarioDetailsService.java (Carga de usuario, roles y nulos)│
│  - service/UsuariosIniciales.java (Sembrado seguro no bloqueante)      │
└────────────────────────────────────────────────────────────────────────┘
```

### Cobertura de Requisitos Funcionales por Módulo:
- **`dto/common/ErrorResponse` & `exception/`:** Cubre **RF-002, RF-004, RF-005, RF-006, RF-009, RF-014** (Principio 11 de la Constitución).
- **`dto/auth/LoginRequest` & `dto/auth/UsuarioResponse`:** Cubre **RF-003, RF-004, RF-008** (Principio 2 de la Constitución).
- **`controller/AuthController` & Procesador de Login:** Cubre **RF-001, RF-003, RF-008, RF-010, RF-011**.
- **`config/SecurityConfig`:** Cubre **RF-001, RF-002, RF-003, RF-007, RF-010, RF-011, RF-012, RF-013, RF-014, RF-015**.
- **`service/UsuarioDetailsService`:** Cubre **RF-003, RF-005, RF-006, RF-012** (Principio 12 de la Constitución).
- **`service/UsuariosIniciales`:** Cubre **RF-016, RF-017, RF-018**.
- **`frontend/src/services/api.ts` y `LoginScreen.tsx`:** Cubre **RF-001, RF-002, RF-003, RF-004, RF-005, RF-008, RF-010**.

---

## 2. Modelo de Datos y Contratos de Comunicación

### 2.1. Entidad de Persistencia (PostgreSQL)
Entidad JPA `Usuario` (tabla `usuarios`):
- `id`: `Long` (PK, IDENTITY).
- `nombreUsuario`: `String` (UNIQUE, length 50, no nulo, normalizado a minúsculas).
- `nombreCompleto`: `String` (length 120, no nulo).
- `passwordHash`: `String` (length 100, no nulo, BCrypt factor 12).
- `activo`: `boolean` (default `true`).
- `rol`: Enum `RolUsuario` (`ADMIN`, `VENDEDOR`). Si el campo en BD es nulo (brownfield), se mapea a `RolUsuario.VENDEDOR` en tiempo de ejecución para cumplir el principio de mínimo privilegio.

### 2.2. DTOs de Entrada y Salida (Principio 2 de la Constitución)
1. **`LoginRequest` (Payload `POST /api/auth/login`):**
   ```java
   public record LoginRequest(
       @NotBlank(message = "El nombre de usuario es obligatorio")
       @Size(max = 50, message = "El nombre de usuario no puede superar 50 caracteres")
       String username,

       @NotBlank(message = "La contraseña es obligatoria")
       @Size(min = 1, max = 120, message = "La contraseña tiene una longitud inválida")
       String password
   ) {}
   ```
2. **`UsuarioResponse` (Payload `GET /api/auth/me`):**
   ```java
   public record UsuarioResponse(
       String username,
       String fullName,
       String role
   ) {}
   ```
3. **`ErrorResponse` (Payload Uniforme para Errores HTTP 400, 401, 403, 404 — Principio 11):**
   ```java
   public record ErrorResponse(
       String error,
       String message,
       long timestamp
   ) {}
   ```
4. **`CsrfResponse` (Payload `GET /api/auth/csrf`):**
   ```java
   public record CsrfResponse(boolean ready) {}
   ```

### 2.3. Especificación de Cookies y Cabeceras
- **Cookie `JSESSIONID`:** `HttpOnly = true`, `SameSite = Lax`, `Path = /`, `Secure = true` en producción HTTPS y `Secure = false` en desarrollo local/test HTTP.
- **Cookie `XSRF-TOKEN`:** `HttpOnly = false` (para lectura del cliente React), `SameSite = Lax`, `Path = /`.
- **Cabecera HTTP requerida en mutaciones:** `X-XSRF-TOKEN`.
- **Tiempo de inactividad de sesión:** 120 minutos (2 horas) configurado en `server.servlet.session.timeout`.

---

## 3. Decisiones Técnicas Justificadas y Alternativas Descartadas

### Decisión 1: Migración del Login a `application/json` con DTO Validado
- **Decisión:** Habilitar un controlador o filtro de autenticación que reciba `application/json` con `@Valid @RequestBody LoginRequest`.
- **Justificación:** Cumple estrictamente con el Principio 2 de la Constitución (comunicación exclusiva mediante DTOs validados) y con la arquitectura SPA en React, evitando que el frontend tenga que lidiar con `URLSearchParams` exclusivamente para una llamada.
- **Alternativa Descartada:** Mantener `formLogin` predeterminado (`application/x-www-form-urlencoded`). *Descartada porque rompe la homogeneidad de la API REST, impide usar anotaciones Jakarta Validation estándar (`@NotBlank`) en el payload de entrada y complica las respuestas de error estructuradas.*
- **Requisitos cubiertos:** **RF-003, RF-004**.

### Decisión 2: Esquema Uniforme de Error `ErrorResponse` (Principio 11)
- **Decisión:** Implementar el DTO inmutable `ErrorResponse(error, message, timestamp)` utilizado por todos los interceptores de seguridad (AuthenticationEntryPoint, AccessDeniedHandler, CsrfHandler).
- **Justificación:** Resuelve el hallazgo de QA sobre respuestas heterogéneas (unas con `{message}`, otras con `{error, message}` y otras con texto plano), asegurando que el cliente React siempre reciba un contrato idéntico.
- **Alternativa Descartada:** Escribir cadenas JSON manuales hardcodeadas en handlers de Spring Security (`response.getWriter().write(...)`). *Descartada por ser propensa a errores tipográficos y violar el principio DRY.*
- **Requisitos cubiertos:** **RF-002, RF-004, RF-005, RF-006, RF-009, RF-014**.

### Decisión 3: Sembrado Idempotente y No Bloqueante en `UsuariosIniciales`
- **Decisión:** Validar las variables de entorno `ADMIN_*_PASSWORD` únicamente si las administradoras `maryuri` y `caterin` no existen en la base de datos. Si ya existen, el sistema arranca con normalidad sin detener el proceso.
- **Justificación:** Resuelve la contradicción detectada en QA (RF-016 vs RF-017), garantizando que reinicios de servidor o cambios de configuración en entornos ya desplegados no causen fallos de disponibilidad.
- **Alternativa Descartada:** Exigir siempre las variables de entorno en cada arranque. *Descartada porque introduce una fragilidad operativa innecesaria en bases de datos con usuarios ya creados y contraseñas hasheadas.*
- **Requisitos cubiertos:** **RF-016, RF-017**.

### Decisión 4: Normalización de `username` (*Case-Insensitive* y *Trimming*)
- **Decisión:** Aplicar `trim()` y `toLowerCase()` al nombre de usuario tanto en el momento del login como en la consulta de `/me`.
- **Justificación:** Previene frustraciones de usuario habituales en dispositivos móviles (donde el teclado pone en mayúscula la primera letra automáticamente) manteniendo la unicidad de las cuentas.
- **Alternativa Descartada:** Autenticación estricta con coincidencia exacta de mayúsculas/minúsculas en el identificador de usuario. *Descartada por deteriorar la experiencia de usuario en un entorno de ventas minoristas.*
- **Requisitos cubiertos:** **RF-003, RF-008**.

### Decisión 5: Tolerancia Brownfield ante Roles Nulos (Principio 12)
- **Decisión:** Si un registro en la base de datos tiene `rol == null`, el servicio `UsuarioDetailsService` le asigna temporalmente en memoria la autoridad `ROLE_VENDEDOR` y en el arranque `UsuariosIniciales` actualiza los registros históricos de las administradoras.
- **Justificación:** Cumple el principio de mínimo privilegio: un registro ambiguo nunca obtendrá permisos de administración por omisión, y el sistema no lanzará un `NullPointerException` en tiempo de ejecución.
- **Alternativa Descartada:** Bloquear el acceso lanzando excepción o asignar rol `ADMIN` por defecto. *Descartada por ser una vulnerabilidad de seguridad grave (elevación de privilegios involuntaria).*
- **Requisitos cubiertos:** **RF-012**.

### Decisión 6: Logout Idempotente
- **Decisión:** Si se invoca `POST /api/auth/logout` sin sesión previa o con sesión vencida, el sistema responde `200 OK` con `{ "authenticated": false }` y emite los encabezados `Set-Cookie` para expirar `JSESSIONID` y `XSRF-TOKEN`.
- **Justificación:** Previene errores en la interfaz cuando el usuario intenta cerrar sesión en una pestaña cuya sesión ya expiró en el servidor.
- **Alternativa Descartada:** Responder `401 Unauthorized` ante logout sin sesión. *Descartada porque genera un error circular en el cliente que intenta cerrar una sesión inexistente.*
- **Requisitos cubiertos:** **RF-010, RF-011**.

---

## 4. Estrategia de Pruebas Automatizadas

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Estrategia de Tests SDD                         │
├────────────────────────────────┬───────────────────────────────────────┤
│ Backend (Spring Boot + MockMvc)│ Frontend (Vitest / Client Tests)      │
├────────────────────────────────┼───────────────────────────────────────┤
│ - AuthCsrfIntegrationTest      │ - services/api.auth.test.ts           │
│ - AuthLoginIntegrationTest     │ - components/LoginScreen.test.tsx     │
│ - AuthRbacSecurityTest         │                                       │
│ - UsuariosInicialesTest        │                                       │
└────────────────────────────────┴───────────────────────────────────────┘
```

### 4.1. Pruebas de Integración Backend (`src/test/java/com/dunamis/makeup/`)

1. **`AuthCsrfIntegrationTest` (Cubre RF-001, RF-002):**
   - Invocación de `GET /api/auth/csrf`: valida estado `200 OK`, cuerpo `{ "ready": true }` y presencia de la cookie `XSRF-TOKEN` legible por cliente.
   - Invocación de mutación (`POST /api/auth/login`) sin cabecera `X-XSRF-TOKEN`: valida rechazo con `403 Forbidden` y cuerpo JSON con `"error": "CSRF_INVALID"`.

2. **`AuthLoginIntegrationTest` (Cubre RF-003, RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-010, RF-011):**
   - **Caso Éxito:** Login con credenciales válidas en JSON -> `200 OK`, cookie `JSESSIONID` emitida, token CSRF rotado.
   - **Caso Normalización:** Login con ` Maryuri ` (espacios y mayúsculas) -> autenticación exitosa.
   - **Caso Validación DTO:** Login con cuerpo vacío `{}` o campos en blanco -> `400 Bad Request` con `"error": "BAD_REQUEST"`.
   - **Caso Credenciales Erróneas:** Usuario inexistente o clave incorrecta -> `401 Unauthorized` con `"error": "UNAUTHORIZED"`, mensaje `"Usuario o contraseña incorrectos"`.
   - **Caso Cuenta Inactiva:** Usuario con `activo = false` -> `401 Unauthorized` con el mismo mensaje genérico.
   - **Caso Sesión `/me`:** Invocación con cookie de sesión activa -> `200 OK` con `UsuarioResponse` (`username`, `fullName`, `role`).
   - **Caso Sesión Inactiva/Caducada:** Invocación de `/me` sin cookie -> `401 Unauthorized` con mensaje `"Se requiere iniciar sesión"`.
   - **Caso Logout Exitoso:** `POST /api/auth/logout` con CSRF -> invalida sesión, borra cookies y retorna `200 OK`.
   - **Caso Logout Idempotente:** `POST /api/auth/logout` sin sesión previa -> `200 OK` con `{ "authenticated": false }`.

3. **`AuthRbacSecurityTest` (Cubre RF-012, RF-013, RF-014, RF-015):**
   - Con sesión de `VENDEDOR`:
     - Acceso concedido a lectura de `/producto/obtener-productos`, `/marcas` y creación de `/factura/crear`.
     - Acceso denegado con `403 Forbidden` y cuerpo JSON `"error": "FORBIDDEN"` al intentar `POST /producto/crear`, `PATCH /producto/actualizar/1`, `POST /marcas`.
   - Con sesión de `ADMIN`:
     - Acceso permitido a la totalidad de endpoints del catálogo y administración.
   - Con registro brownfield `rol == null`:
     - Verificación de que el sistema lo restringe como `VENDEDOR` sin elevar privilegios.

4. **`UsuariosInicialesTest` (Cubre RF-016, RF-017, RF-018):**
   - Primer arranque con variables faltantes -> lanza `IllegalStateException`.
   - Primer arranque con contraseña menor a 12 caracteres -> lanza `IllegalStateException`.
   - Segundo arranque con usuarios ya existentes en BD -> inicialización exitosa sin exigir variables.

### 4.2. Pruebas Automatizadas Frontend (`frontend/src/`)

1. **`services/api.auth.test.ts` (Cubre RF-001, RF-003, RF-008, RF-010):**
   - Prueba unitaria de `inventoryApi.ensureCsrf()` validando el handshake inicial.
   - Prueba de `inventoryApi.login()` validando el despacho con `Content-Type: application/json` y cabecera `X-XSRF-TOKEN`.
   - Prueba de captura de `401 Unauthorized` y deserialización de `ErrorResponse`.
   - Prueba de `inventoryApi.logout()` asegurando la limpieza de estado local.

2. **`components/LoginScreen.test.tsx` (Cubre RF-004, RF-005):**
   - Renderizado correcto del formulario de credenciales.
   - Bloqueo de envío ante campos vacíos con mensaje accesible.
   - Despliegue visual del mensaje de error unificado devuelto por el backend.

---

## 5. Matriz de Trazabilidad Requisitos vs Componentes

| Requisito EARS | Componente Técnico Responsable | Prueba Automatizada de Verificación |
|---|---|---|
| **RF-001** (CSRF Handshake) | `AuthController.csrf()`, `SecurityConfig` | `AuthCsrfIntegrationTest.testCsrfGeneration()` |
| **RF-002** (CSRF Reject 403) | `SpaCsrfTokenRequestHandler`, `SecurityConfig` | `AuthCsrfIntegrationTest.testMissingCsrfRejected()` |
| **RF-003** (Login JSON 200) | `JsonAuthenticationProcessing`, `LoginRequest` | `AuthLoginIntegrationTest.testLoginSuccess()` |
| **RF-004** (DTO Invalido 400) | `MethodArgumentNotValidException`, `ErrorResponse`| `AuthLoginIntegrationTest.testInvalidDtoPayload()` |
| **RF-005** (Credenciales Mal 401)| `SecurityConfig.authenticationEntryPoint()` | `AuthLoginIntegrationTest.testBadCredentials()` |
| **RF-006** (Cuenta Inactiva 401)| `UsuarioDetailsService`, `ErrorResponse` | `AuthLoginIntegrationTest.testInactiveUser()` |
| **RF-007** (Sesiones Múltiples) | `SecurityConfig.sessionManagement()` | `AuthLoginIntegrationTest.testConcurrentSessions()` |
| **RF-008** (Sesión `/me` 200) | `AuthController.currentUser()`, `UsuarioResponse`| `AuthLoginIntegrationTest.testGetCurrentUser()` |
| **RF-009** (Sin sesión `/me` 401)| `SecurityConfig.authenticationEntryPoint()` | `AuthLoginIntegrationTest.testUnauthenticatedMe()` |
| **RF-010** (Logout 200) | `SecurityConfig.logout()` | `AuthLoginIntegrationTest.testLogout()` |
| **RF-011** (Logout Idempotente)| `SecurityConfig.logout()` | `AuthLoginIntegrationTest.testLogoutWithoutSession()` |
| **RF-012** (RBAC y Rol Nulo) | `UsuarioDetailsService`, `RolUsuario` | `AuthRbacSecurityTest.testNullRoleDefaulting()` |
| **RF-013** (Vendedor Read/Venta)| `SecurityConfig.authorizeHttpRequests()` | `AuthRbacSecurityTest.testSellerAllowedEndpoints()` |
| **RF-014** (Vendedor Reject 403)| `SecurityConfig.authorizeHttpRequests()` | `AuthRbacSecurityTest.testSellerForbiddenMutations()`|
| **RF-015** (Admin Full Access) | `SecurityConfig.authorizeHttpRequests()` | `AuthRbacSecurityTest.testAdminFullAccess()` |
| **RF-016** (Sembrado Inicial) | `UsuariosIniciales` | `UsuariosInicialesTest.testInitialSeeding()` |
| **RF-017** (Arranque Subsecuente)| `UsuariosIniciales` | `UsuariosInicialesTest.testSubsequentStartup()` |
| **RF-018** (Perfil Test Aislado)| `application-test.properties` | `AuthLoginIntegrationTest.contextLoads()` |
