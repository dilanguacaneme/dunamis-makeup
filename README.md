# Dunamis Makeup — Sistema Fullstack de Inventario, POS y Facturación

Plataforma integral de software para la gestión comercial, control de existencias en tiempo real y facturación transaccional de la tienda de cosméticos **Dunamis Makeup**.

Desarrollada bajo la metodología **Spec-Driven Development (SDD)**, aplicando estándares de arquitectura limpia, contratos API estrictos con DTOs, seguridad robusta basada en sesiones y roles (RBAC), e integridad transaccional atómica.

---

## Aspectos Destacados de Ingeniería (Engineering Highlights)

Este proyecto fue diseñado con enfoque profesional en mantenibilidad, seguridad y rendimiento:

- **Transaccionalidad Atómica (`@Transactional`):** El motor de facturación asegura que la venta, la asignación del vendedor y el descuento de inventario se ejecuten como una única unidad atómica. Si se cancela una factura, las existencias se restituyen automáticamente. Prohibición estricta de stock negativo a nivel de dominio.
- **Seguridad & RBAC en Profundidad:** 
  - Sesiones gestionadas en servidor con cookies seguras y apretón de manos CSRF (`CookieCsrfTokenRepository` con validación de cabecera `X-XSRF-TOKEN`).
  - Cifrado de credenciales mediante `BCrypt`.
  - Control de acceso por roles (`ADMIN` y `VENDEDOR`) en endpoints REST (Spring Security) y vistas de usuario (React Guards).
- **Integridad Referencial y Borrado Lógico (*Soft Delete*):** Protección de auditoría contable: los productos con facturas históricas no pueden ser eliminados físicamente de la base de datos, garantizando la trazabilidad histórica de ventas.
- **Contratos API Tipados y Errores Uniformes:**
  - Comunicación exclusiva mediante DTOs validados (`jakarta.validation`). Las entidades JPA nunca se exponen al exterior.
  - Manejo centralizado de excepciones con `GlobalExceptionHandler` retornando payloads estructurados RFC 7807 (cero volcados de stack trace o respuestas en texto plano).
- **Modo Demostración Aislado (*Zero-Config Demo*):** Para facilitar evaluaciones rápidas sin requerir levantar PostgreSQL localmente, el frontend cuenta con una capa de almacenamiento mock en `localStorage` (`demoStore`) que replica la lógica de negocio, roles, inventario y estados de pago.
- **Suite de Pruebas Automatizadas:** Cobertura de más de **170 pruebas unitarias y de integración** (MockMvc, JUnit 5, H2 in-memory para tests aislados, y pruebas de interfaz).

---

## Stack Tecnológico

| Capa | Tecnologías Clave |
| :--- | :--- |
| **Backend** | Java 17, Spring Boot 4, Spring Data JPA, Spring Security, Hibernate |
| **Base de Datos** | PostgreSQL (Producción/Local), H2 In-Memory (Suite de Pruebas Aisladas) |
| **Frontend** | React 19, TypeScript, Vite, Lucide Icons, html2canvas, jsPDF |
| **Calidad & Linter** | Oxlint (Frontend linter de alta velocidad), Maven Surefire, JUnit 5 |
| **Metodología** | Spec-Driven Development (SDD), Git Feature Branches, Conventional Commits |

---

## Funcionalidades Principales

1. **Gestión de Inventario y Marcas:**
   - Catálogo de productos organizado por zonas cosméticas (`ROSTRO`, `CEJAS`, `LABIOS`, `OJOS`).
   - Control de marcas con normalización canónica y reactivación lógica.
   - Indicador de estado de existencias (saludable vs. crítico).
   - Valuación total del inventario en tiempo real.
2. **Punto de Venta Rápido (POS):**
   - Búsqueda reactiva instantánea por nombre o código de referencia.
   - Creación de facturas con cálculo automático de subtotales, totales y asignación de vendedor.
   - Exportación de facturas y comprobantes a formato **PDF**.
3. **Control de Abonos y Estados de Pago (Módulo Cartera):**
   - Seguimiento del estado de pago de cada factura: `PENDIENTE`, `PAGADO_PARCIAL` o `PAGADA`.
   - Registro de abonos parciales con validación de saldo restante.
4. **Cajón Lateral de Reposición Urgente:**
   - Panel de acceso directo para identificar referencias agotadas o por agotarse y facilitar su reabastecimiento en un clic.

---

## Arquitectura del Proyecto

```text
dunamis-makeup/
├── docs/                        # Constitución técnica y reglas de arquitectura SDD
├── specs/                       # Especificaciones formales (Spec 001 a Spec 007)
├── src/main/java/com/dunamis/makeup/
│   ├── controller/              # Controladores REST tipados (Auth, Marca, Producto, Factura)
│   ├── dto/                     # Request/Response Data Transfer Objects con validación
│   ├── entity/                  # Modelos JPA (Producto, Marca, Factura, Usuario, Pago)
│   ├── exception/               # Jerarquía de excepciones de dominio y GlobalExceptionHandler
│   ├── repository/             # Repositorios Spring Data JPA
│   ├── security/               # Configuración de Spring Security, CSRF, filtros y RBAC
│   └── service/                # Lógica transaccional de negocio
├── src/test/java/               # 170+ tests unitarios y de integración con perfil H2 aislado
└── frontend/
    ├── src/
    │   ├── components/         # Componentes UI (Catálogo, POS, Facturas, Auditoría, Modales)
    │   ├── context/            # Proveedores de estado global (Auth, Toast, etc.)
    │   ├── services/           # Clientes HTTP con manejo de tokens CSRF y cookies
    │   ├── store/              # Modo Demostración offline (demoStore con persistencia local)
    │   ├── types/              # Definiciones TypeScript centralizadas
    │   └── styles/             # Tokens de diseño editorial cosmético
```

---

## Puesta en Marcha Local

### Opción 1: Vista Rápida en Modo Demostración (Sin base de datos)
Ideal para reclutadores o revisiones de interfaz en menos de 2 minutos:

```powershell
# 1. Entrar al frontend e instalar dependencias
cd frontend
npm install

# 2. Iniciar servidor de desarrollo
npm run dev
```

Abre `http://localhost:5173` en tu navegador y selecciona **"Modo Demostración"** en la pantalla de inicio para explorar el sistema con datos cosméticos preconfigurados y persistentes en el navegador.

---

### Opción 2: Entorno Fullstack Completo (Backend + PostgreSQL + Frontend)

#### Prerrequisitos:
- Java 17 o superior instalado.
- PostgreSQL en ejecución con una base de datos llamada `dunamis_makeup`.
- Node.js (v18+) y npm.

#### 1. Configurar variables de entorno e iniciar Backend
En una terminal PowerShell en la raíz del proyecto:

```powershell
# Configuración de base de datos
$env:DB_USERNAME = "postgres"
$env:DB_PASSWORD = "tu-contraseña-postgres"

# Contraseñas maestras para el sembrado inicial de administradores
$env:ADMIN_MARYURI_PASSWORD = "clave-segura-maryuri"
$env:ADMIN_CATERIN_PASSWORD = "clave-segura-caterin"

# Iniciar servidor Spring Boot
.\mvnw.cmd spring-boot:run
```
El backend estará disponible en `http://localhost:8080`. Creará automáticamente las tablas y los usuarios administradores iniciales de forma idempotente con contraseñas encriptadas en BCrypt.

#### 2. Iniciar el Frontend
En una segunda terminal:

```powershell
cd frontend
npm install
npm run dev
```
Accede a `http://localhost:5173` e inicia sesión con el usuario `maryuri` o `caterin` y la clave que configuraste en tus variables de entorno.

---

## Verificación de Calidad y Pruebas

Para garantizar que el código se mantenga libre de regresiones:

```powershell
# Ejecutar suite de pruebas completa del backend (JUnit 5 + MockMvc)
.\mvnw.cmd test

# Verificar linter del frontend (Oxlint)
npm --prefix frontend run lint

# Verificar tipado y empaquetado de producción del frontend
npm --prefix frontend run build
```

---

## Resumen de Contratos API REST

| Módulo | Método | Endpoint | Rol Mínimo | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `GET` | `/api/auth/csrf` | Público | Obtiene cookie y token CSRF `XSRF-TOKEN` |
| **Auth** | `POST` | `/api/auth/login` | Público | Autenticación JSON con sesión `HttpOnly` |
| **Auth** | `GET` | `/api/auth/me` | Autenticado | Retorna los datos y rol del usuario actual |
| **Auth** | `POST` | `/api/auth/logout` | Autenticado | Cierre de sesión e invalidación |
| **Marcas** | `GET` | `/marcas` | Vendedor | Lista las marcas activas del catálogo |
| **Marcas** | `POST` | `/marcas` | Admin | Crea una nueva marca cosmética |
| **Marcas** | `PATCH` | `/marcas/{id}` | Admin | Modifica o desactiva (soft-delete) una marca |
| **Productos** | `GET` | `/producto/obtener-productos` | Vendedor | Lista productos activos con stock y precios |
| **Productos** | `GET` | `/producto/total-inventario` | Admin | Valuación financiera consolidada del inventario |
| **Productos** | `GET` | `/producto/acabarse` | Vendedor | Alerta de productos con existencias en cero |
| **Productos** | `POST` | `/producto/crear` | Admin | Da de alta un nuevo producto |
| **Productos** | `PATCH` | `/producto/actualizar/{id}` | Admin | Modifica existencias, precio o datos |
| **Productos** | `DELETE` | `/producto/borrar-producto-por-id/{id}` | Admin | Borrado lógico si tiene historial contable |
| **Facturas** | `POST` | `/factura/crear` | Vendedor | Genera venta y descuenta stock atómicamente |
| **Facturas** | `GET` | `/factura/obtener-facturas` | Vendedor* | Historial (*Vendedor ve propias; Admin ve todas) |
| **Facturas** | `GET` | `/factura/obtener-factura-por-id/{id}` | Vendedor | Consulta detalle de venta y comprobante |
| **Facturas** | `PATCH` | `/factura/{id}/cancelar` | Admin | Cancela factura y restituye stock a inventario |
| **Facturas** | `POST` | `/factura/{id}/abonos` | Vendedor | Registra abonos y recalcula saldo pendiente |
