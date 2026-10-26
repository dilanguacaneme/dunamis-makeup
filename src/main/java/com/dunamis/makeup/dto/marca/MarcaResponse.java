package com.dunamis.makeup.dto.marca;

import com.dunamis.makeup.Entity.Marca;

/**
 * DTO inmutable de salida para la entidad Marca (Principio 2 de la Constitución).
 */
public record MarcaResponse(
    Long id,
    String nombre,
    Boolean activa
) {
    public static MarcaResponse fromEntity(Marca marca) {
        if (marca == null) {
            return null;
        }
        return new MarcaResponse(
            marca.getId(),
            marca.getNombre(),
            marca.getActiva()
        );
    }
}
