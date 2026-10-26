package com.dunamis.makeup.service;

import com.dunamis.makeup.Entity.Marca;
import com.dunamis.makeup.Repository.MarcaRepository;
import com.dunamis.makeup.Service.MarcasIniciales;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas Unitarias - Sembrado Inicial de Marcas (RF-016)")
class MarcasInicialesTest {

    @Mock
    private MarcaRepository marcaRepository;

    @InjectMocks
    private MarcasIniciales marcasIniciales;

    @Test
    @DisplayName("Debe sembrar las 4 marcas base cuando la base de datos está vacía")
    void testSembradoBaseVacia() {
        when(marcaRepository.findByNombreIgnoreCase(anyString())).thenReturn(Optional.empty());

        marcasIniciales.run(null);

        ArgumentCaptor<Marca> captor = ArgumentCaptor.forClass(Marca.class);
        verify(marcaRepository, times(4)).save(captor.capture());

        var nombres = captor.getAllValues().stream().map(Marca::getNombre).toList();
        assertTrue(nombres.contains("Trendy"));
        assertTrue(nombres.contains("Purpure"));
        assertTrue(nombres.contains("Milagros"));
        assertTrue(nombres.contains("Magna"));
    }

    @Test
    @DisplayName("Debe ser idempotente y no sobreescribir ni duplicar si las marcas ya existen")
    void testSembradoIdempotenteConMarcasExistentes() {
        Marca trendyInactiva = new Marca("Trendy");
        trendyInactiva.setActiva(false);

        when(marcaRepository.findByNombreIgnoreCase("Trendy")).thenReturn(Optional.of(trendyInactiva));
        when(marcaRepository.findByNombreIgnoreCase("Purpure")).thenReturn(Optional.of(new Marca("Purpure")));
        when(marcaRepository.findByNombreIgnoreCase("Milagros")).thenReturn(Optional.of(new Marca("Milagros")));
        when(marcaRepository.findByNombreIgnoreCase("Magna")).thenReturn(Optional.of(new Marca("Magna")));

        marcasIniciales.run(null);

        verify(marcaRepository, never()).save(any(Marca.class));
        assertEquals(false, trendyInactiva.getActiva(), "No debe alterar el estado inactivo de marcas previas");
    }
}
