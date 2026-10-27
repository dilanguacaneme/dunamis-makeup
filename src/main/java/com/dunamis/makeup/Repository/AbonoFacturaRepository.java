package com.dunamis.makeup.Repository;

import com.dunamis.makeup.Entity.AbonoFactura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AbonoFacturaRepository extends JpaRepository<AbonoFactura, Long> {
    List<AbonoFactura> findByFacturaIdOrderByFechaAscIdAsc(Long facturaId);
}
