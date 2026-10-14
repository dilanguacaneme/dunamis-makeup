package com.politecnico.caso_de_estudio.Repository;

import com.politecnico.caso_de_estudio.Entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository <Producto, Long> {

   @Query("SELECT SUM(p.totalProducto) FROM Producto p")
    Optional<Double> totalInventario();

    // Trae solo los productos cuya cantidad actual sea <= al 10% de su cantidad inicial
    @Query("SELECT p FROM Producto p WHERE p.cantidad <= (p.cantidadInicial * 0.10)")
    List<Producto> obtenerProductosPocoStock();
}
