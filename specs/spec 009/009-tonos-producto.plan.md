# Plan de Implementación 009: Tonos de Producto

## Fase 1: Backend — Entidad y Migración SQL

1. **Entidad `Producto` ([Producto.java](file:///C:/Users/Dilan/Documents/workSpace/JAVA/Dunamis%20Makeup/src/main/java/com/dunamis/makeup/entity/Producto.java)):**
   - Agregar campo:
     ```java
     @Column(nullable = false, length = 20)
     private String tono = "NO_APLICA";
     ```
   - Actualizar `ensureDefaults()` para garantizar que `tono` nunca sea `null` al cargar registros históricos:
     ```java
     if (this.tono == null) {
         this.tono = "NO_APLICA";
     }
     ```

2. **Migración SQL brownfield:**
   - Ejecutar antes o durante el primer arranque de la nueva versión:
     ```sql
     ALTER TABLE producto ADD COLUMN IF NOT EXISTS tono VARCHAR(20) NOT NULL DEFAULT 'NO_APLICA';
     UPDATE producto SET tono = 'NO_APLICA' WHERE tono IS NULL;
     ```
   - Puede ejecutarse en un `ApplicationRunner` con `@Order` posterior al sembrado de categorías, o directamente en la consola de base de datos antes del despliegue.

---

## Fase 2: Backend — DTOs y Validación

1. **`CrearProductoRequest`:**
   - Agregar campo opcional con valor por defecto y validación de patrón:
     ```java
     @Pattern(regexp = "^(NO_APLICA|[1-9]|10)$",
              message = "El tono debe ser 'NO_APLICA' o un número del 1 al 10")
     private String tono = "NO_APLICA";
     ```

2. **`ActualizarProductoRequest`:**
   - Agregar campo opcional (nullable):
     ```java
     @Pattern(regexp = "^(NO_APLICA|[1-9]|10)$",
              message = "El tono debe ser 'NO_APLICA' o un número del 1 al 10")
     private String tono;
     ```

3. **`ProductoResponse`:**
   - Agregar campo `String tono` (el mapper/servicio nunca debe permitir que sea `null`; si lo es, mapear a `"NO_APLICA"`).

---

## Fase 3: Backend — Servicio y Controlador

1. **`ProductoService` — método `crearProducto`:**
   - Al mapear `CrearProductoRequest` → `Producto`, asignar:
     ```java
     producto.setTono(request.getTono() != null ? request.getTono() : "NO_APLICA");
     ```

2. **`ProductoService` — método `actualizarProducto`:**
   - Solo actualizar `tono` si el campo viene presente en el `ActualizarProductoRequest` (semántica PATCH):
     ```java
     if (request.getTono() != null) {
         producto.setTono(request.getTono());
     }
     ```

3. **`ProductoController`:**
   - Sin cambios de rutas ni seguridad. La restricción de `POST` a solo `ADMIN` ya está implementada en `SecurityConfig` conforme a la Especificación 003.

4. **Pruebas Backend:**
   - Tests unitarios de `ProductoService` con `tono` presente, `tono` ausente (default) y `tono` inválido (`400`).
   - Tests de integración de `ProductoController`: `POST` sin tono, `POST` con tono válido, `POST` con tono inválido, `PATCH` actualizando tono, `PATCH` sin tono (conserva valor previo).
   - Test RBAC: `POST` con rol `VENDEDOR` → `403`.

---

## Fase 4: Frontend — Tipos y API

1. **`types/index.ts`:**
   - Agregar campo `tono?: string` a la interfaz `Producto`.
   - Agregar campo `tono?: string` a la interfaz `ProductoInput`.

2. **`api.ts` / `demoStore.ts`:**
   - Asegurar que el campo `tono` se incluya en los payloads de creación y actualización de productos.
   - En `demoStore.ts`, inicializar productos de ejemplo con `tono` representativo:
     - Bases y correctores: `"3"`, `"7"`, etc.
     - Brochas, fijadores y accesorios: `"NO_APLICA"`.

---

## Fase 5: Frontend — Interfaz de Usuario

1. **`ProductModal.tsx` — Selector de tono:**
   - Agregar un campo `<select>` con las 11 opciones (`No aplica` + `Tono 1` a `Tono 10`).
   - Al crear: valor por defecto seleccionado = `"NO_APLICA"` → muestra `"No aplica"`.
   - Al editar: preseleccionar el valor actual del producto (`producto.tono`).
   - Enviar el valor numérico limpio al backend (`"1"`, `"2"`, … `"10"` o `"NO_APLICA"`).

2. **`ProductGrid.tsx` — Badge de tono:**
   - Si `producto.tono && producto.tono !== "NO_APLICA"`, renderizar badge con texto `Tono {producto.tono}` junto al nombre del producto.
   - Si `tono === "NO_APLICA"`, no renderizar ningún badge.

3. **`ProductTable.tsx` — Columna/Badge de tono:**
   - Misma lógica de visualización condicional que `ProductGrid.tsx`.

4. **Visualización en factura / POS:**
   - En el componente que renderiza las líneas del detalle de factura, mostrar:
     - `"{nombre} (Tono {tono})"` si `tono !== "NO_APLICA"`.
     - `"{nombre}"` si `tono === "NO_APLICA"`.

---

## Fase 6: Verificación Final

1. Ejecutar linter y build del frontend: `npm --prefix frontend run lint` y `npm --prefix frontend run build`.
2. Ejecutar compilación y tests del backend: `.\mvnw.cmd test-compile` y `.\mvnw.cmd test`.
3. Verificar manualmente en modo demo que los badges aparecen y desaparecen según el tono.
4. Verificar que al editar un producto, el selector preselecciona el tono guardado.
