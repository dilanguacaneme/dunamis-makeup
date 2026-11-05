package com.dunamis.makeup.dto.producto;

import com.dunamis.makeup.entity.CategoriaProducto;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record ActualizarProductoRequest(
        @Size(min = 2, max = 120, message = "El nombre debe tener entre 2 y 120 caracteres")
        String nombre,

        @DecimalMin(value = "0.0", message = "El precio no puede ser negativo")
        Double precio,

        @Min(value = 0, message = "Las existencias no pueden ser negativas")
        Integer cantidad,

        Long categoriaId,

        CategoriaProducto categoria,

        Long marcaId,

        Boolean activo
) {
    @AssertTrue(message = "Debe especificar al menos un campo válido para actualizar")
    public boolean isAnyFieldPresent() {
        return (nombre != null && !nombre.isBlank()) ||
                precio != null ||
                cantidad != null ||
                categoriaId != null ||
                categoria != null ||
                marcaId != null ||
                activo != null;
    }

    public ActualizarProductoRequest(String nombre, Double precio, Integer cantidad, CategoriaProducto categoria, Long marcaId, Boolean activo) {
        this(nombre, precio, cantidad, null, categoria, marcaId, activo);
    }
}
