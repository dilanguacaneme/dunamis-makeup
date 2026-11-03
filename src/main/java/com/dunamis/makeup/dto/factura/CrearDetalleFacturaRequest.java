package com.dunamis.makeup.dto.factura;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CrearDetalleFacturaRequest(
    @NotNull(message = "El ID del producto es obligatorio")
    Long productoId,

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser mayor que cero")
    Integer cantidad
) {}
