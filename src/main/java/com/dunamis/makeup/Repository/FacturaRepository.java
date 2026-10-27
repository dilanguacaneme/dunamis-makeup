package com.dunamis.makeup.Repository;

import com.dunamis.makeup.Entity.EstadoPagoFactura;
import com.dunamis.makeup.Entity.Factura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FacturaRepository extends JpaRepository<Factura, Long> {
    List<Factura> findAllByOrderByFechaDescIdDesc();
    List<Factura> findByVendedorUsuarioIgnoreCaseOrderByFechaDescIdDesc(String vendedorUsuario);
    Optional<Factura> findByIdAndVendedorUsuarioIgnoreCase(Long id, String vendedorUsuario);
    boolean existsByDetallesProductoId(Long productoId);

    List<Factura> findByEstadoPagoOrderByFechaDescIdDesc(EstadoPagoFactura estadoPago);
    List<Factura> findByAnuladaOrderByFechaDescIdDesc(Boolean anulada);
}
