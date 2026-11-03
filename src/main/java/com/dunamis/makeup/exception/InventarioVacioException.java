package com.dunamis.makeup.exception;

/**
 * Excepción lanzada cuando se intenta consultar o procesar inventario y la base de datos está vacía.
 * Mapea a HTTP 404 Not Found o 400 Bad Request según contexto.
 */
public class InventarioVacioException extends RecursoNoEncontradoException {

    public InventarioVacioException() {
        super("El inventario se encuentra vacío");
    }

    public InventarioVacioException(String message) {
        super(message);
    }
}
