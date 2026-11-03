# Especificación 005: Calidad de API, DTOs Universales y Manejo Global Estandarizado de Errores

## 1. Propósito y Contexto
- **QUÉ:** Unificar y blindar la arquitectura de la API REST de Dunamis Makeup:
  1. Erradicar de manera absoluta las respuestas de error en texto plano o estructuras dispersas mediante la consolidación de un `@RestControllerAdvice` global y robusto (Principio 11 de la Constitución).
  2. Corregir la errata ortográfica del paquete `com.dunamis.makeup.Exeption` migrándolo formalmente a `com.dunamis.makeup.exception` bajo las convenciones estándar de Java.
  3. Establecer una jerarquía limpia de excepciones de dominio (`RecursoNoEncontradoException`, `ReglaNegocioException`, `ConflictoEstadoException`).
  4. Garantizar que el 100% de los controladores (`AuthController`, `MarcaController`, `ProductoController`, `FacturaController`) operen exclusivamente con DTOs inmutables tipados tanto en entrada como en salida (Principio 2), eliminando cualquier retorno o parámetro basado en entidades JPA directas.
  5. Eliminar manejos manuales (`try-catch`, respuestas `ResponseEntity<?>` con DTOs de error embebidos a mano o `ResponseStatusException` dispersas en controladores) para centralizar la responsabilidad en el manejador global.
  6. Estandarizar las respuestas de validación (`@Valid`) con desglose estructurado de errores por campo en español.
- **POR QUÉ:** Aunque las especificaciones 001 a 004 introdujeron DTOs y validaciones puntuales, el backend mantiene inconsistencias arquitectónicas: controladores que aún lanzan `ResponseStatusException` de Spring en lugar de excepciones de dominio, respuestas manuales como en `MarcaController.listar` (`ResponseEntity<?>` devolviendo `ErrorResponse`), errores de tipado o JSON inválido que pueden exponer trazas técnicas o textos planos, y el paquete de excepciones escrito con errata tipográfica y mayúscula (`Exeption`). Esta especificación cierra el Nivel 5 del checklist SDD, blindando la robustez transversal de la API.

---

## 2. Requisitos Funcionales (Sintaxis EARS)

### Paquete y Jerarquía de Excepciones de Dominio
- **RF-001 (Ubiquitous):** El backend deberá alojar todas las excepciones de dominio en el paquete normalizado `com.dunamis.makeup.exception` (en minúsculas y con ortografía correcta), eliminando de raíz el paquete residual `com.dunamis.makeup.Exeption`.
  - *Por qué:* Cumple con las convenciones oficiales de nomenclatura de paquetes en Java y la coherencia del árbol de fuentes.

- **RF-002 (Ubiquitous):** El sistema deberá implementar una jerarquía de excepciones de dominio desacoplada del protocolo HTTP:
  - `RecursoNoEncontradoException`: Excepción semántica para entidades no localizadas en base de datos (Producto, Marca, Factura, Abono).
  - `ReglaNegocioException`: Excepción para violaciones de lógica de negocio (ej. umbrales inválidos, productos inactivos para operaciones comerciales, datos contradictorios).
  - `ConflictoEstadoException`: Excepción para violaciones de estado transaccional o concurrente (ej. sobrepagos en abonos, facturas ya anuladas, dependencias referenciales en borrado).
  - `InventarioVacioException` y `ProductoInsuficienteException`: Subclases o variantes especializadas que heredan de las excepciones base de conflicto/negocio.
  - *Por qué:* Permite que los servicios de aplicación (`Service`) comuniquen fallas de negocio sin acoplarse a clases o códigos HTTP del framework web.

---

### Estandarización de Contratos de Error (`ErrorResponse` — Principio 11)
- **RF-003 (Ubiquitous):** Todas las respuestas de error emitidas por la API ante códigos HTTP `4xx` y `5xx` deberán responder estrictamente en formato JSON con la siguiente estructura uniforme:
  ```json
  {
    "error": "CODIGO_SEMANTICO",
    "message": "Descripción clara del problema en español",
    "timestamp": 1729900000000,
    "detalles": {
      "campo1": "Mensaje de validación para campo1",
      "campo2": "Mensaje de validación para campo2"
    }
  }
  ```
  - El campo `detalles` será opcional (o nulo/omitido en respuestas que no provengan de validaciones por campo).
  - El objeto DTO `ErrorResponse` en `com.dunamis.makeup.dto.common` deberá proporcionar constructores o métodos de fábrica (`of(String error, String message)` y `of(String error, String message, Map<String, String> detalles)`) inmutables.
  - *Por qué:* Cumple con el Principio 11 de la Constitución (cero texto plano, respuestas estructuradas e inteligibles por clientes web).

---

### Manejo Global Centralizado (`@RestControllerAdvice`)
- **RF-004 (Event-driven):** Cuando una petición HTTP falle la validación de entrada (`@Valid` sobre DTOs) y se dispare `MethodArgumentNotValidException`, el manejador global deberá interceptarla y retornar estado HTTP `400 Bad Request` con `error = "VALIDATION_FAILED"`, un mensaje resumen claro en `message`, y en `detalles` un mapa ordenado con clave = nombre del campo y valor = mensaje descriptivo en español.
  - *Por qué:* Proporciona feedback granular y accionable tanto al frontend como a consumidores de la API ante formularios con múltiples errores.

- **RF-005 (Event-driven):** Cuando una petición HTTP envíe un cuerpo JSON malformado, sintácticamente inválido o con tipos de datos incompatibles (ej. texto en un campo numérico) disparando `HttpMessageNotReadableException`, el manejador global retornará HTTP `400 Bad Request` con `error = "BAD_REQUEST"` y un mensaje claro como `"El cuerpo de la solicitud es inválido, está mal formado o contiene tipos de datos incompatibles"`.
  - *Por qué:* Evita fugas de trazas internas del serializador Jackson y previene texto plano por defecto de Spring.

- **RF-006 (Event-driven):** Cuando un servicio lance `RecursoNoEncontradoException` (o sus equivalentes semánticos como `ProductoNoEncontradoException`), el manejador global retornará HTTP `404 Not Found` con `error = "NOT_FOUND"` y el mensaje provisto por la excepción.
  - *Por qué:* Estandariza la ausencia de recursos en todos los módulos sin requerir lógica redundante en controladores.

- **RF-007 (Event-driven):** Cuando se dispare una `ConflictoEstadoException` o `ProductoInsuficienteException`, el manejador global retornará HTTP `409 Conflict` con `error = "CONFLICT"` y el mensaje descriptivo del conflicto.
  - *Por qué:* Comunica claramente discrepancias de estado de datos y stock insuficiente sin degradar a un genérico 500.

- **RF-008 (Event-driven):** Cuando ocurra un fallo de integridad referencial o unicidad en la base de datos disparando `DataIntegrityViolationException`, el manejador global interceptará la excepción, suprimirá cualquier exposición de código SQL o traza interna de PostgreSQL, y retornará HTTP `409 Conflict` con `error = "DATA_INTEGRITY_VIOLATION"` y el mensaje seguro `"La operación no pudo completarse debido a una restricción de integridad de datos (registro duplicado o dependencias existentes)"`.
  - *Por qué:* Protege la seguridad de la infraestructura y evita errores 500 no controlados ante colisiones de claves foráneas o nombres únicos.

- **RF-009 (Event-driven):** Cuando ocurra un fallo de seguridad que dispare `AccessDeniedException` de Spring Security no capturado en la cadena de filtros, el manejador global retornará HTTP `403 Forbidden` con `error = "FORBIDDEN"` y mensaje `"Acceso denegado: permisos insuficientes para realizar esta operación"`.
  - *Por qué:* Asegura que el manejo de autorización por anotaciones (`@PreAuthorize`) mantenga idéntico contrato JSON que los filtros de seguridad.

- **RF-010 (Event-driven):** Cuando ocurra cualquier otra excepción no capturada explícitamente (`Exception.class`), el manejador global registrará el error y la traza en el log del servidor (`logger.error(...)`) y retornará al cliente HTTP `500 Internal Server Error` con `error = "INTERNAL_SERVER_ERROR"`, `message = "Ha ocurrido un error interno en el servidor. Por favor contacte al administrador"`, garantizando que jamás se envíe texto plano ni trazas técnicas al navegador.
  - *Por qué:* Garantiza robustez y hermeticidad de la API ante cualquier imprevisto en tiempo de ejecución.

---

### Desacoplamiento de Controladores y Eliminación de Entidades JPA en Capa Web
- **RF-011 (Ubiquitous):** En `MarcaController`, se eliminarán los retornos con comodín `ResponseEntity<?>` y las respuestas de error manuales; el método `listar` retornará estrictamente `ResponseEntity<List<MarcaResponse>>` y delegará en el servicio y en las anotaciones de seguridad cualquier verificación de roles.
  - *Por qué:* Erradica firmas no tipadas y respeta el Principio 2 de contratos con DTOs.

- **RF-012 (Ubiquitous):** En `ProductoController`, se erradicarán todas las instancias de `ResponseStatusException`; las validaciones de negocio delegarán en los servicios lanzando excepciones de dominio (`RecursoNoEncontradoException`, `ReglaNegocioException`) para ser gestionadas limpiamente por el `@RestControllerAdvice`.
  - *Por qué:* Mantiene los controladores delgados, desacoplados del framework y enfocados exclusivamente en el mapeo HTTP.

- **RF-013 (Ubiquitous):** En todos los controladores (`AuthController`, `MarcaController`, `ProductoController`, `FacturaController`), queda estrictamente prohibido recibir o retornar entidades JPA (`Producto`, `Marca`, `Factura`, `DetalleFactura`, `AbonoFactura`, `Usuario`). Todas las interacciones se realizarán mediante DTOs inmutables en `com.dunamis.makeup.dto.*`.
  - *Por qué:* Salvaguarda el Principio 2 de la Constitución y previene serialización de proxies perezosos (Lazy Loading) o exposición de datos sensibles.

---

### Compatibilidad Brownfield y Pruebas Automatizadas
- **RF-014 (Ubiquitous):** Todas las refactorizaciones de DTOs y manejo de errores deberán ser 100% retrocompatibles con el frontend existente (`api.ts` y componentes React). El frontend deberá consumir sin rupturas el formato `{ error, message, timestamp, detalles? }`.
  - *Por qué:* Salvaguarda el Principio 12 de la Constitución de tolerancia y preservación brownfield.

- **RF-015 (Ubiquitous):** El sistema deberá contar con pruebas automatizadas (`MockMvc` y unitarias):
  - Pruebas para `GlobalExceptionHandler` validando cada código HTTP y estructura de respuesta JSON.
  - Pruebas para validación de DTOs con errores por campo.
  - Pruebas verificando que ninguna llamada errónea produzca texto plano.
  - *Por qué:* Garantiza cobertura y verificabilidad continua bajo la Constitución (Principios 8 y 11).

---

## 3. Casos Límite y Consideraciones de Error
1. **Petición con campos vacíos múltiples en `@Valid`:**
   - Si se envía `CrearProductoRequest` sin nombre, precio negativo y categoría nula, el sistema debe retornar HTTP 400 con los 3 campos detallados en el mapa `detalles`, permitiendo a la UI resaltar todos los campos erróneos de una sola vez.
2. **Petición con JSON truncado o caracteres corruptos:**
   - Dispara `HttpMessageNotReadableException`. El manejador global debe capturarla sin arrojar `NullPointerException` ni trazas de Jackson.
3. **Violación de clave foránea al intentar borrar producto con facturas:**
   - La base de datos arroja `DataIntegrityViolationException`. El manejador responde con HTTP 409 JSON claro, en vez de un 500 confuso.
4. **Parámetros de URL inválidos (ej. `/producto/obtener-productos-por-id/abc`):**
   - Dispara `MethodArgumentTypeMismatchException`. El manejador global debe capturarlo como HTTP 400 Bad Request indicando que el identificador debe ser numérico.

---

## 4. Fuera de Alcance
- No se alterarán las reglas de negocio de stock, cálculo de facturas ni descuentos ya implementados en los módulos 001 a 004.
- No se alterarán las rutas de los endpoints existentes para mantener estabilidad total del frontend.
- No se agregarán librerías de mapeo complejas (ej. MapStruct) sin necesidad; se usarán mappers estáticos limpios y constructores de registros DTO.

---

## 5. Criterios de Finalización (Definition of Done)
1. El paquete `com.dunamis.makeup.Exeption` no existe en el proyecto; todas las excepciones residen en `com.dunamis.makeup.exception`.
2. Todos los controladores responden exclusivamente con DTOs tipados (0 entidades JPA expuestas).
3. `GlobalExceptionHandler` intercepta todas las excepciones (`MethodArgumentNotValidException`, `HttpMessageNotReadableException`, `RecursoNoEncontradoException`, `ConflictoEstadoException`, `DataIntegrityViolationException`, `AccessDeniedException`, `Exception`).
4. El 100% de las respuestas de error en la API devuelven JSON uniforme `{ error, message, timestamp, detalles? }` y 0% en texto plano.
5. La suite completa de tests de backend (`mvnw test`) y frontend (`oxlint` + `vite build`) pasa al 100% con cero errores y cero advertencias.
