package com.dunamis.makeup.service;

import com.dunamis.makeup.entity.Categoria;
import com.dunamis.makeup.repository.CategoriaRepository;
import com.dunamis.makeup.repository.ProductoRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Sembrador inicial idempotente para categorías cosméticas base (Spec 008, RF-015, RF-018).
 */
@Component
@Order(1)
public class CategoriasIniciales implements ApplicationRunner {

    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;

    public CategoriasIniciales(CategoriaRepository categoriaRepository, ProductoRepository productoRepository) {
        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        List.of("Rostro", "Ojos", "Labios", "Cejas", "Cuidado Facial", "Accesorios").forEach(nombre ->
                categoriaRepository.findByNombreIgnoreCase(nombre)
                        .orElseGet(() -> categoriaRepository.save(new Categoria(nombre))));

        // Backfill brownfield: asignar categoría por defecto a productos históricos sin categoría
        Categoria defaultCat = categoriaRepository.findByNombreIgnoreCase("Rostro").orElse(null);
        if (defaultCat != null) {
            productoRepository.findAll().stream()
                    .filter(p -> p.getCategoria() == null)
                    .forEach(p -> {
                        p.setCategoria(defaultCat);
                        productoRepository.save(p);
                    });
        }
    }
}
