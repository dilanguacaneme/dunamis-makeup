package com.politecnico.caso_de_estudio.Repository;

import com.politecnico.caso_de_estudio.Entity.Factura;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacturaRepository extends JpaRepository<Factura, Long> {}
