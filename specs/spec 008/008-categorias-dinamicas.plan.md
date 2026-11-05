# Plan de Implementación 008: Catálogo y Gestión Dinámica de Categorías

## Fase 1: Backend - Entidad, Repositorio y DTOs
1. **Entidad JPA:**
   - Crear `com.dunamis.makeup.entity.Categoria` con campos `id` (`GenerationType.IDENTITY`), `nombre` (`unique`, longitud 60), `activa` (`boolean`).
2. **DTOs:**
   - Crear paquete `com.dunamis.makeup.dto.categoria`:
     - `CategoriaResponse(Long id, String nombre, Boolean activa)`
     - `CrearCategoriaRequest(@NotBlank @Size(min=2, max=60) String nombre)`
     - `ActualizarCategoriaRequest(@Size(min=2, max=60) String nombre, Boolean activa)`
3. **Repositorio:**
   - Crear `CategoriaRepository` con métodos:
     - `Optional<Categoria> findByNombreIgnoreCase(String nombre)`
     - `boolean existsByNombreIgnoreCase(String nombre)`
     - `boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Long id)`
     - `List<Categoria> findAllByOrderByNombreAsc()`
     - `List<Categoria> findByActivaTrueOrderByNombreAsc()`

## Fase 2: Backend - Servicio, Sembrado Inicial y Seguridad
1. **Servicio (`CategoriaService`):**
   - `listarCategorias(boolean incluirInactivas)`
   - `crearCategoria(CrearCategoriaRequest request)` (con sanitización y detección de duplicados 409)
   - `actualizarCategoria(Long id, ActualizarCategoriaRequest request)` (con validación de al menos un campo, detección de colisión y toggle de activo)
2. **Sembrador Idempotente (`CategoriasIniciales`):**
   - `@Order(1)`: sembrar las 6 categorías base si la tabla está vacía.
3. **Controlador (`CategoriaController`):**
   - Mapeado en `/categorias`
   - `GET` -> `listarCategorias`
   - `POST` -> `crearCategoria`
   - `PATCH /{id}` -> `actualizarCategoria`
4. **Seguridad (`SecurityConfig`):**
   - `GET /categorias`, `/categorias/**` -> `ADMIN`, `VENDEDOR`
   - `POST /categorias`, `/categorias/**` -> `ADMIN`
   - `PATCH /categorias`, `/categorias/**` -> `ADMIN`
   - Prohibido `DELETE /categorias/**`
5. **Pruebas Backend:**
   - Tests unitarios de `CategoriaService`.
   - Tests de integración de `CategoriaController` y seguridad RBAC.

## Fase 3: Backend - Adaptación de Producto y Migración
1. **Entidad `Producto`:**
   - Vincular `private Categoria categoria` con `@ManyToOne`.
2. **Adaptación de DTOs de Producto:**
   - `ProductoResponse` serializa `CategoriaResponse`.
   - `CrearProductoRequest` y `ActualizarProductoRequest` reciben `categoriaId: Long`.
3. **Backfill seguro en `CategoriasIniciales` o servicio de productos:**
   - Si existen productos previos sin `categoria_id`, vincularlos a la categoría correspondiente por nombre.
4. **Verificación de pruebas de Producto existentes:**
   - Actualizar mocks y fixtures de pruebas de producto para reflejar la entidad `Categoria`.

## Fase 4: Frontend - Tipos, API y Modo Demostración
1. **Tipos ([frontend/src/types/index.ts](file:///C:/Users/Dilan/Documents/workSpace/JAVA/Dunamis Makeup/frontend/src/types/index.ts)):**
   - Definir `interface Categoria { id: number; nombre: string; activa: boolean; }`
   - Definir `interface CategoriaInput { nombre: string; activa?: boolean; }`
   - Actualizar `Producto` y `ProductoInput` para usar `categoria: Categoria` y `categoriaId?: number`.
2. **Servicio de API ([frontend/src/services/api.ts](file:///C:/Users/Dilan/Documents/workSpace/JAVA/Dunamis Makeup/frontend/src/services/api.ts)):**
   - `getBrands` -> agregar análogo `getCategories(isDemo, incluirInactivas)`.
   - `createCategory(input, isDemo)`.
   - `updateCategory(id, input, isDemo)`.
3. **Modo Demo ([frontend/src/services/demoData.ts](file:///C:/Users/Dilan/Documents/workSpace/JAVA/Dunamis Makeup/frontend/src/services/demoData.ts)):**
   - Añadir `INITIAL_DEMO_CATEGORIES`.
   - Implementar métodos en `demoStore` para listar, crear, actualizar categorías y persistir en `dunamis_demo_categories_v3`.

## Fase 5: Frontend - UI (Modal, Filtros y Formulario)
1. **Componente `CategoryModal.tsx`:**
   - Modal para administradoras para crear, renombrar y activar/inactivar categorías.
2. **Integración en TopBar / Header:**
   - Botón de acceso a "Gestionar Categorías" visible para `ADMIN`.
3. **Selector dinámico en `ProductModal.tsx`:**
   - Cargar las categorías activas en el `<select>` de categoría.
4. **Filtros en Catálogo e Inventario:**
   - Las pestañas o botones de filtro por categoría se alimentan dinámicamente de las categorías activas.
5. **Configuración de Despliegue:**
   - Agregar rewrites para `/categorias` en [frontend/vercel.json](file:///C:/Users/Dilan/Documents/workSpace/JAVA/Dunamis Makeup/frontend/vercel.json).

## Fase 6: Verificación y Calidad
1. Ejecutar linters frontend (`npm run lint`).
2. Compilar frontend (`npm run build`).
3. Compilar backend (`mvnw test-compile`).
4. Ejecutar suite de pruebas (`mvnw test`).
