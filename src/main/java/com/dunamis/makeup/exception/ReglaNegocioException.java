package com.dunamis.makeup.exception;

/**
 * Excepción lanzada ante violaciones de validaciones o reglas de negocio de la aplicación.
 * Mapea a HTTP 400 Bad Request.
 */
public class ReglaNegocioException extends DunamisException {

    public ReglaNegocioException(String message) {
        super(message);
    }

    public ReglaNegocioException(String message, Throwable cause) {
        super(message, cause);
    }
}
