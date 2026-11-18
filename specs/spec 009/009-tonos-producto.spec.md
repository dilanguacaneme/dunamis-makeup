# Especificación 009: Tonos de Producto

## 1. Propósito y Contexto

- **QUÉ:** Incorporar el campo `tono` a la entidad `Producto` como un `String` con valor por defecto `"NO_APLICA"`, que represente el tono cosmético de un producto (del 1 al 10) o indique explícitamente que el producto no maneja tonos. El campo deberá reflejarse en los DTOs de entrada y salida, en los endpoints de creación y actualización de productos (exclusivos del rol `ADMIN`), en los listados del catálogo visual y en el detalle de cada línea de factura donde aplique.

- **POR QUÉ:** Dunamis Makeup comercializa productos con variación de tono (bases, correctores, polvos) y productos sin tono (brochas, fijadores, delineadores). Las vendedoras necesitan registrar el tono exacto al crear el inventario y verlo reflejado en la factura para evitar confusiones al momento de la entrega o de gestionar devoluciones. La ausencia de este campo obliga a incluir el tono manualmente en el nombre del producto, generando inconsistencias e impidiendo futuros filtros por tono.

---

## 2. Requisitos Funcionales (Sintaxis EARS)

### Contrato de Datos (campo `tono`)

- **RF-001 (Ubiquitous):** El campo `tono` en la entidad `Producto` deberá ser de tipo `String`, con:
  - `@Column(nullable = false, length = 20)`
  - Valor por defecto en Java: `"NO_APLICA"`.
  - Valores válidos: `"NO_APLICA"`, `"1"`, `"2"`, `"3"`, `"4"`, `"5"`, `"6"`, `"7"`, `"8"`, `"9"`, `"10"`.
  - *Por qué:* Los identificadores de enum en Java no pueden comenzar por un dígito; usar `String` con valor por defecto garantiza compatibilidad con datos históricos y elimina el riesgo de `NullPointerException`.

- **RF-002 (Ubiquitous):** Los DTOs se actualizarán de la siguiente manera:
  - `ProductoResponse`: incluirá el campo `tono: String` (nunca `null`; siempre `"NO_APLICA"` o un número del `"1"` al `"10"`).
  - `CrearProductoRequest`: incluirá el campo opcional `tono: String`. Si el cliente no lo envía, el sistema asignará `"NO_APLICA"` como valor predeterminado.
  - `ActualizarProductoRequest`: incluirá el campo opcional `tono: String?`. Si se envía, deberá pasar la misma validación de valores permitidos.
  - *Por qué:* Cumple con el Principio 2 de la Constitución: comunicación exclusiva por DTOs validados sin exponer la entidad JPA.

---

### Validación de entrada

- **RF-003 (Unwanted behavior):** Si un cliente envía `CrearProductoRequest` o `ActualizarProductoRequest` con un valor de `tono` que no pertenece al conjunto `{ "NO_APLICA", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10" }`, el sistema deberá responder con estado HTTP `400 Bad Request` y el cuerpo JSON estructurado:
  ```json
  {
    "error": "BAD_REQUEST",
    "message": "El tono debe ser 'NO_APLICA' o un número del 1 al 10",
    "timestamp": <timestamp_ms>
  }
  ```
  - *Por qué:* Falla de forma temprana ante valores de tono no reconocidos, antes de alcanzar la capa de persistencia.

- **RF-004 (Ubiquitous):** La validación del campo `tono` en los DTOs se implementará mediante la anotación `@Pattern` de Bean Validation con la expresión regular:
  ```
  ^(NO_APLICA|[1-9]|10)$
  ```
  - *Por qué:* Centraliza la regla de negocio en el contrato de entrada, alineado con la arquitectura de validación existente en el proyecto.

---

### Creación de Producto (`POST /producto/crear`)

- **RF-005 (Event-driven):** Cuando un usuario autenticado con rol `ADMIN` envíe `POST /producto/crear` con un `tono` válido en el cuerpo, el sistema deberá persistir el producto con dicho tono y responder con `ProductoResponse` incluyendo el campo `tono`.

- **RF-006 (Event-driven):** Cuando un usuario autenticado con rol `ADMIN` envíe `POST /producto/crear` sin incluir el campo `tono` en el cuerpo, el sistema deberá asignar automáticamente `"NO_APLICA"` y persistir el producto con ese valor por defecto.
  - *Por qué:* Garantiza compatibilidad con clientes que aún no envían el campo, sin romper integraciones existentes (brownfield).

- **RF-007 (Unwanted behavior):** Si un usuario con rol `VENDEDOR` intenta invocar `POST /producto/crear`, el sistema responderá con HTTP `403 Forbidden`, conforme a lo establecido en la Especificación 003 RF-011. La presencia o ausencia del campo `tono` en el cuerpo no altera esta restricción.
  - *Por qué:* La creación de productos es una operación exclusiva del rol `ADMIN` según la Constitución y la Especificación 003.

---

### Actualización de Producto (`PATCH /producto/actualizar/{id}`)

- **RF-008 (Event-driven):** Cuando un usuario autenticado con rol `ADMIN` envíe `PATCH /producto/actualizar/{id}` con el campo `tono` presente y válido, el sistema deberá actualizar únicamente ese campo y responder con `ProductoResponse` reflejando el nuevo tono.

- **RF-009 (Event-driven):** Cuando `PATCH /producto/actualizar/{id}` se envíe sin el campo `tono`, el sistema deberá conservar el tono existente del producto sin modificarlo.
  - *Por qué:* Respeta la semántica de actualización parcial (`PATCH`): solo se modifica lo que se envía explícitamente.

---

### Compatibilidad con Datos Históricos (Brownfield)

- **RF-010 (Ubiquitous):** Los productos existentes en la base de datos que no tengan valor en la columna `tono` (por ser anteriores a esta spec) deberán recibir automáticamente el valor `"NO_APLICA"` mediante una sentencia SQL de migración (`UPDATE producto SET tono = 'NO_APLICA' WHERE tono IS NULL`), ejecutada una sola vez al desplegar la nueva versión.
  - *Por qué:* Cumple el Principio 12 de la Constitución: las refactorizaciones deben preservar y tolerar datos históricos sin romper estados previos.

---

### Visualización en el Catálogo (Frontend)

- **RF-011 (State-driven):** Mientras un producto tenga `tono` distinto de `"NO_APLICA"`, la interfaz deberá mostrar una etiqueta visual (badge) junto al nombre del producto, con el texto `Tono <número>` (p. ej. `Tono 3`), tanto en la vista de cuadrícula (`ProductGrid.tsx`) como en la vista de tabla (`ProductTable.tsx`).

- **RF-012 (State-driven):** Mientras un producto tenga `tono` igual a `"NO_APLICA"`, la interfaz **no deberá mostrar** ninguna etiqueta de tono, manteniendo la visualización limpia y sin texto innecesario para productos sin variación de color.
  - *Por qué:* Evita ruido visual para brochas, esponjas, fijadores y otros productos sin tono, mejorando la experiencia de las vendedoras en el punto de venta.

---

### Visualización en el Formulario de Producto (`ProductModal.tsx`)

- **RF-013 (Ubiquitous):** El formulario de creación y edición de producto (`ProductModal.tsx`) deberá incluir un campo selector (`<select>`) para el tono con las opciones:
  - `No aplica` → envía `"NO_APLICA"`
  - `Tono 1` → envía `"1"`
  - `Tono 2` → envía `"2"`
  - … hasta…
  - `Tono 10` → envía `"10"`
  - El valor por defecto seleccionado al crear un nuevo producto será `"No aplica"`.
  - *Por qué:* Restringe la entrada a valores válidos desde la interfaz, sin depender exclusivamente de la validación del backend.

- **RF-014 (Ubiquitous):** Al abrir el modal en modo edición, el selector deberá preseleccionar el `tono` actual del producto, no el valor por defecto.
  - *Por qué:* Evita que una edición accidental sobreescriba el tono ya registrado con `"NO_APLICA"`.

---

### Visualización en la Factura y Punto de Venta

- **RF-015 (State-driven):** Mientras el `tono` de un producto en el detalle de una factura sea distinto de `"NO_APLICA"`, el sistema deberá mostrar el tono explícitamente en la línea del detalle de la factura con el formato:
  ```
  <Nombre del Producto> (Tono <número>)
  ```
  Ejemplo: `Base Líquida Ruby Rose (Tono 3)`.

- **RF-016 (State-driven):** Mientras el `tono` de un producto en el detalle de una factura sea `"NO_APLICA"`, el sistema deberá mostrar únicamente el nombre del producto, sin ninguna referencia al tono.
  - *Por qué:* Las vendedoras deben saber exactamente qué tono vendieron para garantías y cambios; pero la factura no debe llenarse de texto redundante para productos neutros.

---

### Modo Demostración Local (`demoStore.ts`)

- **RF-017 (Ubiquitous):** En el modo demostración local, los productos de ejemplo del `demoStore.ts` incluirán el campo `tono` inicializado con valores representativos (`"NO_APLICA"` para brochas y accesorios; valores numéricos como `"3"` o `"7"` para bases y correctores).
  - *Por qué:* Permite validar visualmente el comportamiento del campo en la interfaz sin conexión al backend.

---

## 3. Casos Límite y Consideraciones de Error

1. **Tono nulo en la base de datos:** Cualquier producto con `tono IS NULL` debe recibir `"NO_APLICA"` automáticamente vía migración SQL antes de que la aplicación arranque. El backend no debe permitir persistir un `null` en este campo.

2. **Valor de tono fuera de rango:** Enviar `"11"`, `"0"`, `"-1"` o cualquier texto libre como `"claro"` debe rechazarse con `400 Bad Request`. La validación `@Pattern` captura este caso.

3. **Consistencia histórica en facturas:** El `tono` que se muestra en la factura se deriva del `Producto` referenciado en el `DetalleFactura`. Si el tono del producto se edita después de haber generado una factura, las facturas históricas reflejarán el tono actualizado. Esta spec **no** exige snapshot de tono en `DetalleFactura`; si ese requisito surge, deberá especificarse en una spec posterior.

4. **Formulario de edición:** Al abrir el modal de edición de un producto existente, el selector de tono debe preseleccionar el valor actual del producto, no el valor por defecto (ver RF-014).

5. **Interacción con `ProductToolbar.tsx` (filtros):** Esta spec **no** incluye el filtrado del catálogo por tono. Si en el futuro se requiere ese filtro, deberá especificarse en una spec separada.
