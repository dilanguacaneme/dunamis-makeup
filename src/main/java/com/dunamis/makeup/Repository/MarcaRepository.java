package com.dunamis.makeup.Repository;

import com.dunamis.makeup.Entity.Marca;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MarcaRepository extends JpaRepository<Marca, Long> {
    Optional<Marca> findByNombreIgnoreCase(String nombre);
    List<Marca> findByActivaTrueOrderByNombreAsc();
    List<Marca> findAllByOrderByNombreAsc();
}
