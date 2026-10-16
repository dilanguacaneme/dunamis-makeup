package com.dunamis.makeup.Service;

import com.dunamis.makeup.Entity.*;
import com.dunamis.makeup.Exeption.ProductoInsuficienteException;
import com.dunamis.makeup.Exeption.ProductoNoEncontradoException;
import com.dunamis.makeup.Repository.ProductoRepository;
import com.dunamis.makeup.Repository.FacturaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FacturaService {

    @Autowired
    private FacturaRepository facturaRepository;
    @Autowired
    private ProductoRepository productoRepository;

    @Transactional
    public Factura crearFactura(Factura factura) {

        double totalFactura = 0.0;

        for (DetalleFactura detalle : factura.getDetalles()) {

            Producto producto = productoRepository.findById(detalle.getProducto().getId())
                    .orElseThrow(() -> new ProductoNoEncontradoException(detalle.getProducto().getId()));

            if ( detalle.getCantidad() <= producto.getCantidad()){

                double subtotal = producto.getPrecio() * detalle.getCantidad();

                Integer nuevaCantidad = producto.getCantidad() - detalle.getCantidad();
                detalle.setProducto(producto);
                producto.setCantidad(nuevaCantidad);
                Double nuevoTotalProducto  = producto.getCantidad() * producto.getPrecio();
                producto.setTotalProducto(nuevoTotalProducto);
                detalle.setSubtotal(subtotal);
                detalle.setFactura(factura);

                totalFactura += subtotal;
            } else {
                throw new ProductoInsuficienteException(producto.getId());
            }
        }

        factura.setTotal(totalFactura);

        return facturaRepository.save(factura);
    }
}
