package com.dunamis.makeup.Repository;

import com.dunamis.makeup.Entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository <Producto, Long> {

   @Query("SELECT SUM(p.totalProducto) FROM Producto p")
    Optional<Double> totalInventario();

    // En esta primera version la alerta se activa cuando el producto esta agotado.
    @Query("SELECT p FROM Producto p WHERE p.cantidad = 0")
    List<Producto> obtenerProductosPocoStock();
}
