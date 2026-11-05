# Tareas de Implementación 008: Catálogo y Gestión Dinámica de Categorías

- [x] **Fase 1: Infraestructura y DTOs Backend**
  - [x] Crear entidad `Categoria` (`com.dunamis.makeup.entity.Categoria`)
  - [x] Crear DTOs: `CategoriaResponse`, `CrearCategoriaRequest`, `ActualizarCategoriaRequest`
  - [x] Crear repositorio `CategoriaRepository` con consultas por nombre y estado

- [x] **Fase 2: Lógica de Negocio y Endpoints Backend**
  - [x] Implementar `CategoriaService` con validación de duplicados y borrado lógico
  - [x] Implementar sembrado inicial `CategoriasIniciales` (6 categorías históricas)
  - [x] Implementar controlador `CategoriaController` en `/categorias`
  - [x] Actualizar reglas de autorización y CSRF en `SecurityConfig`
  - [x] Crear pruebas unitarias para `CategoriaService`
  - [x] Crear pruebas de integración para `CategoriaController`

- [x] **Fase 3: Integración con Producto en Backend**
  - [x] Modificar relación en `Producto` hacia entidad `Categoria`
  - [x] Adaptar DTOs de producto (`CrearProductoRequest`, `ActualizarProductoRequest`, `ProductoResponse`)
  - [x] Actualizar `ProductoService` para validar `categoriaId` y asignar la entidad
  - [x] Actualizar y verificar pruebas de integración de `Producto`

- [x] **Fase 4: Tipos, API y DemoStore en Frontend**
  - [x] Crear interfaces `Categoria` y `CategoriaInput` en `types/index.ts`
  - [x] Actualizar interfaces `Producto` y `ProductoInput`
  - [x] Implementar funciones `getCategories`, `createCategory`, `updateCategory` en `api.ts`
  - [x] Implementar soporte completo de categorías en `demoStore.ts`

- [x] **Fase 5: Interfaz de Usuario y Despliegue**
  - [x] Diseñar componente `CategoryModal.tsx` con estilos consistentes a `BrandModal`
  - [x] Agregar disparador del modal en la barra superior o cabecera
  - [x] Hacer dinámico el selector de categoría en `ProductModal.tsx`
  - [x] Hacer dinámicos los filtros de categorías en las vistas de catálogo e inventario
  - [x] Agregar rewrites para `/categorias` en `frontend/vercel.json`

- [x] **Fase 6: Verificación Final**
  - [x] Ejecutar `npm --prefix frontend run lint` y `npm --prefix frontend run build`
  - [x] Ejecutar `.\mvnw.cmd test-compile` y `.\mvnw.cmd test`
