package com.politecnico.caso_de_estudio.Exeption;

public class InventarioVacioException extends RuntimeException{
    public InventarioVacioException() {
        super ("El inventario se encuntra vacio");
    }
}
