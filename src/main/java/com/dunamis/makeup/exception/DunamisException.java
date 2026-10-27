package com.dunamis.makeup.exception;

/**
 * Excepción base no comprobada para todas las excepciones del dominio Dunamis Makeup.
 */
public abstract class DunamisException extends RuntimeException {

    public DunamisException(String message) {
        super(message);
    }

    public DunamisException(String message, Throwable cause) {
        super(message, cause);
    }
}
