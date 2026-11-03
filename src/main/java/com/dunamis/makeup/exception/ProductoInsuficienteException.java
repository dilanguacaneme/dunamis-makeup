package com.dunamis.makeup.exception;

/**
 * Excepción especializada cuando no hay existencias suficientes para facturar un producto.
 * Mapea a HTTP 409 Conflict.
 */
public class ProductoInsuficienteException extends ConflictoEstadoException {

    public ProductoInsuficienteException(Long id) {
        super("El producto con id: " + id + " no cuenta con la cantidad suficiente para entregar");
    }

    public ProductoInsuficienteException(String nombre, Long id, int existencias, int solicitadas) {
        super(String.format("Stock insuficiente para el producto '%s' (id: %d). Existencias disponibles: %d, solicitadas: %d",
                nombre, id, existencias, solicitadas));
    }
}
