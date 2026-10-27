# Plan de Implementación Técnica — Spec 005: Calidad de API, DTOs Universales y Manejo Global Estandarizado de Errores

## 1. Módulos y Arquitectura de la Solución

El plan técnico para el Nivel 5 se enfoca en la robustez transversal, consistencia de contratos y estandarización del manejo de excepciones en Dunamis Makeup:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Frontend SPA (React 19)                         │
│  - src/services/api.ts (ApiError estructurado consumiendo ErrorResponse)│
│  - src/types/index.ts (Interfaz TypeScript ErrorResponse uniforme)     │
│  - Formularios de UI (Resaltado de errores por campo desde 'detalles') │
└────────────────────────────────▲───────────────────────────────────────┘
                                 │ HTTP REST (JSON estandarizado, 0% texto plano)
┌────────────────────────────────▼───────────────────────────────────────┐
│                      Backend Spring Boot (Java 17)                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ controller/GlobalExceptionHandler.java                           │  │
│  │ (@RestControllerAdvice centralizado, captura de 4xx y 5xx)       │  │
│  └────────────────────────────────▲─────────────────────────────────┘  │
│                                   │ Intercepta excepciones de dominio  │
│  ┌────────────────────────────────┴─────────────────────────────────┐  │
│  │ exception/* (Paquete refactorizado com.dunamis.makeup.exception) │  │
│  │  - RecursoNoEncontradoException                                  │  │
│  │  - ReglaNegocioException                                         │  │
│  │  - ConflictoEstadoException                                      │  │
│  │  - ProductoInsuficienteException / InventarioVacioException      │  │
│  └────────────────────────────────▲─────────────────────────────────┘  │
│                                   │ Lanzadas por reglas de negocio     │
│  ┌────────────────────────────────┴─────────────────────────────────┐  │
│  │ service/* (Servicios de aplicación puros y desacoplados de HTTP) │  │
│  │  - ProductoService, MarcaService, FacturaService                 │  │
│  └────────────────────────────────▲─────────────────────────────────┘  │
│                                   │ Transacciones y persistencia JPA   │
│  ┌────────────────────────────────┴─────────────────────────────────┐  │
│  │ controller/* (Controladores 100% tipados con DTOs inmutables)    │  │
│  │  - ProductoController, MarcaController, FacturaController        │  │
│  │  - AuthController                                                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Matriz de Cobertura de Requisitos Funcionales:
- **`com.dunamis.makeup.exception.*`:** Cubre **RF-001, RF-002** (Jerarquía de excepciones de dominio limpias).
- **`com.dunamis.makeup.dto.common.ErrorResponse`:** Cubre **RF-003** (DTO inmutable con detalles opcionales).
- **`com.dunamis.makeup.Controller.GlobalExceptionHandler`:** Cubre **RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-010, RF-014** (Captura transversal exhaustiva).
- **`com.dunamis.makeup.Controller.MarcaController`:** Cubre **RF-011, RF-013** (Eliminación de `ResponseEntity<?>` y DTOs estrictos).
- **`com.dunamis.makeup.Controller.ProductoController`:** Cubre **RF-012, RF-013** (Erradicación de `ResponseStatusException`).
- **`com.dunamis.makeup.Controller.FacturaController` & `AuthController`:** Cubre **RF-013** (Contratos 100% DTOs).
- **`src/test/java/com/dunamis/makeup/...`:** Cubre **RF-015** (Cobertura completa de tests unitarios y MockMvc).

---

## 2. Modelo de Excepciones y Contratos de Comunicación

### 2.1. Jerarquía de Excepciones de Dominio (`com.dunamis.makeup.exception`)

```
java.lang.RuntimeException
       │
       ├── DunamisException (Base abstracta para excepciones de dominio)
       │       │
       │       ├── RecursoNoEncontradoException (HTTP 404)
       │       │       └── ProductoNoEncontradoException (Retrocompatibilidad)
       │       │
       │       ├── ReglaNegocioException (HTTP 400)
       │       │       └── InventarioVacioException (Retrocompatibilidad)
       │       │
       │       └── ConflictoEstadoException (HTTP 409)
       │               └── ProductoInsuficienteException (Retrocompatibilidad)
```

1. **`DunamisException`:**
   Clase base para todas las excepciones del dominio Dunamis Makeup. Permite identificar de inmediato errores controlados de la aplicación frente a fallas técnicas inesperadas.
2. **`RecursoNoEncontradoException`:**
   Lanzada cuando un identificador de Producto, Marca, Factura o Usuario no existe en la base de datos.
   Ejemplo: `"Producto no encontrado con id: 99"`. Mapea a HTTP 404 Not Found.
3. **`ReglaNegocioException`:**
   Lanzada ante violaciones de reglas lógicas del negocio (parámetros fuera de rango, umbrales negativos, intentos de facturar productos descontinuados).
   Ejemplo: `"El umbral de existencias debe ser mayor o igual a cero"`. Mapea a HTTP 400 Bad Request.
4. **`ConflictoEstadoException`:**
   Lanzada cuando la operación colisiona con el estado actual del recurso (factura ya anulada, sobrepago de saldo, borrado de producto con facturas históricas).
   Mapea a HTTP 409 Conflict.

---

### 2.2. Contrato DTO `ErrorResponse`

```java
package com.dunamis.makeup.dto.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
    String error,
    String message,
    long timestamp,
    Map<String, String> detalles
) {
    public static ErrorResponse of(String error, String message) {
        return new ErrorResponse(error, message, System.currentTimeMillis(), null);
    }

    public static ErrorResponse of(String error, String message, Map<String, String> detalles) {
        return new ErrorResponse(error, message, System.currentTimeMillis(), detalles);
    }
}
```

- `@JsonInclude(JsonInclude.Include.NON_NULL)` asegura que si `detalles` es nulo, el JSON resultante sea `{ "error": "...", "message": "...", "timestamp": ... }`, garantizando **100% de retrocompatibilidad** con el frontend y los tests existentes.

---

## 3. Decisiones de Diseño Justificadas y Alternativas Descartadas

### Decisión 1: Jerarquía de Excepciones de Dominio Puras vs. `ResponseStatusException`
- **Alternativa descartada:** Continuar utilizando `throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "...")` directamente en los controladores o servicios.
- **Justificación:** `ResponseStatusException` acopla las capas de lógica al protocolo HTTP y al framework web de Spring. En una arquitectura limpia, los servicios de dominio no deben conocer conceptos HTTP como códigos de estado o cabeceras; deben comunicar violaciones de reglas mediante excepciones de negocio (`RecursoNoEncontradoException`, `ReglaNegocioException`), y dejar que `@RestControllerAdvice` sea el único encargado de traducir estas excepciones a respuestas HTTP.

### Decisión 2: Renombrado formal del paquete `com.dunamis.makeup.Exeption` a `com.dunamis.makeup.exception`
- **Alternativa descartada:** Dejar el paquete como `Exeption` con un alias o clase puente para evitar cambiar imports.
- **Justificación:** La especificación del lenguaje Java (JLS §6.1) y las guías de estilo oficiales exigen paquetes en minúsculas y sin erratas (`exception`). Mantener `Exeption` perjudica la calidad, la legibilidad y la profesionalidad del código base. Se realizará la migración completa actualizando los imports en los servicios y pruebas.

### Decisión 3: Estructura de `ErrorResponse` con `detalles` opcional y `@JsonInclude`
- **Alternativa descartada:** Cambiar la estructura actual de `ErrorResponse` a una lista de errores o un objeto anidado obligatorio.
- **Justificación:** `ErrorResponse.of(error, message)` es consumido activamente en tests de integración y en el cliente frontend `api.ts`. Introducir campos obligatorios adicionales o alterar los nombres existentes rompería la compatibilidad brownfield (Principio 12). Añadir `Map<String, String> detalles` con `@JsonInclude(NON_NULL)` añade enriquecimiento para validaciones de formulario sin alterar el JSON simple previo.

### Decisión 4: Ocultamiento de SQL y detalles técnicos en `DataIntegrityViolationException`
- **Alternativa descartada:** Retornar `ex.getMessage()` o el mensaje de la causa raíz de PostgreSQL al cliente.
- **Justificación:** Exponer nombres de tablas, columnas, claves foráneas y tipos de bases de datos representa una vulnerabilidad de divulgación de información sensible (OWASP Top 10 / CWE-209). El manejador intercepta la excepción, loguea la traza técnica internamente en el servidor para soporte y responde al cliente un mensaje seguro y claro en español.

### Decisión 5: Erradicación de firmas `ResponseEntity<?>` con DTOs de error embebidos
- **Alternativa descartada:** Mantener en `MarcaController.listar` la verificación condicional `if (!isAdmin) return ResponseEntity.status(FORBIDDEN).body(ErrorResponse.of(...))` con retorno comodín `<?>`.
- **Justificación:** El uso de comodines en controladores destruye el tipado en tiempo de compilación y la generación de documentación de API. La seguridad debe declararse mediante anotaciones (`@PreAuthorize`) o verificación con lanzamiento de excepción, permitiendo que la firma del método sea estrictamente tipada: `ResponseEntity<List<MarcaResponse>>`.

---

## 4. Estrategia de Pruebas y Verificación

### 4.1. Pruebas Unitarias de Excepciones y DTOs
- `ErrorResponseTest`: Verificar serialización inmutable, método fábrica `of`, inclusión condicional de `detalles` y generación de timestamps.
- `DomainExceptionsTest`: Verificar jerarquía de herencia, mensajes y constructores de `RecursoNoEncontradoException`, `ReglaNegocioException`, `ConflictoEstadoException`.

### 4.2. Pruebas de Integración con `MockMvc` para `GlobalExceptionHandler`
- `GlobalExceptionHandlerTest`:
  - Envío de `@Valid` inválido en `POST /producto/crear` -> Verificar HTTP 400, `error = "VALIDATION_FAILED"` y presencia del mapa `detalles` con errores por campo.
  - Envío de cuerpo no legible (JSON roto) en `POST /factura/crear` -> Verificar HTTP 400 y mensaje seguro en español.
  - Petición con parámetro de tipo incompatible (`/producto/obtener-productos-por-id/texto`) -> Verificar HTTP 400.
  - Consulta de producto o factura inexistente -> Verificar HTTP 404 JSON estructurado.
  - Provocación de conflicto de estado -> Verificar HTTP 409 JSON estructurado.
  - Verificación estricta de que **ningún endpoint retorne texto plano** ante errores.

### 4.3. Verificación de Integridad General
- Ejecución completa de la suite de 152 tests existentes para garantizar cero regresiones en los módulos 001 a 004.
- Ejecución de `npm --prefix frontend run lint` y `npm --prefix frontend run build`.
