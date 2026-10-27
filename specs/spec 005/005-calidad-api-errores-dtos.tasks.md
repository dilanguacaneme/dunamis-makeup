# Desglose de Tareas de Implementación — Spec 005: Calidad de API, DTOs Universales y Manejo Global Estandarizado de Errores

Este documento desglosa los requisitos de la [especificación](005-calidad-api-errores-dtos.spec.md) y el [plan técnico](005-calidad-api-errores-dtos.plan.md) en tareas atómicas y verificables, agrupadas para optimizar el flujo de trabajo sin comprometer la integridad del sistema.

---

## Matriz de Tareas

| Tarea | Módulo / Componente | Requisitos Funcionales Cubiertos | Estimación |
|---|---|---|---|
| **Tarea 1** | Refactorización de paquete y jerarquía de excepciones de dominio | RF-001, RF-002 | ~15 min |
| **Tarea 2** | Enriquecimiento de `ErrorResponse` y manejador global (`@RestControllerAdvice`) | RF-003, RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-010 | ~20 min |
| **Tarea 3** | Desacoplamiento estricto de controladores y eliminación de entidades JPA en capa Web | RF-011, RF-012, RF-013, RF-014 | ~15 min |
| **Tarea 4** | Verificación integral MockMvc, consistencia de API, frontend y cierre de Spec 005 | RF-015 y Definition of Done | ~15 min |

---

## Detalle de Tareas

- [ ] **Tarea 1: Refactorización de Paquete y Jerarquía de Excepciones de Dominio**
  - **Estimación:** ~15 min
  - **Dependencias:** Ninguna (base del Nivel 5).
  - **Requisitos cubiertos:** RF-001, RF-002.
  - **Descripción:**
    1. Crear el paquete oficial `com.dunamis.makeup.exception` con nomenclatura en minúsculas estándar.
    2. Crear la clase base `DunamisException` y las excepciones de dominio:
       - `RecursoNoEncontradoException` (con constructor para nombre de recurso e ID).
       - `ReglaNegocioException` (para violaciones de parámetros o lógica de catálogo/stock).
       - `ConflictoEstadoException` (para conflictos de estado y concurrencia).
    3. Migrar y actualizar `ProductoInsuficienteException`, `InventarioVacioException` y `ProductoNoEncontradoException` para que residan en `com.dunamis.makeup.exception`.
    4. Actualizar todos los imports en los servicios (`FacturaService`, `ProductoService`, `MarcaService`), controladores y pruebas unitarias.
    5. Eliminar completamente el directorio residual `com.dunamis.makeup.Exeption`.
  - **Hecho cuando:** `.\mvnw.cmd test-compile` compila limpiamente sin referencias a `com.dunamis.makeup.Exeption` y los tests de unidad existentes continúan pasando.

---

- [ ] **Tarea 2: Enriquecimiento de `ErrorResponse` y Manejador Global (`@RestControllerAdvice`)**
  - **Estimación:** ~20 min
  - **Dependencias:** Tarea 1.
  - **Requisitos cubiertos:** RF-003, RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-010.
  - **Descripción:**
    1. Actualizar `com.dunamis.makeup.dto.common.ErrorResponse` agregando `Map<String, String> detalles` opcional anotado con `@JsonInclude(JsonInclude.Include.NON_NULL)` para total retrocompatibilidad.
    2. Ampliar `GlobalExceptionHandler` para interceptar de forma centralizada:
       - `MethodArgumentNotValidException`: Mapeo a HTTP 400 con mapa ordenado de errores por campo en `detalles`.
       - `HttpMessageNotReadableException` y `MethodArgumentTypeMismatchException`: Mapeo a HTTP 400 con mensajes seguros en español.
       - `RecursoNoEncontradoException`: Mapeo a HTTP 404 con mensaje descriptivo.
       - `ReglaNegocioException`: Mapeo a HTTP 400 con mensaje descriptivo.
       - `ConflictoEstadoException` y `ProductoInsuficienteException`: Mapeo a HTTP 409 Conflict.
       - `DataIntegrityViolationException`: Mapeo a HTTP 409 con mensaje seguro y supresión de SQL sensible.
       - `AccessDeniedException`: Mapeo a HTTP 403 Forbidden estandarizado en JSON.
       - `Exception.class` (fallback 500): Registro del log en servidor y retorno de HTTP 500 JSON estandarizado sin texto plano.
    3. Implementar suite de pruebas unitarias/integración para `GlobalExceptionHandler`.
  - **Hecho cuando:** Todas las excepciones mapean a sus respectivos códigos HTTP con JSON estructurado `{ error, message, timestamp, detalles? }` y la suite de tests de excepciones pasa al 100%.

---

- [ ] **Tarea 3: Desacoplamiento Estricto de Controladores y Eliminación de Entidades JPA en Capa Web**
  - **Estimación:** ~15 min
  - **Dependencias:** Tareas 1 y 2.
  - **Requisitos cubiertos:** RF-011, RF-012, RF-013, RF-014.
  - **Descripción:**
    1. Refactorizar `MarcaController`:
       - Eliminar la firma con comodín `ResponseEntity<?>` y las respuestas manuales de `ErrorResponse.of(...)`.
       - Tipar estrictamente `public ResponseEntity<List<MarcaResponse>> listar(...)`.
       - Si un vendedor solicita marcas inactivas, lanzar `AccessDeniedException` o delegar en la seguridad para que el `@RestControllerAdvice` responda HTTP 403 de forma natural.
    2. Refactorizar `ProductoController`:
       - Eliminar las instancias de `throw new ResponseStatusException(...)`.
       - Reemplazar las validaciones por lanzamiento de `ReglaNegocioException` o `RecursoNoEncontradoException`.
       - Garantizar que ningún método reciba ni retorne entidades JPA.
    3. Auditar `FacturaController` y `AuthController` para confirmar el cumplimiento del Principio 2 (100% DTOs).
  - **Hecho cuando:** No existe ninguna instancia de `ResponseStatusException` ni retornos con comodín `<?>` en los controladores, y todos los endpoints operan exclusivamente con DTOs validados.

---

- [ ] **Tarea 4: Verificación Integral MockMvc, Consistencia de API, Frontend y Cierre de Spec 005**
  - **Estimación:** ~15 min
  - **Dependencias:** Tareas 1, 2 y 3.
  - **Requisitos cubiertos:** RF-015 y Definition of Done completa.
  - **Descripción:**
    1. Ejecutar la suite completa de pruebas del backend (`.\mvnw.cmd test`) asegurando cero regresiones en los 152 tests existentes y agregando pruebas para los nuevos manejadores.
    2. Ejecutar el linter y compilación de producción del frontend (`npm --prefix frontend run lint` y `npm --prefix frontend run build`).
    3. Verificar que el cliente frontend `api.ts` procese los mensajes de error sin fallos.
    4. Actualizar `docs/checklist-sdd.md` marcando los ítems de **Nivel 5 — Módulo 005: Calidad de API, DTOs y Manejo Global de Errores** como completados `[x]`.
  - **Hecho cuando:** Todas las pruebas pasan limpiamente, no hay advertencias ni errores en backend ni frontend, y el árbol de git en `intregacion-sdd` está limpio.
