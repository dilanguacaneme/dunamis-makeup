package com.dunamis.makeup.dto.common;

/**
 * DTO inmutable para respuestas uniformes de error en la API (Principio 11 de la Constitución).
 * Formato estandarizado: { "error": "...", "message": "...", "timestamp": ... }
 */
public record ErrorResponse(
    String error,
    String message,
    long timestamp
) {
    /**
     * Crea una instancia de ErrorResponse con el timestamp actual en milisegundos.
     *
     * @param error   código o identificador semántico del error (ej. "UNAUTHORIZED", "FORBIDDEN")
     * @param message descripción legible del error
     * @return nueva instancia de ErrorResponse
     */
    public static ErrorResponse of(String error, String message) {
        return new ErrorResponse(error, message, System.currentTimeMillis());
    }
}
