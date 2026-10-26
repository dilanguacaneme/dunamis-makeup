package com.dunamis.makeup.Repository;

import com.dunamis.makeup.Entity.DetalleFactura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DetalleFacturaRepository extends JpaRepository<DetalleFactura, Long> {
    boolean existsByProductoId(Long productoId);
}
