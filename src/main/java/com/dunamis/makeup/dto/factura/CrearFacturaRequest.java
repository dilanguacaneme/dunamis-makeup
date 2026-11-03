package com.dunamis.makeup.dto.factura;

import com.dunamis.makeup.entity.EstadoPagoFactura;
import com.dunamis.makeup.entity.MedioPago;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CrearFacturaRequest(
    @NotBlank(message = "El nombre del cliente es obligatorio")
    @Size(max = 255, message = "El nombre del cliente no puede superar 255 caracteres")
    String cliente,

    @Size(max = 30, message = "El teléfono no puede superar 30 caracteres")
    String telefonoCliente,

    @NotEmpty(message = "La factura debe tener al menos un producto cosmético")
    List<@Valid CrearDetalleFacturaRequest> detalles,

    EstadoPagoFactura estadoPago,
    Double valorAbonado,
    MedioPago medioPagoInicial,
    @Size(max = 255, message = "Las notas de pago no pueden superar 255 caracteres")
    String notasPago
) {}
