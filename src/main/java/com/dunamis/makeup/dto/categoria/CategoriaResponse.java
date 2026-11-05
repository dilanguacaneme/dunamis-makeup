package com.dunamis.makeup.dto.categoria;

import com.dunamis.makeup.entity.Categoria;

/**
 * DTO inmutable de salida para la entidad Categoria (Principio 2 de la Constitución, RF-001).
 */
public record CategoriaResponse(
    Long id,
    String nombre,
    Boolean activa
) {
    public static CategoriaResponse fromEntity(Categoria categoria) {
        if (categoria == null) {
            return null;
        }
        return new CategoriaResponse(
            categoria.getId(),
            categoria.getNombre(),
            categoria.getActiva()
        );
    }
}
