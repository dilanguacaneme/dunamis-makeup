# Dunamis Makeup — Frontend de Inventario & Existencias

Frontend en React + TypeScript + Vite para la gestión privada de inventario y existencias del atelier cosmético **Dunamis Makeup**.

## Características Implementadas

- **Diseño Editorial & Paleta Cosmética**: Creado siguiendo la guía de `.agents/skills/frontend-design/SKILL.md` con un sistema de tokens en 6 colores base:
  - Ciruela Noche (`#1E1622`)
  - Alabastro Rosa (`#FBF8F6`)
  - Seda Polvo (`#EFE8E3`)
  - Bronce Champaña (`#C59B6D`)
  - Carmín Laca (`#9E2A2B`)
  - Salvia Atelier (`#3A6B56`)
- **Barra de Pulso de Inventario (Atelier Ledger Bar)**:
  - Valoración total en pesos colombianos (`GET /producto/total-inventario`).
  - Proporción visual y conteo por zona cosmética (`ROSTRO`, `CEJAS`, `LABIOS`, `OJOS`).
  - Alerta inmediata de productos en nivel crítico (`GET /producto/acabarse`, umbral ≤10%).
- **Doble Modo de Visualización**:
  - **Tabla de Auditoría**: Medidores de nivel de existencias, estados críticos, ajuste directo `+/-` y acciones.
  - **Fichas de Tocador**: Cuadrícula de tarjetas visuales para revisión de catálogo.
- **Búsqueda y Filtros Reactivos**:
  - Búsqueda en tiempo real por nombre de producto o identificador de referencia (#ID).
  - Filtros por zona cosmética (Todas, Rostro, Cejas, Labios, Ojos).
  - Filtro por estado de stock (Todos, Crítico ≤10%, Saludable >10%).
- **Gestión Completa de Stock**:
  - Registrar nuevo producto (`POST /producto/crear`).
  - Modificar datos (`PATCH /producto/actualizar/{id}`).
  - Ajuste rápido de unidades (`PATCH /producto/actualizar/{id}`).
  - Eliminar producto con modal de confirmación (`DELETE /producto/borrar-producto-por-id/{id}`).
- **Módulo de Venta Rápida**:
  - Emisión de facturas conectada a `POST /factura/crear`. Descuenta unidades automáticamente del inventario.
- **Cajón Lateral de Reposición Urgente**:
  - Panel dedicado a referencias con inventario por agotarse, con botones de reposición asistida (+5 uds. o completar dotación inicial).
- **Autenticación y Seguridad Spring Boot**:
  - Handshake CSRF (`GET /api/auth/csrf` con cookie `XSRF-TOKEN`).
  - Login URL-encoded (`POST /api/auth/login`) con selector asistido para `maryuri` y `caterin`.
  - Verificación de sesión (`GET /api/auth/me`).
  - Cierre de sesión (`POST /api/auth/logout`).
- **Resiliencia & Modo Demostración Aislado**:
  - Detección automática del estado del backend. Si el servidor Spring Boot local no está activo en `http://localhost:8080`, el usuario puede alternar fluidamente al **Modo Demostración**, el cual incluye un catálogo de 12 referencias cosméticas realistas con almacenamiento local persistente (`localStorage`).

## Scripts Disponibles

Desde la carpeta `frontend/`:

```bash
# Iniciar servidor de desarrollo en http://localhost:5173
npm run dev

# Compilar para producción (TypeScript + Vite)
npm run build

# Ejecutar linter Oxlint
npm run lint

# Previsualizar el build de producción
npm run preview
```

O desde la raíz del repositorio:

```bash
npm run dev
npm run build
npm run lint
```

## Integración con el Backend Spring Boot & Gaps Identificados

| Funcionalidad | Endpoint Backend | Estado |
|---|---|---|
| Token CSRF | `GET /api/auth/csrf` | Conectado |
| Inicio de Sesión | `POST /api/auth/login` | Conectado |
| Usuario Activo | `GET /api/auth/me` | Conectado |
| Cerrar Sesión | `POST /api/auth/logout` | Conectado |
| Listar Productos | `GET /producto/obtener-productos` | Conectado (maneja 200 y 204 No Content) |
| Total Inventario | `GET /producto/total-inventario` | Conectado (maneja 404 inventario vacío) |
| Alerta Bajo Stock | `GET /producto/acabarse` | Conectado (umbral ≤10% de stock inicial) |
| Crear Producto | `POST /producto/crear` | Conectado |
| Actualizar Producto | `PATCH /producto/actualizar/{id}` | Conectado |
| Eliminar Producto | `DELETE /producto/borrar-producto-por-id/{id}` | Conectado |
| Registrar Factura | `POST /factura/crear` | Conectado |
| *Búsqueda / Filtrado en API* | *No disponible en backend* | **Gap**: El backend retorna la lista completa sin parámetros de filtro; el filtrado reactivo se realiza en el cliente. |
| *Historial de Facturas* | *No disponible en backend* | **Gap**: Solo existe endpoint de creación `POST /factura/crear`. No hay endpoint `GET /factura` para consultar historial de ventas. |
