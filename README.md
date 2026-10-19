# Dunamis Makeup

Backend privado para gestionar productos, existencias y ventas de la tienda.

## Requisitos

- Java 17 o posterior.
- PostgreSQL instalado y una base de datos llamada `dunamis_makeup`.
- Contraseñas iniciales para las dos cuentas administradoras.

Crea la base de datos desde `psql` o pgAdmin antes de iniciar la aplicación.
Con `psql`, puedes usar `CREATE DATABASE dunamis_makeup;`.

La aplicación usa PostgreSQL. Si antes guardabas información en MySQL, esta
configuración no la copia ni la elimina: los datos de MySQL permanecen allí y
habría que migrarlos por separado si se necesitan en PostgreSQL.

## Configuración local en PowerShell

Define estas variables en la terminal antes de iniciar Spring Boot. Usa claves
propias de al menos 12 caracteres y no las agregues al repositorio:

```powershell
$env:DB_USERNAME = "postgres"
$env:DB_PASSWORD = "tu-clave-de-postgres"
$env:ADMIN_MARYURI_PASSWORD = "una-clave-larga-para-maryuri"
$env:ADMIN_CATERIN_PASSWORD = "otra-clave-larga-para-caterin"
```

La aplicación crea las cuentas al iniciar si todavía no existen. Los nombres de
usuario son `maryuri` y `caterin`. Debes configurar ambas claves en el primer
inicio; si falta una, la aplicación indica cuál variable hace falta. Las
contraseñas se guardan con BCrypt y no se actualizan automáticamente en cada
inicio. No hay endpoint de registro público.

Inicia el backend con:

```powershell
.\mvnw.cmd spring-boot:run
```

El backend queda disponible en `http://localhost:8080`. Puedes configurar la
conexión con `DB_URL`, `DB_USERNAME` y `DB_PASSWORD`. El origen permitido para
React se configura con `APP_CORS_ALLOWED_ORIGINS`; por defecto admite los puertos
5173 y 5174 de localhost.

## Sesión desde React

La autenticación usa una sesión de servidor y cookies. Las solicitudes del
navegador deben usar `credentials: "include"`.

1. Solicita `GET /api/auth/csrf`. El servidor crea la cookie `XSRF-TOKEN`.
2. Envía el inicio de sesión a `POST /api/auth/login` como formulario URL-encoded
   (`username` y `password`), incluyendo el valor de `XSRF-TOKEN` en la cabecera
   `X-XSRF-TOKEN`.
3. Consulta `GET /api/auth/me` para obtener el usuario autenticado.
4. Incluye `X-XSRF-TOKEN` en las solicitudes `POST`, `PATCH` y `DELETE`, incluido
   `POST /api/auth/logout`. Vuelve a solicitar `/api/auth/csrf` después de iniciar
   o cerrar sesión para obtener el token vigente.

Los endpoints de productos y facturas requieren una sesión autenticada con rol
Los permisos se describen en la seccion de roles y permisos.

## Inventario, marcas y ventas

El backend incluye un catalogo de marcas. Al iniciar se agregan Trendy,
Purpure, Milagros y Magna si aun no existen. `GET /marcas` devuelve las marcas
activas; `POST /marcas` permite al administrador agregar mas, y `PATCH
/marcas/{id}` permite cambiar el nombre o desactivar una marca. Los productos
existentes pueden conservarse sin marca durante la actualizacion; los productos
nuevos deben incluir `marca: { "id": ... }`.

Las existencias aceptan enteros desde cero. Una venta no puede usar cantidades
negativas ni superar el stock actual. `GET /producto/acabarse` devuelve
productos agotados (cantidad cero). El inventario puede reabastecerse por encima
de la cantidad con la que se creo originalmente.

Una factura requiere el nombre del cliente, puede incluir su telefono y debe
tener al menos un detalle. El cuerpo de `POST /factura/crear` conserva la forma
de producto por id, por ejemplo:

```json
{
  "cliente": "Nombre del cliente",
  "telefonoCliente": "3001234567",
  "detalles": [
    { "producto": { "id": 1 }, "cantidad": 2 }
  ]
}
```

El backend calcula los subtotales y el total, registra quien hizo la venta y
descuenta las existencias dentro de una transaccion. El historial se consulta
con `GET /factura/obtener-facturas` y el detalle con
`GET /factura/obtener-factura-por-id/{id}`.

## Roles y permisos

El enum `RolUsuario` define `ADMIN` y `VENDEDOR`. Las cuentas actuales se crean
como `ADMIN`; al iniciar, los registros anteriores sin rol se completan como
administradores. No hay registro publico ni pantalla para crear vendedores por
ahora. Un usuario `VENDEDOR` puede consultar productos y marcas, crear facturas
y consultar solo sus propias facturas. `ADMIN` puede gestionar productos y
marcas, y consultar todas las facturas.

Hibernate agrega las nuevas tablas y columnas al iniciar porque
`spring.jpa.hibernate.ddl-auto=update`. La marca de productos antiguos y los
datos de vendedor de facturas existentes quedan vacios; no se borran productos
ni facturas. Conserva una copia de seguridad de la base de datos antes de
iniciar esta version.
