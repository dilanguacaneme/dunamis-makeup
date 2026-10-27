package com.dunamis.makeup.exception;

/**
 * Excepción lanzada cuando una entidad solicitada (Producto, Marca, Factura, etc.) no existe.
 * Mapea a HTTP 404 Not Found.
 */
public class RecursoNoEncontradoException extends DunamisException {

    public RecursoNoEncontradoException(String message) {
        super(message);
    }

    public RecursoNoEncontradoException(String recurso, Long id) {
        super(String.format("%s no encontrado con id: %d", recurso, id));
    }

    public RecursoNoEncontradoException(String recurso, String identificador) {
        super(String.format("%s no encontrado: %s", recurso, identificador));
    }
}
