package com.dunamis.makeup.dto.auth;

/**
 * DTO inmutable para respuesta de handshake CSRF (RF-001).
 * Formato estandarizado: { "ready": true }
 */
public record CsrfResponse(
    boolean ready
) {}
