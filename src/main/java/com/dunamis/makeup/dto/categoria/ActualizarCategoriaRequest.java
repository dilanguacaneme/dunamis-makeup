package com.dunamis.makeup.dto.categoria;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;

/**
 * DTO validado para actualización parcial de categorías (RF-001, RF-011).
 */
public record ActualizarCategoriaRequest(
    @Size(min = 2, max = 60, message = "El nombre de la categoría debe tener entre 2 y 60 caracteres")
    String nombre,

    Boolean activa
) {
    @AssertTrue(message = "Debe especificar al menos un campo para actualizar ('nombre' o 'activa')")
    public boolean isValido() {
        if (nombre == null && activa == null) {
            return false;
        }
        if (nombre != null && nombre.trim().isEmpty()) {
            return false;
        }
        return true;
    }
}
