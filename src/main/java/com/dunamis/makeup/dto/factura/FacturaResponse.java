package com.dunamis.makeup.dto.factura;

import com.dunamis.makeup.Entity.Factura;
import com.dunamis.makeup.Entity.EstadoPagoFactura;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

public record FacturaResponse(
    Long id,
    String cliente,
    String telefonoCliente,
    String vendedorNombre,
    String vendedorUsuario,
    LocalDateTime fecha,
    Double total,
    EstadoPagoFactura estadoPago,
    Double valorAbonado,
    Double saldoPendiente,
    Boolean anulada,
    LocalDateTime fechaAnulacion,
    String motivoAnulacion,
    List<DetalleFacturaResponse> detalles,
    List<AbonoResponse> abonos
) {
    public static FacturaResponse fromEntity(Factura factura) {
        List<DetalleFacturaResponse> detallesDto = factura.getDetalles() != null
                ? factura.getDetalles().stream().map(DetalleFacturaResponse::fromEntity).toList()
                : Collections.emptyList();

        List<AbonoResponse> abonosDto = factura.getAbonos() != null
                ? factura.getAbonos().stream().map(AbonoResponse::fromEntity).toList()
                : Collections.emptyList();

        EstadoPagoFactura estado = factura.getEstadoPago() != null
                ? factura.getEstadoPago()
                : EstadoPagoFactura.PAGADA;

        Double abonado = factura.getValorAbonado() != null
                ? factura.getValorAbonado()
                : (factura.getTotal() != null ? factura.getTotal() : 0.0);

        Double saldo = factura.getSaldoPendiente() != null
                ? factura.getSaldoPendiente()
                : 0.0;

        Boolean isAnulada = factura.getAnulada() != null
                ? factura.getAnulada()
                : false;

        return new FacturaResponse(
                factura.getId(),
                factura.getCliente(),
                factura.getTelefonoCliente(),
                factura.getVendedorNombre(),
                factura.getVendedorUsuario(),
                factura.getFecha(),
                factura.getTotal() != null ? factura.getTotal() : 0.0,
                estado,
                abonado,
                saldo,
                isAnulada,
                factura.getFechaAnulacion(),
                factura.getMotivoAnulacion(),
                detallesDto,
                abonosDto
        );
    }
}
