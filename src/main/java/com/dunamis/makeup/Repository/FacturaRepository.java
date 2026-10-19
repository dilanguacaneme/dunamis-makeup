package com.dunamis.makeup.Repository;

import com.dunamis.makeup.Entity.Factura;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FacturaRepository extends JpaRepository<Factura, Long> {
    List<Factura> findAllByOrderByFechaDescIdDesc();
    List<Factura> findByVendedorUsuarioIgnoreCaseOrderByFechaDescIdDesc(String vendedorUsuario);
    Optional<Factura> findByIdAndVendedorUsuarioIgnoreCase(Long id, String vendedorUsuario);
}
