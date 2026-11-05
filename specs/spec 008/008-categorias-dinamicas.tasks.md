# Tareas de Implementación 008: Catálogo y Gestión Dinámica de Categorías

- [x] **Fase 1: Infraestructura y DTOs Backend**
  - [x] Crear entidad `Categoria` (`com.dunamis.makeup.entity.Categoria`)
  - [x] Crear DTOs: `CategoriaResponse`, `CrearCategoriaRequest`, `ActualizarCategoriaRequest`
  - [x] Crear repositorio `CategoriaRepository` con consultas por nombre y estado

- [ ] **Fase 2: Lógica de Negocio y Endpoints Backend**
  - [ ] Implementar `CategoriaService` con validación de duplicados y borrado lógico
  - [ ] Implementar sembrado inicial `CategoriasIniciales` (6 categorías históricas)
  - [ ] Implementar controlador `CategoriaController` en `/categorias`
  - [ ] Actualizar reglas de autorización y CSRF en `SecurityConfig`
  - [ ] Crear pruebas unitarias para `CategoriaService`
  - [ ] Crear pruebas de integración para `CategoriaController`

- [ ] **Fase 3: Integración con Producto en Backend**
  - [ ] Modificar relación en `Producto` hacia entidad `Categoria`
  - [ ] Adaptar DTOs de producto (`CrearProductoRequest`, `ActualizarProductoRequest`, `ProductoResponse`)
  - [ ] Actualizar `ProductoService` para validar `categoriaId` y asignar la entidad
  - [ ] Actualizar y verificar pruebas de integración de `Producto`

- [ ] **Fase 4: Tipos, API y DemoStore en Frontend**
  - [ ] Crear interfaces `Categoria` y `CategoriaInput` en `types/index.ts`
  - [ ] Actualizar interfaces `Producto` y `ProductoInput`
  - [ ] Implementar funciones `getCategories`, `createCategory`, `updateCategory` en `api.ts`
  - [ ] Implementar soporte completo de categorías en `demoStore.ts`

- [ ] **Fase 5: Interfaz de Usuario y Despliegue**
  - [ ] Diseñar componente `CategoryModal.tsx` con estilos consistentes a `BrandModal`
  - [ ] Agregar disparador del modal en la barra superior o cabecera
  - [ ] Hacer dinámico el selector de categoría en `ProductModal.tsx`
  - [ ] Hacer dinámicos los filtros de categorías en las vistas de catálogo e inventario
  - [ ] Agregar rewrites para `/categorias` en `frontend/vercel.json`

- [ ] **Fase 6: Verificación Final**
  - [ ] Ejecutar `npm --prefix frontend run lint` y `npm --prefix frontend run build`
  - [ ] Ejecutar `.\mvnw.cmd test-compile` y `.\mvnw.cmd test`
