package com.dunamis.makeup.service;

import com.dunamis.makeup.entity.Categoria;
import com.dunamis.makeup.repository.CategoriaRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Sembrador inicial idempotente para categorías cosméticas base (Spec 008, RF-015).
 */
@Component
@Order(1)
public class CategoriasIniciales implements ApplicationRunner {

    private final CategoriaRepository categoriaRepository;

    public CategoriasIniciales(CategoriaRepository categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        List.of("Rostro", "Ojos", "Labios", "Cejas", "Cuidado Facial", "Accesorios").forEach(nombre ->
                categoriaRepository.findByNombreIgnoreCase(nombre)
                        .orElseGet(() -> categoriaRepository.save(new Categoria(nombre))));
    }
}
