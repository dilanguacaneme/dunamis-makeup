package com.dunamis.makeup.dto.marca;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;

/**
 * DTO validado para actualización parcial de marcas (RF-001, RF-011).
 */
public record ActualizarMarcaRequest(
    @Size(min = 2, max = 80, message = "El nombre de la marca debe tener entre 2 y 80 caracteres")
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
