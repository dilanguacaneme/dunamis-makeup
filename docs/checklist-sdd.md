# Checklist de Funcionalidades Ordenadas por Dependencia (Pre-SDD)

Este documento centraliza el diagnóstico técnico, inconsistencias detectadas y el checklist de regularización de **Dunamis Makeup**, ordenadas estrictamente por su **cadena de dependencia arquitectónica y de dominio**.

---

## Árbol de Dependencias del Proyecto

```
Nivel 1 (Fundación):
  [001: Autenticación, Sesión y RBAC]
         │
         ▼ (Otorga permisos de ADMIN y contexto de VENDEDOR)
Nivel 2 (Entidad Base del Catálogo):
  [002: Marcas]
         │
         ▼ (Requerida obligatoriamente para registrar productos)
Nivel 3 (Inventario Central):
  [003: Productos e Inventario]
         │
         ▼ (Aporta catálogo, precios y existencias a descontar)
Nivel 4 (Operación Comercial Transaccional):
  [004: Facturación, Ventas y Stock]
         │
         ▼ (Cierra el ciclo transaccional del negocio)
Nivel 5 (Robustez Transversal):
  [005: Calidad de API, DTOs y Errores]
         │
         ▼ (Estandariza contratos y desacopla entidades en toda la API)
Nivel 6 (Simulación Desacoplada):
  [006: Modo Demostración Local (Offline)]
```

---

## Tabla Resumen de Módulos (En Orden de Dependencia)

| Orden | ID | Módulo | ¿De qué depende? | Por qué va en esta posición |
|---|---|---|---|---|
| **1°** | `001` | **Autenticación, Sesión y Roles (RBAC)** | Nada (Base) | Sin sesión ni tokens CSRF, ningún endpoint protegido puede ejecutarse ni probarse. |
| **2°** | `002` | **Catálogo y Gestión de Marcas** | Rol `ADMIN` (de `001`) | Es la entidad más básica del catálogo. No se puede crear un producto sin una marca válida. |
| **3°** | `003` | **Catálogo e Inventario de Productos** | Marcas (`002`) y `ADMIN` (`001`) | Depende de marcas para existir; define precios y stock necesarios para vender. |
| **4°** | `004` | **Facturación y Descuento de Stock** | Productos (`003`) y Usuarios (`001`) | Requiere existencias para descontar y usuario autenticado para saber quién vendió. |
| **5°** | `005` | **Calidad de API, DTOs y Errores** | Módulos `001` a `004` | Blinda los contratos con `@RestControllerAdvice` y DTOs para toda la API. |
| **6°** | `006` | **Modo Demostración Local (Offline)** | Reglas de `001` a `005` | Emula en el cliente (`demoStore`) las reglas y estructuras validadas previamente. |

---

## Nivel 1 — Módulo 001: Autenticación, Sesión y Control de Acceso (RBAC)
> **Pre-requisitos:** Ninguno. Es el cimiento de la API.

### Estado Actual en el Código
- **Backend:** `SecurityConfig.java`, `AuthController.java`, `UsuarioDetailsService.java`, `UsuariosIniciales.java`.
- **Rutas HTTP:**
  - `GET /api/auth/csrf` (Público, genera cookie `XSRF-TOKEN`).
  - `POST /api/auth/login` (Público, form-urlencoded con `username` y `password`).
  - `GET /api/auth/me` (Autenticado, devuelve `username`, `fullName`, `role`).
  - `POST /api/auth/logout` (Autenticado, invalida sesión y cookies `JSESSIONID` y `XSRF-TOKEN`).
- **Seguridad:** Roles `ADMIN` y `VENDEDOR`. Cuentas administradoras creadas al inicio (`maryuri`, `caterin`).
- **Frontend:** `LoginScreen.tsx`, flujo de sesión y validación de cookies en `api.ts`.

### Inconsistencias y Mejoras Pendientes
1. **Ausencia total de tests:** No existen pruebas automatizadas para comprobar que endpoints protegidos rechacen llamadas no autenticadas (401) ni que un `VENDEDOR` reciba 403 al invocar operaciones de administración.
2. **Sin administración de usuarios:** No hay endpoints ni pantalla para registrar, listar o deshabilitar vendedores; solo se crean los dos administradores por variables de entorno.
3. **Manejo de errores manual:** `SecurityConfig` escribe JSON directamente en el `HttpServletResponse` mediante un método auxiliar estático.

### Checklist
- [ ] Implementar tests de integración con `MockMvc` para `/api/auth/csrf`, `/api/auth/login`, `/api/auth/me` y `/api/auth/logout`.
- [ ] Probar rechazo de peticiones no autorizadas y verificación de roles (`ROLE_ADMIN` vs `ROLE_VENDEDOR`).
- [ ] Diseñar endpoint y control para la gestión de usuarios vendedores.
- [ ] Validar estados de UI en `LoginScreen.tsx` ante credenciales erróneas o caída del servidor.

---

## Nivel 2 — Módulo 002: Catálogo y Gestión de Marcas
> **Pre-requisitos:** `001` (para autorizar operaciones con rol `ADMIN`).

### Estado Actual en el Código
- **Backend:** `Marca.java`, `MarcaRepository.java`, `MarcaService.java`, `MarcaController.java`, `MarcasIniciales.java`.
- **Rutas HTTP:**
  - `GET /marcas` (Solo marcas activas, permitido para ADMIN y VENDEDOR).
  - `POST /marcas` (Crear marca con nombre único, solo ADMIN).
  - `PATCH /marcas/{id}` (Actualizar nombre o alternar `activa: boolean`, solo ADMIN).
- **Sembrado inicial:** Trendy, Purpure, Milagros, Magna.
- **Frontend:** Vista dedicada `BrandManagementView.tsx` (navegable desde el `Sidebar.tsx`) y modal `BrandManagementModal.tsx`.

### Inconsistencias y Mejoras Pendientes
1. **Inconsistencia en reactivación de marcas:** `GET /marcas` ejecuta `findByActivaTrueOrderByNombreAsc()`. Cuando una administradora desactiva una marca desde la UI (`activa: false`), esta desaparece de la respuesta del backend, haciendo imposible reactivarla desde la interfaz.
2. **Falta de soporte para listar todas las marcas:** Se requiere un parámetro como `/marcas?todas=true` o endpoint administrativo exclusivo para gestionar marcas inactivas.

### Checklist
- [ ] Habilitar en backend la consulta de marcas inactivas para el rol `ADMIN`.
- [ ] Actualizar `BrandManagementView.tsx` y `BrandManagementModal.tsx` para listar marcas inactivas con opción de reactivación.
- [ ] Agregar tests unitarios para `MarcaService` validando unicidad de nombres, creación y actualización.
- [ ] Validar que un producto nuevo no pueda asignarse a una marca inactiva.

---

## Nivel 3 — Módulo 003: Catálogo e Inventario de Productos
> **Pre-requisitos:** `001` (permisos de ADMIN) y `002` (marcas activas asociadas).

### Estado Actual en el Código
- **Backend:** `Producto.java`, `ProductoRepository.java`, `ProductoService.java`, `ProductoController.java`.
- **Rutas HTTP:**
  - `GET /producto/obtener-productos` (Todos los productos).
  - `GET /producto/obtener-productos-por-id/{id}` (Consulta individual).
  - `POST /producto/crear` (Crear con categoría y marca obligatoria, solo ADMIN).
  - `PATCH /producto/actualizar/{id}` (Actualización parcial, solo ADMIN).
  - `DELETE /producto/borrar-producto-por-id/{id}` (Borrado físico por ID, solo ADMIN).
  - `GET /producto/total-inventario` (Suma de valuación del inventario).
  - `GET /producto/acabarse` (Productos con `cantidad == 0`).
- **Frontend:** `ProductTable.tsx`, `ProductGrid.tsx`, `ProductToolbar.tsx`, `ProductModal.tsx`, `LowStockDrawer.tsx`, `AtelierStatusBar.tsx`.

### Inconsistencias y Mejoras Pendientes
1. **Riesgo crítico de borrado físico:** Si se llama a `DELETE /producto/borrar-producto-por-id/{id}` sobre un producto que ya tiene ventas en `DetalleFactura`, PostgreSQL arroja violación de clave foránea (`DataIntegrityViolationException`) generando un error 500 no controlado.
   - *Solución requerida por Constitución:* Implementar borrado lógico (`activo: boolean`) y rechazar borrado físico si hay historial.
2. **Alerta de stock insuficiente limitada:** `GET /producto/acabarse` únicamente filtra existencias en cero (`cantidad = 0`). No hay advertencia preventiva de stock bajo (ej. umbral de `< 5` unidades).
3. **Cálculo redundante en base de datos:** El atributo `totalProducto` (`precio * cantidad`) se persiste físicamente y se recalcula a mano en cada servicio, propenso a desincronizarse.

### Checklist
- [ ] Implementar borrado lógico (`activo = false`) en `Producto`.
- [ ] Bloquear borrado físico de productos asociados a facturas existentes.
- [ ] Implementar umbral configurable para alerta de stock bajo (no solo agotados en 0).
- [ ] Agregar tests para CRUD de productos, validación de existencias no negativas y recálculo de inventario.
- [ ] Probar ajuste rápido de stock (+ / -) y filtros por categoría desde el frontend.

---

## Nivel 4 — Módulo 004: Facturación, Ventas y Descuento de Stock
> **Pre-requisitos:** `001` (identifica qué vendedor opera) y `003` (catálogo y stock a descontar).

### Estado Actual en el Código
- **Backend:** `Factura.java`, `DetalleFactura.java`, `FacturaRepository.java`, `FacturaService.java`, `FacturaController.java`.
- **Rutas HTTP:**
  - `POST /factura/crear` (Crea factura, valida existencias y descuenta stock en `@Transactional`).
  - `GET /factura/obtener-facturas` (Historial: ADMIN ve todas, VENDEDOR ve solo las suyas).
  - `GET /factura/obtener-factura-por-id/{id}` (Detalle con restricción de propiedad por vendedor).
- **Frontend:**
  - `QuickSaleModal.tsx`: Registro de venta multilínea con cálculo dinámico.
  - `InvoiceHistoryView.tsx`: Historial con buscador y filtros.
  - `InvoiceDetailModal.tsx`: Vista detallada de factura con exportación e impresión.
  - `MonthlySalesView.tsx`: Vista dedicada de resumen y análisis de ventas mensuales.
  - `pdfGenerator.ts`: Generación y descarga directa de ticket/factura en formato PDF (`jspdf`).
  - Navegación global con `Sidebar.tsx`, `DesktopTopBar.tsx` y `MobileHeader.tsx`.

### Inconsistencias y Mejoras Pendientes
1. **Falta de método de pago y abonos:** La factura actual en `main` no registra la modalidad de pago (efectivo, transferencia, Nequi, Daviplata, tarjeta) ni abonos parciales. Esta capacidad fue prototipada en la rama `feature/backend-payment-tracking` y debe integrarse bajo spec.
2. **Fecha sin componente horario:** `Factura.fecha` es `LocalDate.now()`. No incluye hora/minuto (`LocalDateTime`), dificultando ordenar cronológicamente las ventas de un mismo día o generar cierres de caja.
3. **Sin soporte de anulación de factura:** No existe forma de cancelar una venta ni revertir de forma atómica el stock al inventario.

### Checklist
- [ ] Migrar el campo `fecha` de `LocalDate` a `LocalDateTime`.
- [ ] Integrar seguimiento de pagos y abonos en backend (sincronizando la lógica de `feature/backend-payment-tracking`).
- [ ] Implementar flujo de anulación de facturas con restitución atómica de inventario.
- [ ] Crear tests transaccionales que garanticen rollback completo si algún producto del pedido carece de existencias suficientes.
- [ ] Probar descarga de factura en PDF (`pdfGenerator.ts`) y visualización en `MonthlySalesView.tsx`.
- [ ] Probar segregación de facturas por rol en UI y API.

---

## Nivel 5 — Módulo 005: Calidad de API, DTOs y Manejo Global de Errores
> **Pre-requisitos:** Transversal sobre los módulos `001` a `004`.

### Estado Actual en el Código
- **Backend:** Manejo manual de excepciones con `try-catch` dentro de los controladores; textos planos retornados en cuerpos de error; paquete nombrado `com.dunamis.makeup.Exeption` (con errata tipográfica).
- **Esquema:** `spring.jpa.hibernate.ddl-auto=update` sin migraciones versionadas.

### Inconsistencias y Mejoras Pendientes
1. **Falta de `@RestControllerAdvice`:** Las respuestas de error no tienen un formato JSON unificado ni estándar.
2. **Exposición directa de Entidades JPA:** Los controladores reciben y retornan `Producto`, `Factura` y `Marca` directamente, en lugar de usar DTOs dedicados con validaciones de entrada y proyecciones de salida.
3. **Erratas en nombres de paquetes:** Renombrar el paquete `Exeption` a `exception`.
4. **Ausencia de migraciones de base de datos:** Se depende de Hibernate para crear/modificar tablas, con riesgo de inconsistencias de datos en despliegues.

### Checklist
- [ ] Implementar `@RestControllerAdvice` con estructura uniforme de error en JSON (código, mensaje, timestamp, errores por campo).
- [ ] Diseñar e implementar DTOs para solicitudes y respuestas de productos, marcas y facturas.
- [ ] Renombrar el paquete `com.dunamis.makeup.Exeption` a `com.dunamis.makeup.exception`.
- [ ] Evaluar incorporación de Flyway para versionado de base de datos PostgreSQL.

---

## Nivel 6 — Módulo 006: Modo Demostración Local (Offline)
> **Pre-requisitos:** Debe replicar fielmente los contratos de `001` a `005`.

### Estado Actual en el Código
- **Frontend Exclusivo:** `demoData.ts` (`demoStore`), `api.ts`, `App.tsx`.
- **Funcionalidad:**
  - Mock en memoria de productos, marcas, facturas y usuarios.
  - Alternador de rol en caliente (Administradora vs Vendedora).
  - Botón de restablecimiento de datos demo predeterminados.
  - No requiere backend Spring Boot ni base de datos PostgreSQL activos.

### Inconsistencias y Mejoras Pendientes
1. **Pérdida de datos en recarga:** Cualquier venta o producto creado en modo demo se reinicia si el usuario presiona F5 o recarga la página.
2. **Desincronización de esquemas:** Si se agregan campos al backend (como métodos de pago o borrado lógico), el mock en `demoData.ts` debe mantenerse actualizado para no romper la experiencia offline.

### Checklist
- [ ] Opcional: Persistir el almacén `demoStore` en `localStorage`.
- [ ] Mantener sincronizadas las estructuras del mock con los contratos del backend.
- [ ] Verificar que las validaciones del modo demo emulen fielmente las reglas del backend.
