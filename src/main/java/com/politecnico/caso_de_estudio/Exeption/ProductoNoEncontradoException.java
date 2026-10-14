package com.politecnico.caso_de_estudio.Exeption;



public class ProductoNoEncontradoException extends RuntimeException{

    public ProductoNoEncontradoException (Long id){
        super("Producto con id: " + id + " no encontrado");
    }
}
