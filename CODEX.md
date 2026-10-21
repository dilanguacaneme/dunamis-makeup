# CODEX.md — Directrices para Asistentes y LLMs

## Contexto del Repositorio
Dunamis Makeup es un monorepo que contiene:
- `src/`: Backend Spring Boot (Java 17, Maven).
- `frontend/`: Frontend React 19 (TypeScript, Vite).
- `docs/`: Documentación, constitución y arquitectura.
- `specs/`: Especificaciones formales del método SDD (`001`, `002`, etc.).

## Directrices Operativas
1. **Regla de Oro SDD:** Antes de implementar o modificar lógica, consulta la especificación activa en `specs/` y `docs/constitution.md`.
2. **Entorno de Ejecución:** El sistema corre en Windows con PowerShell. Utiliza comandos compatibles (`.\mvnw.cmd`, rutas relativas o directas con barras compatibles).
3. **Manejo de Errores en Backend:** Priorizar respuestas HTTP estándar con códigos semánticos (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`).
4. **Seguridad y CSRF:** Todo endpoint protegido bajo sesión requiere verificación de cookie `JSESSIONID` y cabecera `X-XSRF-TOKEN` (obtenida previamente de `/api/auth/csrf`).
5. **Aislamiento en Tests:** Asegurar que los tests de backend puedan correr sin depender de una base de datos externa productiva o hardcodeada cuando sea posible.

## Checklist de Verificación Rápida
- [ ] ¿Se respetó el principio de no modificar `main` directamente?
- [ ] ¿Los contratos de API cumplen la especificación correspondiente?
- [ ] ¿`npm --prefix frontend run lint` reporta 0 advertencias?
- [ ] ¿`npm --prefix frontend run build` genera el bundle sin errores de TypeScript?
- [ ] ¿`.\mvnw.cmd test-compile` compila el backend sin fallos?
