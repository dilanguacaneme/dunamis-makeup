# Constitución de Dunamis Makeup
1. Stack: Backend Java 17 con Spring Boot; frontend React 19 con TypeScript y Vite; DB PostgreSQL.
2. Contratos API: Comunicación exclusiva con DTOs validados; no exponer entidades JPA directamente.
3. Seguridad: Sesiones de servidor con protección CSRF obligatoria; credenciales solo por variables de entorno.
4. Integridad transaccional: Facturación y stock son atómicos (@Transactional); nunca permitir stock negativo.
5. Persistencia: Prohibido borrado físico de productos con facturas asociadas; usar borrado lógico.
6. Calidad: Cero advertencias en linter frontend (oxlint) y backend compilable limpiamente.
7. Ciclo SDD: Ninguna funcionalidad se modifica o codifica sin spec previa aprobada y verificable.
8. Pruebas Backend: Cada endpoint y regla de negocio debe contar con tests unitarios y de integración.
9. Pruebas Frontend: Los flujos críticos y estados de UI deben validarse con tests automatizados.
10. Límites: No añadir dependencias externas sin justificación técnica y validación de compatibilidad.
