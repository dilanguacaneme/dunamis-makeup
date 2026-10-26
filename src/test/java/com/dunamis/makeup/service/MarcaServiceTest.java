package com.dunamis.makeup.service;

import com.dunamis.makeup.Entity.Marca;
import com.dunamis.makeup.Repository.MarcaRepository;
import com.dunamis.makeup.Service.MarcaService;
import com.dunamis.makeup.dto.marca.ActualizarMarcaRequest;
import com.dunamis.makeup.dto.marca.CrearMarcaRequest;
import com.dunamis.makeup.dto.marca.MarcaResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas Unitarias - MarcaService (RF-002, RF-003, RF-006, RF-008, RF-010)")
class MarcaServiceTest {

    @Mock
    private MarcaRepository marcaRepository;

    @InjectMocks
    private MarcaService marcaService;

    @Nested
    @DisplayName("Listado de Marcas")
    class ListadoTests {

        @Test
        @DisplayName("Debe listar únicamente marcas activas cuando incluirInactivas es false")
        void testListarSoloActivas() {
            Marca m1 = new Marca("Magna");
            m1.setId(1L);
            Marca m2 = new Marca("Trendy");
            m2.setId(2L);

            when(marcaRepository.findByActivaTrueOrderByNombreAsc()).thenReturn(List.of(m1, m2));

            List<MarcaResponse> resultado = marcaService.listarMarcas(false);

            assertEquals(2, resultado.size());
            assertEquals("Magna", resultado.get(0).nombre());
            assertTrue(resultado.get(0).activa());
            assertEquals("Trendy", resultado.get(1).nombre());
            verify(marcaRepository).findByActivaTrueOrderByNombreAsc();
            verify(marcaRepository, never()).findAllByOrderByNombreAsc();
        }

        @Test
        @DisplayName("Debe listar todas las marcas (activas e inactivas) cuando incluirInactivas es true")
        void testListarTodas() {
            Marca m1 = new Marca("Magna");
            m1.setId(1L);
            m1.setActiva(false);
            Marca m2 = new Marca("Trendy");
            m2.setId(2L);
            m2.setActiva(true);

            when(marcaRepository.findAllByOrderByNombreAsc()).thenReturn(List.of(m1, m2));

            List<MarcaResponse> resultado = marcaService.listarMarcas(true);

            assertEquals(2, resultado.size());
            assertFalse(resultado.get(0).activa());
            assertTrue(resultado.get(1).activa());
            verify(marcaRepository).findAllByOrderByNombreAsc();
        }
    }

    @Nested
    @DisplayName("Creación de Marcas")
    class CreacionTests {

        @Test
        @DisplayName("Debe normalizar el nombre colapsando espacios múltiples y crear la marca activa")
        void testCrearMarcaConNormalizacion() {
            CrearMarcaRequest request = new CrearMarcaRequest("   Trendy    Cosmetics   ");
            when(marcaRepository.findByNombreIgnoreCase("Trendy Cosmetics")).thenReturn(Optional.empty());

            Marca guardada = new Marca("Trendy Cosmetics");
            guardada.setId(10L);
            when(marcaRepository.save(any(Marca.class))).thenReturn(guardada);

            MarcaResponse response = marcaService.crearMarca(request);

            assertNotNull(response);
            assertEquals(10L, response.id());
            assertEquals("Trendy Cosmetics", response.nombre());
            assertTrue(response.activa());

            ArgumentCaptor<Marca> captor = ArgumentCaptor.forClass(Marca.class);
            verify(marcaRepository).save(captor.capture());
            assertEquals("Trendy Cosmetics", captor.getValue().getNombre());
            assertTrue(captor.getValue().getActiva());
        }

        @Test
        @DisplayName("Debe lanzar conflicto 409 cuando ya existe una marca con el mismo nombre insensible a mayúsculas")
        void testCrearMarcaDuplicadaLanzaConflicto() {
            CrearMarcaRequest request = new CrearMarcaRequest("trendy");
            Marca existente = new Marca("Trendy");
            existente.setId(1L);

            when(marcaRepository.findByNombreIgnoreCase("trendy")).thenReturn(Optional.of(existente));

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> marcaService.crearMarca(request));

            assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
            assertEquals("Ya existe una marca con ese nombre", ex.getReason());
            verify(marcaRepository, never()).save(any(Marca.class));
        }
    }

    @Nested
    @DisplayName("Actualización de Marcas")
    class ActualizacionTests {

        @Test
        @DisplayName("Debe permitir renombrar una marca con su mismo nombre de forma idempotente")
        void testActualizarMarcaRenombradoIdempotente() {
            Marca marca = new Marca("Trendy");
            marca.setId(1L);

            when(marcaRepository.findById(1L)).thenReturn(Optional.of(marca));
            when(marcaRepository.save(any(Marca.class))).thenAnswer(i -> i.getArgument(0));

            ActualizarMarcaRequest request = new ActualizarMarcaRequest("  Trendy  ", null);
            MarcaResponse response = marcaService.actualizarMarca(1L, request);

            assertEquals("Trendy", response.nombre());
            verify(marcaRepository, never()).findByNombreIgnoreCase(anyString());
        }

        @Test
        @DisplayName("Debe lanzar conflicto 409 cuando se intenta renombrar a un nombre usado por otra marca")
        void testActualizarMarcaNombreEnColision() {
            Marca marca1 = new Marca("Trendy");
            marca1.setId(1L);

            Marca marca2 = new Marca("Purpure");
            marca2.setId(2L);

            when(marcaRepository.findById(1L)).thenReturn(Optional.of(marca1));
            when(marcaRepository.findByNombreIgnoreCase("Purpure")).thenReturn(Optional.of(marca2));

            ActualizarMarcaRequest request = new ActualizarMarcaRequest("Purpure", null);

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> marcaService.actualizarMarca(1L, request));

            assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
            assertEquals("Ya existe una marca con ese nombre", ex.getReason());
        }

        @Test
        @DisplayName("Debe actualizar el estado activa a false (borrado lógico)")
        void testActualizarEstadoActivaFalse() {
            Marca marca = new Marca("Trendy");
            marca.setId(1L);
            marca.setActiva(true);

            when(marcaRepository.findById(1L)).thenReturn(Optional.of(marca));
            when(marcaRepository.save(any(Marca.class))).thenAnswer(i -> i.getArgument(0));

            ActualizarMarcaRequest request = new ActualizarMarcaRequest(null, false);
            MarcaResponse response = marcaService.actualizarMarca(1L, request);

            assertFalse(response.activa());
        }

        @Test
        @DisplayName("Debe lanzar NOT_FOUND 404 cuando la marca a actualizar no existe")
        void testActualizarMarcaInexistente() {
            when(marcaRepository.findById(99L)).thenReturn(Optional.empty());

            ActualizarMarcaRequest request = new ActualizarMarcaRequest("Nueva Marca", true);

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> marcaService.actualizarMarca(99L, request));

            assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
            assertEquals("Marca no encontrada", ex.getReason());
        }
    }
}
