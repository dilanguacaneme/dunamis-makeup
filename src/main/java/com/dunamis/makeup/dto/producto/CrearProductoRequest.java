package com.dunamis.makeup.dto.producto;

import com.dunamis.makeup.entity.CategoriaProducto;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CrearProductoRequest(
        @NotBlank(message = "El nombre del producto no puede estar vacío")
        @Size(min = 2, max = 120, message = "El nombre debe tener entre 2 y 120 caracteres")
        String nombre,

        @NotNull(message = "El precio del producto no puede estar vacío")
        @DecimalMin(value = "0.0", message = "El precio no puede ser negativo")
        Double precio,

        @NotNull(message = "La cantidad no puede estar vacía")
        @Min(value = 0, message = "Las existencias no pueden ser negativas")
        Integer cantidad,

        Long categoriaId,

        CategoriaProducto categoria,

        @NotNull(message = "Seleccione una marca para el producto")
        Long marcaId,

        @Pattern(regexp = "^(NO_APLICA|[1-9]|10)$", message = "El tono debe ser 'NO_APLICA' o un número del 1 al 10")
        String tono
) {
    public CrearProductoRequest {
        if (tono == null || tono.isBlank()) {
            tono = "NO_APLICA";
        }
    }

    @AssertTrue(message = "Seleccione una categoría para el producto")
    public boolean isCategoriaValida() {
        return categoriaId != null || categoria != null;
    }

    public CrearProductoRequest(String nombre, Double precio, Integer cantidad, CategoriaProducto categoria, Long marcaId) {
        this(nombre, precio, cantidad, null, categoria, marcaId, "NO_APLICA");
    }

    public CrearProductoRequest(String nombre, Double precio, Integer cantidad, Long categoriaId, CategoriaProducto categoria, Long marcaId) {
        this(nombre, precio, cantidad, categoriaId, categoria, marcaId, "NO_APLICA");
    }
}
