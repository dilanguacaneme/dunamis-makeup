package com.dunamis.makeup.dto.marca;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO validado para creación de marcas (RF-001, RF-007).
 */
public record CrearMarcaRequest(
    @NotBlank(message = "El nombre de la marca es obligatorio")
    @Size(min = 2, max = 80, message = "El nombre de la marca debe tener entre 2 y 80 caracteres")
    String nombre
) {}
