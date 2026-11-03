package com.dunamis.makeup.dto.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Collections;
import java.util.Map;

/**
 * DTO inmutable para respuestas uniformes de error en la API (Principio 11 de la Constitución).
 * Formato estandarizado: { "error": "...", "message": "...", "timestamp": ..., "detalles": { ... } }
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
    String error,
    String message,
    long timestamp,
    Map<String, String> detalles
) {
    /**
     * Constructor secundario para compatibilidad con llamadas de 3 parámetros (sin detalles).
     */
    public ErrorResponse(String error, String message, long timestamp) {
        this(error, message, timestamp, null);
    }

    public static ErrorResponse of(String error, String message) {
        return new ErrorResponse(error, message, System.currentTimeMillis(), null);
    }

    public static ErrorResponse of(String error, String message, Map<String, String> detalles) {
        Map<String, String> immutableDetalles = (detalles != null && !detalles.isEmpty())
                ? Collections.unmodifiableMap(detalles)
                : null;
        return new ErrorResponse(error, message, System.currentTimeMillis(), immutableDetalles);
    }
}
