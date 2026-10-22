# Tareas de Implementación — Spec 001: Autenticación, Sesión y RBAC

Documento de desglose de tareas ordenadas por dependencia técnica (<30 min por tarea).
Cada tarea sigue el ciclo didáctico y de calidad estipulado en `.agents/skills/student-mentor/SKILL.md` y `docs/constitution.md`.

---

## Cadena de Dependencias

```
[Tarea 1: DTOs Base y Errores]
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
[Tarea 2: DTOs Autenticación]     [Tarea 3: Perfil Test Aislado]
       │                                 │
       ├─────────────────┬───────────────┤
       ▼                 ▼               ▼
[Tarea 4: CSRF & Handshake] [Tarea 5: UsuarioDetailsService] [Tarea 9: Sembrado Idempotente]
       │                         │
       └────────────┬────────────┘
                    ▼
       [Tarea 6: Login JSON & Sesión]
                    │
                    ▼
       [Tarea 7: /me & Logout Idempotente]
                    │
                    ├─────────────────────────────────┐
                    ▼                                 ▼
       [Tarea 8: RBAC & Control Acceso]  [Tarea 10: Cliente HTTP Frontend]
                                                      │
                                                      ▼
                                         [Tarea 11: UI LoginScreen]
                                                      │
                                                      ▼
                                         [Tarea 12: Verificación Integral]
```

---

## Desglose de Tareas (<30 min)

- [x] **Tarea 1: DTOs Base y Contrato Común de Errores**
  - **Estimación:** ~20 min | **Dependencias:** Ninguna (Cimiento de contratos).
  - **Requisitos cubiertos:** RF-002, RF-004, RF-005, RF-006, RF-009, RF-014.
  - **Descripción:** Crear los records inmutables `ErrorResponse(error, message, timestamp)` y `CsrfResponse(ready)` en `dto/common/` y `dto/auth/`.
  - **Hecho cuando:** `.\mvnw.cmd test-compile` compila con éxito y una prueba unitaria confirma que `ErrorResponse` serializa exactamente la estructura JSON `{ "error": "...", "message": "...", "timestamp": ... }`.

- [x] **Tarea 2: DTOs de Autenticación (`LoginRequest` y `UsuarioResponse`)**
  - **Estimación:** ~20 min | **Dependencias:** Tarea 1.
  - **Requisitos cubiertos:** RF-003, RF-004, RF-008.
  - **Descripción:** Implementar `LoginRequest` con anotaciones Jakarta Validation (`@NotBlank`, `@Size`) y `UsuarioResponse(username, fullName, role)` desacoplado de entidades JPA.
  - **Hecho cuando:** `.\mvnw.cmd test-compile` compila sin errores y un test unitario con `Validator` confirma que payloads vacíos o con campos en blanco son rechazados con violaciones de validación.

- [x] **Tarea 3: Configuración de Aislamiento de Tests y Perfil `test`**
  - **Estimación:** ~25 min | **Dependencias:** Tarea 1.
  - **Requisitos cubiertos:** RF-018.
  - **Descripción:** Configurar `src/test/resources/application-test.properties` con base de datos en memoria (H2) y propiedades mock para ejecutar tests sin requerir PostgreSQL ni variables `ADMIN_*_PASSWORD`.
  - **Hecho cuando:** `.\mvnw.cmd test` ejecuta el contexto de prueba de Spring Boot sin fallos por variables de entorno faltantes ni conexión a base de datos externa.

- [x] **Tarea 4: TDD — Protección CSRF y Handshake (`/api/auth/csrf`)**
  - **Estimación:** ~30 min | **Dependencias:** Tarea 1, Tarea 3.
  - **Requisitos cubiertos:** RF-001, RF-002.
  - **Descripción:**
    1. *Rojo:* Crear `AuthCsrfIntegrationTest` validando `GET /api/auth/csrf` (emisión de cookie `XSRF-TOKEN` y `{ready: true}`) y rechazo `403` estructurado en mutaciones sin cabecera.
    2. *Verde:* Configurar `CookieCsrfTokenRepository`, `SpaCsrfTokenRequestHandler` y endpoint `/api/auth/csrf` en `AuthController`.
  - **Hecho cuando:** `.\mvnw.cmd test -Dtest=AuthCsrfIntegrationTest` pasa al 100% con estado verde.

- [x] **Tarea 5: TDD — Robustez en `UsuarioDetailsService` y Tolerancia Brownfield**
  - **Estimación:** ~25 min
  - **Dependencias:** Tarea 2, Tarea 3.
  - **Requisitos cubiertos:** RF-006, RF-012.
  - **Descripción:**
    1. *Rojo:* Crear pruebas para `UsuarioDetailsService` probando el bloqueo de usuarios inactivos (`activo = false`) y la asignación por defecto a `ROLE_VENDEDOR` cuando `rol == null`.
    2. *Verde:* Implementar en `UsuarioDetailsService` la normalización `toLowerCase().trim()` y la asignación defensiva de roles según el Principio 12.
  - **Hecho cuando:** Los tests unitarios de `UsuarioDetailsService` pasan verificando que las cuentas inactivas lanzan `DisabledException` y los roles nulos mapean a `VENDEDOR`.

- [ ] **Tarea 6: TDD — Login JSON con DTO y Manejo de Sesión (`POST /api/auth/login`)**
  - **Estimación:** ~30 min
  - **Dependencias:** Tarea 2, Tarea 4, Tarea 5.
  - **Requisitos cubiertos:** RF-003, RF-004, RF-005, RF-007.
  - **Descripción:**
    1. *Rojo:* Crear `AuthLoginIntegrationTest` para validar login con `application/json` (éxito 200 + cookie `JSESSIONID`), payload inválido (400) y credenciales incorrectas (401 con mensaje unificado).
    2. *Verde:* Implementar filtro/controlador de login JSON y configurar `AuthenticationEntryPoint` para retornar `ErrorResponse`.
  - **Hecho cuando:** `.\mvnw.cmd test -Dtest=AuthLoginIntegrationTest` pasa los casos de login exitoso, 400 Bad Request y 401 Unauthorized.

- [ ] **Tarea 7: TDD — Consulta de Sesión (`/me`) y Logout Idempotente**
  - **Estimación:** ~25 min
  - **Dependencias:** Tarea 6.
  - **Requisitos cubiertos:** RF-008, RF-009, RF-010, RF-011.
  - **Descripción:**
    1. *Rojo:* Agregar a `AuthLoginIntegrationTest` pruebas para `GET /api/auth/me` (200 con sesión, 401 sin sesión) y `POST /api/auth/logout` con sesión activa y sin sesión previa.
    2. *Verde:* Implementar endpoint `/me` devolviendo `UsuarioResponse` y handler de logout que limpie `JSESSIONID` y responda 200 OK de forma idempotente.
  - **Hecho cuando:** Los tests de `/me` y logout pasan al 100% en `.\mvnw.cmd test -Dtest=AuthLoginIntegrationTest`.

- [ ] **Tarea 8: TDD — Control de Acceso Basado en Roles (RBAC)**
  - **Estimación:** ~30 min
  - **Dependencias:** Tarea 6, Tarea 7.
  - **Requisitos cubiertos:** RF-013, RF-014, RF-015.
  - **Descripción:**
    1. *Rojo:* Crear `AuthRbacSecurityTest` probando que `VENDEDOR` tiene acceso a lecturas y ventas pero recibe `403 FORBIDDEN` estructurado al modificar catálogo/marcas, mientras que `ADMIN` tiene acceso total.
    2. *Verde:* Configurar `authorizeHttpRequests` y `AccessDeniedHandler` retornando `ErrorResponse` uniforme.
  - **Hecho cuando:** `.\mvnw.cmd test -Dtest=AuthRbacSecurityTest` pasa al 100% sin excepciones de seguridad no controladas.

- [ ] **Tarea 9: TDD — Sembrado Inicial Idempotente y No Bloqueante (`UsuariosIniciales`)**
  - **Estimación:** ~25 min
  - **Dependencias:** Tarea 3, Tarea 5.
  - **Requisitos cubiertos:** RF-016, RF-017.
  - **Descripción:**
    1. *Rojo:* Crear `UsuariosInicialesTest` que valide el fallo por variables faltantes en BD vacía y el inicio transparente sin variables cuando los administradores ya existen.
    2. *Verde:* Refactorizar `UsuariosIniciales` para chequear la existencia previa de los registros antes de validar las variables de entorno.
  - **Hecho cuando:** `.\mvnw.cmd test -Dtest=UsuariosInicialesTest` pasa confirmando la idempotencia en reinicios.

- [ ] **Tarea 10: Integración Frontend — Cliente HTTP (`api.ts`) y Contratos JSON**
  - **Estimación:** ~30 min
  - **Dependencias:** Tarea 4, Tarea 6, Tarea 7.
  - **Requisitos cubiertos:** RF-001, RF-003, RF-008, RF-010.
  - **Descripción:**
    1. Actualizar `frontend/src/services/api.ts` para enviar login con `application/json` y cabecera `X-XSRF-TOKEN`.
    2. Manejar captura de `ErrorResponse` y tipado de `UsuarioResponse`.
    3. Crear prueba unitaria frontend `frontend/src/services/api.auth.test.ts`.
  - **Hecho cuando:** `npm --prefix frontend run build` compila con 0 errores de TypeScript y las pruebas unitarias del cliente pasan limpiamente.

- [ ] **Tarea 11: Integración Frontend — Pantalla de Login (`LoginScreen.tsx`)**
  - **Estimación:** ~25 min
  - **Dependencias:** Tarea 10.
  - **Requisitos cubiertos:** RF-004, RF-005.
  - **Descripción:**
    1. Actualizar `LoginScreen.tsx` para manejar estados de validación local previa, bloqueo de doble clic y visualización del mensaje de error unificado.
    2. Crear prueba en `LoginScreen.test.tsx`.
  - **Hecho cuando:** `npm --prefix frontend run lint` reporta 0 advertencias y la prueba de formulario pasa.

- [ ] **Tarea 12: Verificación Integral End-to-End y Cierre de Módulo 001**
  - **Estimación:** ~20 min
  - **Dependencias:** Tareas 1 a 11.
  - **Requisitos cubiertos:** RF-001 al RF-018 (Completitud total).
  - **Descripción:**
    1. Ejecutar la suite completa de backend: `.\mvnw.cmd test`.
    2. Ejecutar la suite y build de frontend: `npm --prefix frontend run lint` y `npm --prefix frontend run build`.
    3. Validación del cumplimiento de los 12 principios de `docs/constitution.md`.
  - **Hecho cuando:** Todas las suites de pruebas backend y frontend pasan con éxito y `git status` muestra un estado limpio y listo para commit.
