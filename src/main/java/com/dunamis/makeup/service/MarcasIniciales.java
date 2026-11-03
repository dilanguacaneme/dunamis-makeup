package com.dunamis.makeup.service;

import com.dunamis.makeup.entity.Marca;
import com.dunamis.makeup.repository.MarcaRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(1)
public class MarcasIniciales implements ApplicationRunner {

    private final MarcaRepository marcaRepository;

    public MarcasIniciales(MarcaRepository marcaRepository) {
        this.marcaRepository = marcaRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        List.of("Trendy", "Purpure", "Milagros", "Magna").forEach(nombre ->
                marcaRepository.findByNombreIgnoreCase(nombre)
                        .orElseGet(() -> marcaRepository.save(new Marca(nombre))));
    }
}
