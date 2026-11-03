package com.dunamis.makeup.dto.auth;

/**
 * DTO inmutable para representar la sesión del usuario autenticado en /api/auth/me (RF-008).
 * Desacoplado de la entidad JPA Usuario para no exponer contraseñas ni detalles de persistencia.
 */
public record UsuarioResponse(
    String username,
    String fullName,
    String role
) {}
