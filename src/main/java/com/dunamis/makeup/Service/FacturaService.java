package com.dunamis.makeup.Service;

import com.dunamis.makeup.Entity.*;
import com.dunamis.makeup.Exeption.ProductoInsuficienteException;
import com.dunamis.makeup.Exeption.ProductoNoEncontradoException;
import com.dunamis.makeup.Repository.ProductoRepository;
import com.dunamis.makeup.Repository.FacturaRepository;
import com.dunamis.makeup.Repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class FacturaService {

    @Autowired
    private FacturaRepository facturaRepository;
    @Autowired
    private ProductoRepository productoRepository;
    @Autowired
    private UsuarioRepository usuarioRepository;

    @Transactional
    public Factura crearFactura(Factura factura, String vendedorUsuario) {

        if (factura.getCliente() == null || factura.getCliente().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del cliente es obligatorio");
        }
        if (factura.getDetalles() == null || factura.getDetalles().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La factura debe tener al menos un producto");
        }

        factura.setCliente(factura.getCliente().trim());
        if (factura.getTelefonoCliente() != null) {
            factura.setTelefonoCliente(factura.getTelefonoCliente().trim());
        }
        factura.setVendedorUsuario(vendedorUsuario);
        factura.setVendedorNombre(usuarioRepository.findByNombreUsuarioIgnoreCase(vendedorUsuario)
                .map(usuario -> usuario.getNombreCompleto())
                .orElse(vendedorUsuario));

        double totalFactura = 0.0;

        for (DetalleFactura detalle : factura.getDetalles()) {

            if (detalle.getCantidad() == null || detalle.getCantidad() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cantidad de cada producto debe ser mayor que cero");
            }
            if (detalle.getProducto() == null || detalle.getProducto().getId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cada detalle debe identificar un producto");
            }

            Producto producto = productoRepository.findById(detalle.getProducto().getId())
                    .orElseThrow(() -> new ProductoNoEncontradoException(detalle.getProducto().getId()));

            if (detalle.getCantidad() <= producto.getCantidad()){

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

    @Transactional(readOnly = true)
    public List<Factura> listarFacturas(boolean administrador, String vendedorUsuario) {
        return administrador
                ? facturaRepository.findAllByOrderByFechaDescIdDesc()
                : facturaRepository.findByVendedorUsuarioIgnoreCaseOrderByFechaDescIdDesc(vendedorUsuario);
    }

    @Transactional(readOnly = true)
    public Factura buscarFactura(Long id, boolean administrador, String vendedorUsuario) {
        return (administrador
                ? facturaRepository.findById(id)
                : facturaRepository.findByIdAndVendedorUsuarioIgnoreCase(id, vendedorUsuario))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Factura no encontrada"));
    }
}
