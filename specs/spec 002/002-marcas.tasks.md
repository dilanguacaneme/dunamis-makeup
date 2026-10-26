# Tareas de Implementación — Spec 002: Catálogo y Gestión de Marcas

Documento de desglose de tareas ordenadas por dependencia técnica (<30 min por tarea), agrupadas en la **menor cantidad de tareas posibles** para maximizar la agilidad del ciclo de desarrollo sin comprometer los estándares de calidad de `docs/constitution.md` y `specs/spec 002/002-marcas.spec.md`.

---

## Cadena de Dependencias

```
[Tarea 1: DTOs Tipados y Mapeo Centralizado de Errores]
       │
       ▼
[Tarea 2: Lógica de Servicio, Normalización y Sembrado Idempotente]
       │
       ▼
[Tarea 3: Endpoints REST, RBAC y Pruebas MockMvc Backend]
       │
       ▼
[Tarea 4: Frontend UI, Filtro de Inactivas, Reactivación y Modo Demo]
       │
       ▼
[Tarea 5: Verificación Integral E2E y Cierre de Spec 002]
```

---

## Desglose de Tareas (<30 min)

- [x] **Tarea 1: DTOs Tipados y Mapeo Centralizado de Errores**
  - **Estimación:** ~20-25 min
  - **Dependencias:** Ninguna (Cimiento de contratos).
  - **Requisitos cubiertos:** RF-001, RF-007, RF-011.
  - **Descripción:**
    1. *Rojo:* Crear `MarcaDtoTest` verificando que `CrearMarcaRequest` rechaza nombres en blanco o > 80 caracteres, `ActualizarMarcaRequest` rechaza payloads vacíos donde `nombre` y `activa` son nulos, y `MarcaResponse` expone exactamente `{ id, nombre, activa }` desacoplado de Hibernate.
    2. *Verde:* Implementar los records inmutables `MarcaResponse`, `CrearMarcaRequest` y `ActualizarMarcaRequest` en `com.dunamis.makeup.dto.marca`.
    3. Asegurar que las violaciones de validación Jakarta (`MethodArgumentNotValidException`) se canalicen a través de `ErrorResponse` uniforme con código `"BAD_REQUEST"`.
  - **Hecho cuando:** `.\mvnw.cmd test -Dtest=MarcaDtoTest` pasa al 100% y `.\mvnw.cmd test-compile` compila limpiamente sin errores.

- [x] **Tarea 2: Lógica de Servicio, Normalización Canónica y Sembrado Idempotente**
  - **Estimación:** ~25-30 min
  - **Dependencias:** Tarea 1.
  - **Requisitos cubiertos:** RF-006, RF-008, RF-010, RF-014, RF-015, RF-016.
  - **Descripción:**
    1. *Rojo:* Crear `MarcaServiceTest` y `MarcasInicialesTest` validando:
       - Normalización de nombres (`trim()` y colapso de espacios múltiples internos a uno solo).
       - Rechazo con excepción de conflicto (409) ante duplicados insensibles a mayúsculas/minúsculas (`findByNombreIgnoreCase`).
       - Actualización idempotente si el nombre no cambia.
       - Toggle de activación (`activa: true/false`) sin borrado físico.
       - Sembrado inicial en `MarcasIniciales` que no sobreescribe ni duplica marcas existentes o inactivas.
    2. *Verde:* Refactorizar `MarcaService` para operar con DTOs y normalización estricta, y asegurar la idempotencia no destructiva en `MarcasIniciales`.
  - **Hecho cuando:** `.\mvnw.cmd test -Dtest=MarcaServiceTest,MarcasInicialesTest` pasa limpiamente con 0 fallos.

- [x] **Tarea 3: Endpoints REST (`GET`, `POST`, `PATCH`), RBAC y Pruebas MockMvc**
  - **Estimación:** ~25-30 min
  - **Dependencias:** Tarea 1, Tarea 2.
  - **Requisitos cubiertos:** RF-002, RF-003, RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-010, RF-011, RF-012, RF-013, RF-014.
  - **Descripción:**
    1. *Rojo:* Crear `MarcaIntegrationTest` y `MarcaRbacSecurityTest` con `MockMvc` cubriendo:
       - `GET /marcas` retorna solo activas en orden alfabético para `ADMIN` y `VENDEDOR`.
       - `GET /marcas?incluirInactivas=true` retorna activas e inactivas para `ADMIN`, pero rechaza con `403 Forbidden` estructurado para `VENDEDOR`.
       - `POST /marcas` crea marca activa retornando 201 y DTO `MarcaResponse` para `ADMIN`, y rechaza con 403 para `VENDEDOR` o 400 ante payload inválido.
       - `PATCH /marcas/{id}` permite actualizar nombre y alternar `activa` para `ADMIN`, rechazando con 404 ante ID inexistente, 400 ante payload vacío y 403 para `VENDEDOR`.
       - Ausencia de `@DeleteMapping`: peticiones HTTP `DELETE /marcas/**` son rechazadas (405 Method Not Allowed).
       - Peticiones no autenticadas devuelven `401 Unauthorized` estructurado.
    2. *Verde:* Adaptar `MarcaController` y las reglas de `SecurityConfig` para satisfacer todos los casos de prueba con respuestas tipadas en DTOs.
  - **Hecho cuando:** `.\mvnw.cmd test -Dtest=MarcaIntegrationTest,MarcaRbacSecurityTest` pasa al 100% en verde sobre base de datos H2 en memoria.

- [ ] **Tarea 4: Integración Frontend (API, UI con Reactivación y Modo Demostración)**
  - **Estimación:** ~25-30 min
  - **Dependencias:** Tarea 3.
  - **Requisitos cubiertos:** RF-002, RF-003, RF-017, RF-018, RF-019.
  - **Descripción:**
    1. Actualizar `frontend/src/services/api.ts` para que `fetchMarcas(incluirInactivas?: boolean)` soporte el query parameter y propague errores estructurados.
    2. Modificar `BrandManagementView.tsx` y `BrandManagementModal.tsx`:
       - Agregar selector/pestaña "Solo Activas" vs "Todas las marcas" para rol `ADMIN`.
       - Mostrar badge de estado "Inactiva" y botón de acción "Reactivar" (`PATCH /marcas/{id}` con `{ activa: true }`).
       - Ocultar acciones de mutación (crear, editar, desactivar) si la sesión activa corresponde a un `VENDEDOR`.
    3. Actualizar `frontend/src/services/demoStore.ts` para replicar el parámetro `incluirInactivas`, el toggle de reactivación y la unicidad insensible a mayúsculas/minúsculas.
  - **Hecho cuando:** `npm --prefix frontend run lint` reporta 0 advertencias/errores, `npm --prefix frontend run build` compila con éxito, y las marcas inactivas pueden ser visualizadas y reactivadas fluidamente en la UI.

- [ ] **Tarea 5: Verificación Integral E2E, Cobertura y Cierre de Spec 002**
  - **Estimación:** ~15-20 min
  - **Dependencias:** Tareas 1, 2, 3, 4.
  - **Requisitos cubiertos:** RF-001 a RF-019 (Definition of Done completa).
  - **Descripción:**
    1. Ejecutar la suite completa de pruebas unitarias y de integración del backend (`.\mvnw.cmd test`).
    2. Ejecutar el linter y compilación de producción del frontend (`npm run lint` y `npm run build`).
    3. Verificar que los productos asociados a marcas inactivas mantengan su persistencia e integridad para la venta (Principio 5 y 12).
    4. Marcar formalmente el checklist de tareas de la Spec 002 como completado.
  - **Hecho cuando:** Todas las suites de pruebas (backend y frontend) pasan con cero errores, cero advertencias y el árbol de git en `intregacion-sdd` está limpio.
