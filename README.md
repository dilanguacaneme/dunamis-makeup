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
administrador.
