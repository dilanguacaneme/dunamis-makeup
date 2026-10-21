# AGENTS.md — Dunamis Makeup

## Proyecto
Aplicación fullstack para la gestión de cosméticos, inventario y facturación de Dunamis Makeup:
- **Backend:** Spring Boot (Java 17) con Spring Data JPA, Spring Security (sesión basada en cookies y protección CSRF), PostgreSQL (`dunamis_makeup`).
- **Frontend:** SPA en React 19 con TypeScript y Vite (`frontend/`). Incluye catálogo visual, ventas rápidas, historial de facturas, drawer de agotados y modo demostración local (`demoStore`).

## Comandos Clave
- **Backend ejecutar:** `.\mvnw.cmd spring-boot:run` (requiere variables de entorno `DB_USERNAME`, `DB_PASSWORD`, `ADMIN_MARYURI_PASSWORD`, `ADMIN_CATERIN_PASSWORD`).
- **Backend compilar:** `.\mvnw.cmd test-compile`
- **Backend tests:** `.\mvnw.cmd test`
- **Frontend ejecutar:** `npm --prefix frontend run dev`
- **Frontend linter:** `npm --prefix frontend run lint`
- **Frontend build/typecheck:** `npm --prefix frontend run build`

## Estilo y Convenciones
- **Backend:** Java 17. Clases y entidades en PascalCase; métodos y atributos en camelCase. Uso de `@Transactional` en operaciones atómicas de stock y facturación. Respuestas tipadas con DTOs validados; no exponer entidades JPA directamente.
- **Frontend:** React 19 + TypeScript. Componentes funcionales en PascalCase (`components/`). Tipos centralizados en `frontend/src/types/index.ts`. Consistencia visual con `styles/theme.css` e iconos de `lucide-react`.
- **Idioma:** Mensajes de error, etiquetas de UI y documentación siempre en español. Identificadores coherentes con el dominio del proyecto (`Producto`, `Factura`, `Marca`, `Usuario`).

## Reglas Obligatorias
1. **Rama activa:** Trabajar exclusivamente sobre la rama de integración o feature activa (`intregacion-sdd`), nunca sobre `main`.
2. **Constitución y Specs:** Lee siempre `docs/constitution.md` y la spec activa en `specs/` antes de tocar código.
3. **Inmutabilidad de Specs:** No modifiques archivos dentro de `specs/` salvo instrucción explícita del usuario.
4. **Control de dependencias:** No agregues dependencias en `pom.xml` o `package.json` sin justificación técnica y aprobación previa.
5. **Persistencia e Integridad:** Prohibido el borrado físico de productos con facturas existentes (usar borrado lógico). Prohibido permitir existencias negativas.

## Al Terminar Cualquier Tarea
1. Ejecuta el linter y compilación del frontend: `npm --prefix frontend run lint` y `npm --prefix frontend run build`.
2. Verifica que el backend compile limpiamente con `.\mvnw.cmd test-compile` o ejecute tests con `.\mvnw.cmd test`.
3. Confirma explícitamente en tu respuesta que todas las verificaciones pasaron sin errores.
