package com.dunamis.makeup.dto.factura;

import com.dunamis.makeup.entity.DetalleFactura;

public record DetalleFacturaResponse(
    Long id,
    Long productoId,
    String productoNombre,
    Double precioUnitario,
    Integer cantidad,
    Double subtotal
) {
    public static DetalleFacturaResponse fromEntity(DetalleFactura detalle) {
        Long prodId = detalle.getProducto() != null ? detalle.getProducto().getId() : null;
        String prodNombre = detalle.getProducto() != null ? detalle.getProducto().getNombre() : "Producto Desconocido";
        Double precioUnit = detalle.getPrecioUnitario() != null
                ? detalle.getPrecioUnitario()
                : (detalle.getProducto() != null ? detalle.getProducto().getPrecio() : 0.0);
        return new DetalleFacturaResponse(
                detalle.getId(),
                prodId,
                prodNombre,
                precioUnit,
                detalle.getCantidad(),
                detalle.getSubtotal() != null ? detalle.getSubtotal() : 0.0
        );
    }
}
