package com.dunamis.makeup.dto.producto;

import com.dunamis.makeup.Entity.CategoriaProducto;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

        @NotNull(message = "La categoría no puede estar vacía")
        CategoriaProducto categoria,

        @NotNull(message = "Seleccione una marca para el producto")
        Long marcaId
) {}
