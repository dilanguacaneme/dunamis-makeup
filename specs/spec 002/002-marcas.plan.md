# Plan de Implementación Técnica — Spec 002: Catálogo y Gestión de Marcas

## 1. Módulos y Arquitectura de la Solución

El sistema se estructura en capas desacopladas para backend (Spring Boot 4 / Java 17) y frontend (React 19 / TypeScript) interactuando a través de contratos tipados, sesiones con cookies y protección CSRF:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Frontend SPA (React 19)                         │
│  - src/components/BrandManagementView.tsx (Listado, filtros, toggles)  │
│  - src/components/BrandManagementModal.tsx (Gestión rápida modal)      │
│  - src/services/api.ts (Cliente HTTP: GET /marcas, POST, PATCH)        │
│  - src/services/demoStore.ts (Persistencia local offline coordinada)   │
│  - src/types/index.ts (Contratos TypeScript: Marca, MarcaInput)        │
└────────────────────────────────▲───────────────────────────────────────┘
                                 │ HTTP REST (JSON DTOs + Cookie JSESSIONID + Header X-XSRF-TOKEN)
┌────────────────────────────────▼───────────────────────────────────────┐
│                      Backend Spring Boot (Java 17)                     │
│  - controller/MarcaController.java (Endpoints /marcas con DTOs)        │
│  - dto/marca/MarcaResponse.java (DTO inmutable de salida)              │
│  - dto/marca/CrearMarcaRequest.java (DTO validado de creación)         │
│  - dto/marca/ActualizarMarcaRequest.java (DTO validado de mutación)    │
│  - service/MarcaService.java (Lógica de negocio, unicidad, estados)   │
│  - service/MarcasIniciales.java (Sembrado idempotente no destructivo)  │
│  - repository/MarcaRepository.java (Consultas ordenadas y por nombre)  │
│  - config/SecurityConfig.java (Reglas de autorización RBAC /marcas/**) │
│  - exception/GlobalExceptionHandler.java (Respuestas de error 4xx/5xx) │
└────────────────────────────────────────────────────────────────────────┘
```

### Cobertura de Requisitos Funcionales por Módulo Técnico:
- **`dto/marca/*` (Contratos DTO):** Cubre **RF-001, RF-006, RF-007, RF-010, RF-011** (Principio 2 de la Constitución).
- **`controller/MarcaController`:** Cubre **RF-002, RF-003, RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-010, RF-011, RF-012, RF-013**.
- **`service/MarcaService`:** Cubre **RF-002, RF-003, RF-006, RF-008, RF-010, RF-014, RF-015** (Integridad de catálogo y normalización).
- **`repository/MarcaRepository`:** Cubre **RF-002, RF-003, RF-006, RF-008, RF-010**.
- **`service/MarcasIniciales`:** Cubre **RF-016** (Sembrado idempotente).
- **`config/SecurityConfig` & `GlobalExceptionHandler`:** Cubre **RF-004, RF-005, RF-009, RF-013, RF-014** (Principio 3 y 11).
- **`frontend/src/services/api.ts` & `src/types/index.ts`:** Cubre **RF-001, RF-002, RF-003, RF-006, RF-010**.
- **`frontend/src/components/BrandManagementView.tsx` & `BrandManagementModal.tsx`:** Cubre **RF-017, RF-018** (Principio 9).
- **`frontend/src/services/demoStore.ts`:** Cubre **RF-019** (Paridad local offline).

---

## 2. Modelo de Datos y Contratos de Comunicación

### 2.1. Entidad de Persistencia JPA (PostgreSQL)
Entidad `Marca` (tabla `marcas`):
- `id`: `Long` (Clave primaria autoincremental `IDENTITY`).
- `nombre`: `String` (`VARCHAR(80)`, no nulo, índice único `UNIQUE`).
- `activa`: `Boolean` (`BOOLEAN`, no nulo, default `true`).
- **Relaciones:** Relación 1:N pasiva con `Producto` (`@ManyToOne` en `Producto` hacia `Marca`).
- **Restricción de Integridad (Principio 5):** No existe borrado en cascada ni borrado físico. La columna `activa` controla el ciclo de vida operativo de la marca.

### 2.2. Contratos DTO de Entrada y Salida (Principio 2 de la Constitución)
1. **`MarcaResponse` (Salida inmutable desacoplada de JPA):**
   ```java
   public record MarcaResponse(
       Long id,
       String nombre,
       Boolean activa
   ) {}
   ```
2. **`CrearMarcaRequest` (Payload `POST /marcas`):**
   ```java
   public record CrearMarcaRequest(
       @NotBlank(message = "El nombre de la marca es obligatorio")
       @Size(min = 2, max = 80, message = "El nombre de la marca debe tener entre 2 y 80 caracteres")
       String nombre
   ) {}
   ```
3. **`ActualizarMarcaRequest` (Payload `PATCH /marcas/{id}`):**
   ```java
   public record ActualizarMarcaRequest(
       @Size(min = 2, max = 80, message = "El nombre de la marca debe tener entre 2 y 80 caracteres")
       String nombre,
       Boolean activa
   ) {
       @AssertTrue(message = "Debe especificar al menos un campo para actualizar ('nombre' o 'activa')")
       public boolean isAnyFieldPresent() {
           return (nombre != null && !nombre.isBlank()) || activa != null;
       }
   }
   ```
4. **`ErrorResponse` (Salida uniforme de error 4xx/5xx — Principio 11):**
   ```java
   public record ErrorResponse(
       String error,
       String message,
       long timestamp
   ) {}
   ```

### 2.3. Especificación de Endpoints HTTP y Seguridad
- **`GET /marcas`:**
  - Consulta marcas activas (`activa = true`) en orden alfabético.
  - Roles autorizados: `ADMIN`, `VENDEDOR`. Requiere sesión activa (`JSESSIONID`).
- **`GET /marcas?incluirInactivas=true`:**
  - Consulta la totalidad de marcas (activas e inactivas) en orden alfabético.
  - Roles autorizados: Exclusivamente `ADMIN`. Si es invocado por `VENDEDOR`, responde `403 FORBIDDEN`.
- **`POST /marcas`:**
  - Crea una nueva marca activa normalizada.
  - Roles autorizados: Exclusivamente `ADMIN`. Requiere `X-XSRF-TOKEN` y sesión activa.
- **`PATCH /marcas/{id}`:**
  - Actualiza parcialmente el nombre o alterna el estado `activa`.
  - Roles autorizados: Exclusivamente `ADMIN`. Requiere `X-XSRF-TOKEN` y sesión activa.
- **`DELETE /marcas/**`:**
  - Prohibido y no implementado por la Constitución (Principio 5).

---

## 3. Decisiones Técnicas Justificadas y Alternativas Descartadas

### Decisión 1: Erradicación de Entidades JPA en el Controlador y Adopción Exclusiva de DTOs
- **Decisión:** Reemplazar el retorno y recepción de `Marca` en `MarcaController` por los DTOs inmutables `MarcaResponse`, `CrearMarcaRequest` y `ActualizarMarcaRequest`.
- **Justificación:** Cumple de manera no negociable con el **Principio 2 de la Constitución** ("Comunicación exclusiva con DTOs validados; no exponer entidades JPA directamente"). Previene ataques de sobre-asignación (*Mass Assignment*) en los que un cliente malicioso intente modificar atributos internos (como el `id` o estados no permitidos) y desacopla la capa web de la persistencia de Hibernate.
- **Alternativa Descartada:** Mantener la entidad `Marca` como cuerpo de solicitud y respuesta usando `@JsonIgnore` o validaciones sobre la entidad. *Descartada por violar directamente la Constitución, acoplar la base de datos a los clientes HTTP y ensuciar la entidad de dominio con lógica de transporte.*
- **Requisitos cubiertos:** **RF-001, RF-006, RF-007, RF-010, RF-011**.

---

### Decisión 2: Consulta de Inactivas Mediante Query Parameter con RBAC Estricto
- **Decisión:** Habilitar el parámetro opcional `GET /marcas?incluirInactivas=true`, interceptando la petición si el rol es `VENDEDOR` para responder inmediatamente `403 FORBIDDEN` con el cuerpo uniforme `ErrorResponse`.
- **Justificación:** Respeta las convenciones REST estándar sobre colecciones de recursos (`/marcas`) sin crear endpoints redundantes. Aplicar rechazo estricto con `403` al vendedor (en lugar de ignorar silenciosamente el parámetro) cumple con el principio de mínima sorpresa y previene fallos silenciosos de seguridad.
- **Alternativa Descartada A:** Crear un endpoint independiente como `GET /marcas/todas` o `GET /marcas/admin`. *Descartada por fragmentar el recurso canónico de marcas en múltiples URIs y complicar el cliente frontend.*
- **Alternativa Descartada B:** Ignorar silenciosamente el parámetro `incluirInactivas=true` cuando quien consulta es un vendedor, devolviendo solo activas con `200 OK`. *Descartada porque oculta una violación de autorización en lugar de alertarla explícitamente conforme al Principio 11.*
- **Requisitos cubiertos:** **RF-002, RF-003, RF-004**.

---

### Decisión 3: Prohibición Absoluta de Borrado Físico y Gestión por Borrado Lógico
- **Decisión:** No proveer ningún endpoint `DELETE /marcas/{id}`. La única forma de retirar una marca del flujo comercial es actualizar `activa = false` mediante `PATCH /marcas/{id}`.
- **Justificación:** Garantiza el **Principio 5 de la Constitución** ("Persistencia e Integridad: Prohibido borrado físico"). Dado que las marcas están enlazadas a productos y estos a facturas, un borrado físico en PostgreSQL provocaría un error `DataIntegrityViolationException` (500) o rompería el historial contable de ventas.
- **Alternativa Descartada:** Implementar un endpoint `DELETE` que internamente hiciera el borrado lógico. *Descartada porque confunde la semántica HTTP: el borrado lógico es una modificación de estado (`PATCH`), no una destrucción de recurso (`DELETE`). Omitir el método DELETE elimina cualquier riesgo accidental de borrado.*
- **Requisitos cubiertos:** **RF-014, RF-015**.

---

### Decisión 4: Normalización Canónica de Nombres y Unicidad Insensible a Mayúsculas/Espacios
- **Decisión:** Al recibir un nombre de marca (en creación o renombrado), el sistema aplica `trim()`, colapsa secuencias de múltiples espacios en blanco internos a un único espacio (`name.replaceAll("\\s+", " ")`) y valida la unicidad contra la base de datos mediante `findByNombreIgnoreCase`.
- **Justificación:** Evita colisiones confusas en el mostrador de ventas donde un vendedor podría registrar "Trendy " o "TRENDY" como marcas diferentes a "Trendy", causando catálogos fragmentados y errores en reportes de ventas mensuales.
- **Alternativa Descartada:** Confiar únicamente en la restricción `UNIQUE` a nivel de PostgreSQL. *Descartada porque PostgreSQL por defecto distingue mayúsculas y minúsculas en columnas `VARCHAR`, permitiendo duplicados lógicos como 'Trendy' y 'trendy'.*
- **Requisitos cubiertos:** **RF-006, RF-008, RF-010**.

---

### Decisión 5: Estandarización de Excepciones de Negocio con `GlobalExceptionHandler`
- **Decisión:** Manejar colisiones de nombre (409), marcas no encontradas (404), validaciones fallidas (400) y denegaciones de acceso (403) a través de un `@RestControllerAdvice` uniforme que emita `ErrorResponse(error, message, timestamp)`.
- **Justificación:** Cumple el **Principio 11 de la Constitución** ("Fallas de API responden en JSON estructurado; cero texto plano"). Elimina el uso heterogéneo de `ResponseStatusException` de Spring que produce estructuras dispares entre controladores.
- **Alternativa Descartada:** Seguir lanzando `ResponseStatusException(HttpStatus.CONFLICT, "...")` directamente en el servicio. *Descartada porque Spring añade atributos por defecto (`path`, `status`) que no concuerdan con el contrato formal de error acordado en la Spec 001.*
- **Requisitos cubiertos:** **RF-004, RF-007, RF-008, RF-009, RF-011, RF-012, RF-013**.

---

### Decisión 6: Toggle Bidireccional de Marcas y Filtro Unificado en la UI
- **Decisión:** En `BrandManagementView.tsx`, agregar un control de pestañas/filtro ("Activas" / "Todas las marcas") visible para administradoras, y un botón de acción "Reactivar" para registros con `activa: false`.
- **Justificación:** Corrige la limitación crítica detectada en QA donde desactivar una marca causaba que desapareciera del frontend, requiriendo intervención manual en la base de datos para restaurarla.
- **Alternativa Descartada:** Crear una pantalla separada de "Papelera de Reciclaje de Marcas". *Descartada por sobrecarga cognitiva y mayor complejidad de mantenimiento frente a un filtro integrado en la misma vista.*
- **Requisitos cubiertos:** **RF-017, RF-018**.

---

## 4. Estrategia de Pruebas Automatizadas

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Estrategia de Tests SDD                         │
├────────────────────────────────┬───────────────────────────────────────┤
│ Backend (Spring Boot + MockMvc)│ Frontend (Vitest / Client Tests)      │
├────────────────────────────────┼───────────────────────────────────────┤
│ - MarcaIntegrationTest         │ - services/api.marcas.test.ts         │
│ - MarcaRbacSecurityTest        │ - components/BrandManagementView.test │
│ - MarcaServiceTest (Unitario)  │                                       │
│ - MarcasInicialesTest          │                                       │
└────────────────────────────────┴───────────────────────────────────────┘
```

### 4.1. Pruebas de Integración Backend (`src/test/java/com/dunamis/makeup/`)

1. **`MarcaIntegrationTest` (MockMvc + H2 en memoria):**
   - **`GET /marcas` (Solo Activas):** Consulta con sesión de `ADMIN` y `VENDEDOR`. Verifica HTTP 200, orden alfabético ascendente y exclusión de marcas con `activa = false`.
   - **`GET /marcas?incluirInactivas=true` (ADMIN):** Verifica HTTP 200 y presencia tanto de marcas activas como inactivas.
   - **`GET /marcas` (No autenticado):** Verifica HTTP 401 estructurado (`UNAUTHORIZED`).
   - **`POST /marcas` (Creación Exitosa):** Envío de `CrearMarcaRequest` con sesión `ADMIN` y token CSRF. Verifica HTTP 201 y DTO `MarcaResponse` con `activa: true`.
   - **`POST /marcas` (Normalización):** Envío con espacios redundantes `"  Trendy   "` -> Verifica guardado como `"Trendy"`.
   - **`POST /marcas` (Duplicado 409):** Intento de creación con nombre idéntico o variando mayúsculas/minúsculas (`"trendy"`) -> Verifica HTTP 409 y código `"CONFLICT"`.
   - **`POST /marcas` (Validación DTO 400):** Envío de nombre en blanco, vacío o > 80 caracteres -> Verifica HTTP 400 y código `"BAD_REQUEST"`.
   - **`PATCH /marcas/{id}` (Renombrado Exitoso):** Actualización de nombre a uno disponible -> Verifica HTTP 200 y nuevo nombre.
   - **`PATCH /marcas/{id}` (Renombrado Idempotente):** Envío del mismo nombre actual -> Verifica HTTP 200 sin arrojar conflicto.
   - **`PATCH /marcas/{id}` (Toggle Desactivación y Reactivación):** Cambio de `activa: false` y luego `activa: true` -> Verifica HTTP 200 y actualización de bandera.
   - **`PATCH /marcas/{id}` (Payload Vacío 400):** Envío de `{}` sin nombre ni estado -> Verifica HTTP 400 `"BAD_REQUEST"`.
   - **`PATCH /marcas/{id}` (No Encontrada 404):** Invocación con ID inexistente -> Verifica HTTP 404 `"NOT_FOUND"`.

2. **`MarcaRbacSecurityTest` (Restricciones de Roles):**
   - **`GET /marcas?incluirInactivas=true` (VENDEDOR):** Verifica rechazo con HTTP 403 estructurado (`FORBIDDEN`).
   - **`POST /marcas` (VENDEDOR):** Verifica rechazo con HTTP 403 estructurado sin ejecutar lógica de creación.
   - **`PATCH /marcas/{id}` (VENDEDOR):** Verifica rechazo con HTTP 403 estructurado.

3. **`MarcaServiceTest` (Pruebas Unitarias con Mockito):**
   - Prueba unitaria de sanitización de cadenas y colapso de espacios múltiples.
   - Verificación de comportamiento cuando el repositorio reporta duplicados insensibles a mayúsculas.
   - Mapeo bidireccional entre entidad `Marca` y `MarcaResponse`.

4. **`MarcasInicialesTest` (Sembrado Idempotente):**
   - Ejecución del seeder en base de datos vacía -> Crea las 4 marcas ("Trendy", "Purpure", "Milagros", "Magna").
   - Ejecución del seeder en base de datos que ya contiene alguna marca inactiva -> Respeta el estado inactivo sin alterarlo ni duplicar.

### 4.2. Pruebas Automatizadas Frontend (`frontend/src/`)

1. **`services/api.marcas.test.ts`:**
   - Verificación de llamada a `GET /marcas` con y sin `incluirInactivas`.
   - Verificación de envío de `POST /marcas` con cabecera `X-XSRF-TOKEN` y normalización local.
   - Manejo tipado de errores 409 (Conflicto de nombre) y 403 (Permisos insuficientes).

2. **`components/BrandManagementView.test.tsx`:**
   - Renderizado inicial mostrando solo marcas activas.
   - Interacción con el selector de filtro "Todas las marcas": verificación de despacho de llamada con `incluirInactivas=true`.
   - Visualización de la etiqueta "Inactiva" y botón "Reactivar" para marcas deshabilitadas.
   - Confirmación previa antes de ejecutar la desactivación de una marca.
   - Restricción de interfaz: los controles de mutación se ocultan ante una sesión con rol `VENDEDOR`.

3. **`services/demoStore.test.ts`:**
   - Verificación del comportamiento del catálogo local en memoria simulando las reglas de la API (unicidad, toggle de `activa`, y filtrado por parámetro).

---

## 5. Matriz de Trazabilidad Requisitos vs Componentes

| Requisito EARS | Componente Técnico Responsable | Prueba Automatizada de Verificación |
|---|---|---|
| **RF-001** (Contratos DTO Inmutables) | `dto/marca/MarcaResponse`, `CrearMarcaRequest`, `ActualizarMarcaRequest` | `MarcaDtoTest.testSerialization()` |
| **RF-002** (Listar Activas 200) | `MarcaController.listarMarcas()`, `MarcaService` | `MarcaIntegrationTest.testListarSoloActivas()` |
| **RF-003** (Listar Todas Admin 200) | `MarcaController.listarMarcas(incluirInactivas=true)` | `MarcaIntegrationTest.testListarTodasAdmin()` |
| **RF-004** (Vendedor Inactivas 403) | `MarcaController`, `SecurityConfig` | `MarcaRbacSecurityTest.testVendedorNoPuedeVerInactivas()` |
| **RF-005** (No Autenticado 401) | `SecurityConfig.authorizeHttpRequests()` | `MarcaIntegrationTest.testNoAutenticado401()` |
| **RF-006** (Crear Marca Admin 201) | `MarcaController.crearMarca()`, `MarcaService` | `MarcaIntegrationTest.testCrearMarcaExitosa()` |
| **RF-007** (Payload Invalido 400) | `MethodArgumentNotValidException`, `GlobalExceptionHandler` | `MarcaIntegrationTest.testCrearMarcaPayloadInvalido()` |
| **RF-008** (Nombre Duplicado 409) | `MarcaService.crearMarca()`, `GlobalExceptionHandler` | `MarcaIntegrationTest.testCrearMarcaDuplicada409()` |
| **RF-009** (Crear Vendedor 403) | `SecurityConfig.authorizeHttpRequests()` | `MarcaRbacSecurityTest.testVendedorNoPuedeCrearMarca()` |
| **RF-010** (Actualizar Marca Admin 200)| `MarcaController.actualizarMarca()`, `MarcaService` | `MarcaIntegrationTest.testActualizarMarcaExitosa()` |
| **RF-011** (Patch Vacio 400) | `ActualizarMarcaRequest`, `GlobalExceptionHandler` | `MarcaIntegrationTest.testPatchVacio400()` |
| **RF-012** (Marca No Encontrada 404) | `MarcaService.actualizarMarca()`, `GlobalExceptionHandler` | `MarcaIntegrationTest.testActualizarMarcaInexistente404()` |
| **RF-013** (Actualizar Vendedor 403) | `SecurityConfig.authorizeHttpRequests()` | `MarcaRbacSecurityTest.testVendedorNoPuedeActualizar()` |
| **RF-014** (Prohibición Borrado Físico)| `MarcaController` (ausencia de `@DeleteMapping`) | `MarcaIntegrationTest.testDeleteMethodNotAllowed()` |
| **RF-015** (Integridad con Productos) | `MarcaService`, `ProductoService` | `MarcaIntegrationTest.testIntegridadMarcaInactiva()` |
| **RF-016** (Sembrado Idempotente) | `MarcasIniciales` | `MarcasInicialesTest.testSembradoIdempotente()` |
| **RF-017** (UI Filtros y Reactivación) | `BrandManagementView.tsx`, `api.ts` | `BrandManagementView.test.tsx` |
| **RF-018** (UI Ocultar Acciones Vendedor)| `BrandManagementView.tsx`, `Sidebar.tsx` | `BrandManagementView.test.tsx` |
| **RF-019** (Modo Demostración Local) | `demoStore.ts` | `demoStore.marcas.test.ts` |
