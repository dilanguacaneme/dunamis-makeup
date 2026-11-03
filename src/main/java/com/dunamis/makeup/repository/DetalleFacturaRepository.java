package com.dunamis.makeup.repository;

import com.dunamis.makeup.entity.DetalleFactura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DetalleFacturaRepository extends JpaRepository<DetalleFactura, Long> {
    boolean existsByProductoId(Long productoId);
}
