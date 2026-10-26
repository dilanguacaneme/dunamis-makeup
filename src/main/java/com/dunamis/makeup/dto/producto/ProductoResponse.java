package com.dunamis.makeup.dto.producto;

import com.dunamis.makeup.Entity.CategoriaProducto;
import com.dunamis.makeup.Entity.Producto;
import com.dunamis.makeup.dto.marca.MarcaResponse;

public record ProductoResponse(
        Long id,
        String nombre,
        Double precio,
        Integer cantidad,
        Integer cantidadInicial,
        Double totalProducto,
        CategoriaProducto categoria,
        MarcaResponse marca,
        Boolean activo
) {
    public static ProductoResponse fromEntity(Producto producto) {
        if (producto == null) {
            return null;
        }

        MarcaResponse marcaResponse = producto.getMarca() != null
                ? MarcaResponse.fromEntity(producto.getMarca())
                : null;

        Double precio = producto.getPrecio();
        Integer cantidad = producto.getCantidad();
        Double total = producto.getTotalProducto();
        if (total == null && precio != null && cantidad != null) {
            total = precio * cantidad;
        }

        Boolean activo = producto.getActivo() != null ? producto.getActivo() : Boolean.TRUE;

        return new ProductoResponse(
                producto.getId(),
                producto.getNombre(),
                precio,
                cantidad,
                producto.getCantidadInicial(),
                total,
                producto.getCategoria(),
                marcaResponse,
                activo
        );
    }
}
