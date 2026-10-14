package com.politecnico.caso_de_estudio.Repository;

import com.politecnico.caso_de_estudio.Entity.DetalleFactura;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DetalleFacturaRepository extends JpaRepository<DetalleFactura, Long> {}