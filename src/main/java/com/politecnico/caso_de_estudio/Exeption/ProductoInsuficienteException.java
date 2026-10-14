package com.politecnico.caso_de_estudio.Exeption;

public class ProductoInsuficienteException extends RuntimeException{
    public ProductoInsuficienteException(Long id){
        super("El producto con id: " + id + " no cuenta con la cantidad suficente para entregar");
    }

}
