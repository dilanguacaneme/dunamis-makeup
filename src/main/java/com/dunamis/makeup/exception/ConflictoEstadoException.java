package com.dunamis.makeup.exception;

/**
 * Excepción lanzada cuando una operación entra en conflicto con el estado actual del recurso
 * (ej. sobrepago en abonos, facturas ya anuladas, dependencias que impiden borrado, etc.).
 * Mapea a HTTP 409 Conflict.
 */
public class ConflictoEstadoException extends DunamisException {

    public ConflictoEstadoException(String message) {
        super(message);
    }

    public ConflictoEstadoException(String message, Throwable cause) {
        super(message, cause);
    }
}
