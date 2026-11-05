package com.dunamis.makeup.service;

import com.dunamis.makeup.dto.categoria.ActualizarCategoriaRequest;
import com.dunamis.makeup.dto.categoria.CategoriaResponse;
import com.dunamis.makeup.dto.categoria.CrearCategoriaRequest;
import com.dunamis.makeup.entity.Categoria;
import com.dunamis.makeup.exception.ConflictoEstadoException;
import com.dunamis.makeup.exception.RecursoNoEncontradoException;
import com.dunamis.makeup.repository.CategoriaRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas Unitarias - CategoriaService (Spec 008)")
class CategoriaServiceTest {

    @Mock
    private CategoriaRepository categoriaRepository;

    @InjectMocks
    private CategoriaService categoriaService;

    @Nested
    @DisplayName("Listado de Categorías")
    class ListadoTests {

        @Test
        @DisplayName("Debe listar únicamente categorías activas cuando incluirInactivas es false")
        void testListarSoloActivas() {
            Categoria c1 = new Categoria("Cejas");
            c1.setId(1L);
            Categoria c2 = new Categoria("Labios");
            c2.setId(2L);

            when(categoriaRepository.findByActivaTrueOrderByNombreAsc()).thenReturn(List.of(c1, c2));

            List<CategoriaResponse> resultado = categoriaService.listarCategorias(false);

            assertEquals(2, resultado.size());
            assertEquals("Cejas", resultado.get(0).nombre());
            assertTrue(resultado.get(0).activa());
            verify(categoriaRepository).findByActivaTrueOrderByNombreAsc();
            verify(categoriaRepository, never()).findAllByOrderByNombreAsc();
        }

        @Test
        @DisplayName("Debe listar todas las categorías cuando incluirInactivas es true")
        void testListarTodas() {
            Categoria c1 = new Categoria("Cejas");
            c1.setId(1L);
            c1.setActiva(false);
            Categoria c2 = new Categoria("Labios");
            c2.setId(2L);
            c2.setActiva(true);

            when(categoriaRepository.findAllByOrderByNombreAsc()).thenReturn(List.of(c1, c2));

            List<CategoriaResponse> resultado = categoriaService.listarCategorias(true);

            assertEquals(2, resultado.size());
            assertFalse(resultado.get(0).activa());
            assertTrue(resultado.get(1).activa());
            verify(categoriaRepository).findAllByOrderByNombreAsc();
        }
    }

    @Nested
    @DisplayName("Creación de Categorías")
    class CreacionTests {

        @Test
        @DisplayName("Debe crear y sanitizar una categoría exitosamente")
        void testCrearExitoso() {
            CrearCategoriaRequest req = new CrearCategoriaRequest("   Uñas   Acrílicas   ");

            when(categoriaRepository.findByNombreIgnoreCase("Uñas Acrílicas")).thenReturn(Optional.empty());
            when(categoriaRepository.save(any(Categoria.class))).thenAnswer(inv -> {
                Categoria c = inv.getArgument(0);
                c.setId(10L);
                return c;
            });

            CategoriaResponse resp = categoriaService.crearCategoria(req);

            assertNotNull(resp);
            assertEquals(10L, resp.id());
            assertEquals("Uñas Acrílicas", resp.nombre());
            assertTrue(resp.activa());

            ArgumentCaptor<Categoria> captor = ArgumentCaptor.forClass(Categoria.class);
            verify(categoriaRepository).save(captor.capture());
            assertEquals("Uñas Acrílicas", captor.getValue().getNombre());
            assertTrue(captor.getValue().getActiva());
        }

        @Test
        @DisplayName("Debe lanzar ConflictoEstadoException si ya existe una categoría con el mismo nombre")
        void testDuplicadoConflicto() {
            CrearCategoriaRequest req = new CrearCategoriaRequest("ROSTRO");
            Categoria existente = new Categoria("Rostro");
            existente.setId(1L);

            when(categoriaRepository.findByNombreIgnoreCase("ROSTRO")).thenReturn(Optional.of(existente));

            assertThrows(ConflictoEstadoException.class, () -> categoriaService.crearCategoria(req));
            verify(categoriaRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Actualización de Categorías")
    class ActualizacionTests {

        @Test
        @DisplayName("Debe actualizar el nombre y el estado activa exitosamente")
        void testActualizarExitoso() {
            Categoria categoria = new Categoria("Skincare");
            categoria.setId(5L);

            ActualizarCategoriaRequest req = new ActualizarCategoriaRequest("Cuidado Facial", false);

            when(categoriaRepository.findById(5L)).thenReturn(Optional.of(categoria));
            when(categoriaRepository.findByNombreIgnoreCase("Cuidado Facial")).thenReturn(Optional.empty());
            when(categoriaRepository.save(any(Categoria.class))).thenAnswer(inv -> inv.getArgument(0));

            CategoriaResponse resp = categoriaService.actualizarCategoria(5L, req);

            assertEquals("Cuidado Facial", resp.nombre());
            assertFalse(resp.activa());
        }

        @Test
        @DisplayName("Debe permitir actualización si el nuevo nombre es idéntico al actual")
        void testNombreIdenticoPermitido() {
            Categoria categoria = new Categoria("Labios");
            categoria.setId(3L);

            ActualizarCategoriaRequest req = new ActualizarCategoriaRequest("labios", true);

            when(categoriaRepository.findById(3L)).thenReturn(Optional.of(categoria));
            when(categoriaRepository.save(any(Categoria.class))).thenAnswer(inv -> inv.getArgument(0));

            CategoriaResponse resp = categoriaService.actualizarCategoria(3L, req);

            assertEquals("Labios", resp.nombre());
            assertTrue(resp.activa());
        }

        @Test
        @DisplayName("Debe lanzar ConflictoEstadoException si el nuevo nombre colisiona con otra categoría")
        void testColisionNombreOtraCategoria() {
            Categoria actual = new Categoria("Ojos");
            actual.setId(2L);

            Categoria otra = new Categoria("Rostro");
            otra.setId(1L);

            ActualizarCategoriaRequest req = new ActualizarCategoriaRequest("Rostro", null);

            when(categoriaRepository.findById(2L)).thenReturn(Optional.of(actual));
            when(categoriaRepository.findByNombreIgnoreCase("Rostro")).thenReturn(Optional.of(otra));

            assertThrows(ConflictoEstadoException.class, () -> categoriaService.actualizarCategoria(2L, req));
            verify(categoriaRepository, never()).save(any());
        }

        @Test
        @DisplayName("Debe lanzar RecursoNoEncontradoException si el ID no existe")
        void testIdNoExiste() {
            ActualizarCategoriaRequest req = new ActualizarCategoriaRequest("Cualquiera", true);
            when(categoriaRepository.findById(99L)).thenReturn(Optional.empty());

            assertThrows(RecursoNoEncontradoException.class, () -> categoriaService.actualizarCategoria(99L, req));
        }
    }
}
