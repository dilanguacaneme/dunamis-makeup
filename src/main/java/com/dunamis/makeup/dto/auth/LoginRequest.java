package com.dunamis.makeup.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO inmutable para la solicitud de autenticación en /api/auth/login (RF-003, RF-004).
 * Valida los datos en la frontera de la API antes de delegar al servicio de autenticación.
 */
public record LoginRequest(
    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(max = 50, message = "El nombre de usuario no puede superar 50 caracteres")
    String username,

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 1, max = 120, message = "La contraseña tiene una longitud inválida")
    String password
) {}
