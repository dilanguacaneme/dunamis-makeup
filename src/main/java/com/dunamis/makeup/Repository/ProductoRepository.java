package com.dunamis.makeup.Repository;

import com.dunamis.makeup.Entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    List<Producto> findByActivoTrueOrderByNombreAsc();

    List<Producto> findAllByOrderByNombreAsc();

    @Query("SELECT p FROM Producto p WHERE p.activo = true AND p.cantidad <= :umbral ORDER BY p.cantidad ASC")
    List<Producto> obtenerProductosPocoStock(@Param("umbral") Integer umbral);

    default List<Producto> obtenerProductosPocoStock() {
        return obtenerProductosPocoStock(0);
    }

    @Query("SELECT COALESCE(SUM(p.precio * p.cantidad), 0.0) FROM Producto p WHERE p.activo = true")
    Optional<Double> totalInventario();
}
