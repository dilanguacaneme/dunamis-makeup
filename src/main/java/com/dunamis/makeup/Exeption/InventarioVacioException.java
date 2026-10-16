package com.dunamis.makeup.Exeption;

public class InventarioVacioException extends RuntimeException{
    public InventarioVacioException() {
        super ("El inventario se encuntra vacio");
    }
}
