package com.dunamis.makeup.dto.categoria;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO validado para creación de categorías (RF-001, RF-007).
 */
public record CrearCategoriaRequest(
    @NotBlank(message = "El nombre de la categoría es obligatorio")
    @Size(min = 2, max = 60, message = "El nombre de la categoría debe tener entre 2 y 60 caracteres")
    String nombre
) {}
