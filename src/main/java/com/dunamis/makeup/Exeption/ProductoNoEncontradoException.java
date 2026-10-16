package com.dunamis.makeup.Exeption;



public class ProductoNoEncontradoException extends RuntimeException{

    public ProductoNoEncontradoException (Long id){
        super("Producto con id: " + id + " no encontrado");
    }
}
