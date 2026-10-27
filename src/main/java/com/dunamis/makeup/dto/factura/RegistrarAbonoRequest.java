package com.dunamis.makeup.dto.factura;

import com.dunamis.makeup.entity.MedioPago;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegistrarAbonoRequest(
    @NotNull(message = "El monto del abono es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto del abono debe ser mayor a cero")
    Double monto,

    @NotNull(message = "El medio de pago es obligatorio")
    MedioPago medioPago,

    @Size(max = 255, message = "Las notas no pueden superar 255 caracteres")
    String notas
) {}
