package com.dunamis.makeup.dto.factura;

import com.dunamis.makeup.entity.AbonoFactura;
import com.dunamis.makeup.entity.MedioPago;

import java.time.LocalDateTime;

public record AbonoResponse(
    Long id,
    Long facturaId,
    Double monto,
    LocalDateTime fecha,
    MedioPago medioPago,
    String notas,
    String usuarioRegistro
) {
    public static AbonoResponse fromEntity(AbonoFactura abono) {
        Long fId = abono.getFactura() != null ? abono.getFactura().getId() : null;
        return new AbonoResponse(
                abono.getId(),
                fId,
                abono.getMonto(),
                abono.getFecha(),
                abono.getMedioPago(),
                abono.getNotas(),
                abono.getUsuarioRegistro()
        );
    }
}
