package com.dunamis.makeup.exception;

/**
 * Excepción especializada para productos inexistentes en base de datos.
 * Mapea a HTTP 404 Not Found.
 */
public class ProductoNoEncontradoException extends RecursoNoEncontradoException {

    public ProductoNoEncontradoException(Long id) {
        super("Producto con id: " + id + " no encontrado");
    }

    public ProductoNoEncontradoException(String message) {
        super(message);
    }
}
