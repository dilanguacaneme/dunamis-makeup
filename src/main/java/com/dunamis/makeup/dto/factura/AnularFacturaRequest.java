package com.dunamis.makeup.dto.factura;

import jakarta.validation.constraints.Size;

public record AnularFacturaRequest(
    @Size(max = 500, message = "El motivo de anulación no puede superar 500 caracteres")
    String motivo
) {}
