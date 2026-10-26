package com.dunamis.makeup.service;

import com.dunamis.makeup.Entity.CategoriaProducto;
import com.dunamis.makeup.Entity.Marca;
import com.dunamis.makeup.Entity.Producto;
import com.dunamis.makeup.Exeption.ProductoNoEncontradoException;
import com.dunamis.makeup.Repository.DetalleFacturaRepository;
import com.dunamis.makeup.Repository.MarcaRepository;
import com.dunamis.makeup.Repository.ProductoRepository;
import com.dunamis.makeup.Service.ProductoService;
import com.dunamis.makeup.dto.producto.ActualizarProductoRequest;
import com.dunamis.makeup.dto.producto.CrearProductoRequest;
import com.dunamis.makeup.dto.producto.ProductoResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
@DisplayName("Pruebas Unitarias - ProductoService (RF-002, RF-006, RF-008, RF-009, RF-012, RF-013, RF-015, RF-016, RF-017, RF-019)")
class ProductoServiceTest {

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private MarcaRepository marcaRepository;

    @Mock
    private DetalleFacturaRepository detalleFacturaRepository;

    @InjectMocks
    private ProductoService productoService;

    private Marca marcaTrendy;
    private Marca marcaInactiva;
    private Producto productoEjemplo;

    @BeforeEach
    void setUp() {
        marcaTrendy = new Marca("Trendy");
        marcaTrendy.setId(1L);
        marcaTrendy.setActiva(true);

        marcaInactiva = new Marca("Antigua");
        marcaInactiva.setId(2L);
        marcaInactiva.setActiva(false);

        productoEjemplo = new Producto();
        productoEjemplo.setId(100L);
        productoEjemplo.setNombre("Base Líquida");
        productoEjemplo.setPrecio(30000.0);
        productoEjemplo.setCantidad(10);
        productoEjemplo.setCantidadInicial(10);
        productoEjemplo.setTotalProducto(300000.0);
        productoEjemplo.setCategoria(CategoriaProducto.ROSTRO);
        productoEjemplo.setMarca(marcaTrendy);
        productoEjemplo.setActivo(true);
    }

    @Nested
    @DisplayName("Creación de Productos (RF-008, RF-009)")
    class CreacionProductosTests {

        @Test
        @DisplayName("Debe crear producto exitosamente normalizando nombre, asociando marca activa y calculando total")
        void testCrearProductoExitoso() {
            CrearProductoRequest request = new CrearProductoRequest(
                    "   Base   Líquida   Mate  ",
                    35000.0,
                    8,
                    CategoriaProducto.ROSTRO,
                    1L
            );

            when(marcaRepository.findById(1L)).thenReturn(Optional.of(marcaTrendy));
            when(productoRepository.save(any(Producto.class))).thenAnswer(invocation -> {
                Producto p = invocation.getArgument(0);
                p.setId(101L);
                return p;
            });

            ProductoResponse response = productoService.crearProducto(request);

            assertNotNull(response);
            assertEquals(101L, response.id());
            assertEquals("Base Líquida Mate", response.nombre(), "Debe normalizar los espacios del nombre");
            assertEquals(35000.0, response.precio());
            assertEquals(8, response.cantidad());
            assertEquals(8, response.cantidadInicial());
            assertEquals(280000.0, response.totalProducto(), "Debe calcular 35000.0 * 8");
            assertTrue(response.activo(), "El producto creado debe estar activo por defecto");
            assertEquals("Trendy", response.marca().nombre());

            verify(productoRepository).save(any(Producto.class));
        }

        @Test
        @DisplayName("Debe rechazar creación si la marca especificada no existe")
        void testCrearProductoMarcaNoExiste() {
            CrearProductoRequest request = new CrearProductoRequest(
                    "Labial", 15000.0, 5, CategoriaProducto.LABIOS, 999L
            );

            when(marcaRepository.findById(999L)).thenReturn(Optional.empty());

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> productoService.crearProducto(request));

            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
            assertTrue(ex.getReason().contains("La marca seleccionada no existe"));
            verify(productoRepository, never()).save(any());
        }

        @Test
        @DisplayName("Debe rechazar creación si la marca especificada está inactiva (RF-009)")
        void testCrearProductoMarcaInactiva() {
            CrearProductoRequest request = new CrearProductoRequest(
                    "Labial", 15000.0, 5, CategoriaProducto.LABIOS, 2L
            );

            when(marcaRepository.findById(2L)).thenReturn(Optional.of(marcaInactiva));

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> productoService.crearProducto(request));

            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
            assertTrue(ex.getReason().contains("inactiva"));
            verify(productoRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Actualización de Productos (RF-012, RF-013)")
    class ActualizacionProductosTests {

        @Test
        @DisplayName("Debe actualizar atributos, recalcular totalProducto y retornar ProductoResponse")
        void testActualizarProductoExitoso() {
            ActualizarProductoRequest request = new ActualizarProductoRequest(
                    "  Base Líquida HD  ",
                    32000.0,
                    12,
                    null,
                    null,
                    null
            );

            when(productoRepository.findById(100L)).thenReturn(Optional.of(productoEjemplo));
            when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));

            ProductoResponse response = productoService.actualizarProducto(100L, request);

            assertEquals("Base Líquida HD", response.nombre());
            assertEquals(32000.0, response.precio());
            assertEquals(12, response.cantidad());
            assertEquals(384000.0, response.totalProducto(), "Debe recalcular 32000.0 * 12");
            verify(productoRepository).save(productoEjemplo);
        }

        @Test
        @DisplayName("Debe permitir alternar estado activo con toggle lógico")
        void testActualizarToggleActivo() {
            ActualizarProductoRequest request = new ActualizarProductoRequest(
                    null, null, null, null, null, false
            );

            when(productoRepository.findById(100L)).thenReturn(Optional.of(productoEjemplo));
            when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));

            ProductoResponse response = productoService.actualizarProducto(100L, request);

            assertFalse(response.activo());
            assertFalse(productoEjemplo.getActivo());
        }

        @Test
        @DisplayName("Debe lanzar ProductoNoEncontradoException cuando el ID no existe")
        void testActualizarProductoNoExiste() {
            ActualizarProductoRequest request = new ActualizarProductoRequest(
                    "Nombre", null, null, null, null, null
            );

            when(productoRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ProductoNoEncontradoException.class,
                    () -> productoService.actualizarProducto(999L, request));
        }

        @Test
        @DisplayName("Debe rechazar actualización si se intenta asignar una marca inactiva")
        void testActualizarMarcaInactiva() {
            ActualizarProductoRequest request = new ActualizarProductoRequest(
                    null, null, null, null, 2L, null
            );

            when(productoRepository.findById(100L)).thenReturn(Optional.of(productoEjemplo));
            when(marcaRepository.findById(2L)).thenReturn(Optional.of(marcaInactiva));

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> productoService.actualizarProducto(100L, request));

            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
            assertTrue(ex.getReason().contains("inactiva"));
        }
    }

    @Nested
    @DisplayName("Borrado e Integridad Referencial (RF-015, RF-016 - Principio 5)")
    class BorradoIntegridadTests {

        @Test
        @DisplayName("Debe realizar borrado lógico (activo=false) si el producto tiene facturas históricas")
        void testBorradoLogicoConFacturas() {
            when(productoRepository.findById(100L)).thenReturn(Optional.of(productoEjemplo));
            when(detalleFacturaRepository.existsByProductoId(100L)).thenReturn(true);
            when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));

            ProductoResponse response = productoService.borrarProductoPorId(100L);

            assertFalse(response.activo(), "El producto con facturas debe quedar inactivo (borrado lógico)");
            assertFalse(productoEjemplo.getActivo());
            verify(productoRepository).save(productoEjemplo);
            verify(productoRepository, never()).deleteById(100L);
        }

        @Test
        @DisplayName("Debe permitir borrado físico si el producto NO tiene facturas asociadas")
        void testBorradoFisicoSinFacturas() {
            when(productoRepository.findById(100L)).thenReturn(Optional.of(productoEjemplo));
            when(detalleFacturaRepository.existsByProductoId(100L)).thenReturn(false);

            ProductoResponse response = productoService.borrarProductoPorId(100L);

            assertNotNull(response);
            verify(productoRepository).deleteById(100L);
        }

        @Test
        @DisplayName("Debe lanzar ProductoNoEncontradoException si se intenta borrar un producto inexistente")
        void testBorradoInexistente() {
            when(productoRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(ProductoNoEncontradoException.class,
                    () -> productoService.borrarProductoPorId(999L));
            verify(productoRepository, never()).deleteById(any());
        }
    }

    @Nested
    @DisplayName("Listado, Alerta de Stock y Valuación (RF-003, RF-004, RF-017, RF-019)")
    class ListadoYValuacionTests {

        @Test
        @DisplayName("Listar productos debe filtrar solo activos por defecto o todos si se solicita")
        void testListarProductos() {
            when(productoRepository.findByActivoTrueOrderByNombreAsc()).thenReturn(List.of(productoEjemplo));
            when(productoRepository.findAllByOrderByNombreAsc()).thenReturn(List.of(productoEjemplo));

            List<ProductoResponse> soloActivos = productoService.buscarProductos(false);
            assertEquals(1, soloActivos.size());
            verify(productoRepository).findByActivoTrueOrderByNombreAsc();

            List<ProductoResponse> todos = productoService.buscarProductos(true);
            assertEquals(1, todos.size());
            verify(productoRepository).findAllByOrderByNombreAsc();
        }

        @Test
        @DisplayName("Alerta de stock bajo debe respetar el umbral y excluir inactivos")
        void testProductoCercaAcabarseConUmbral() {
            when(productoRepository.obtenerProductosPocoStock(5)).thenReturn(List.of(productoEjemplo));

            List<ProductoResponse> resultado = productoService.productoCercaAcabarse(5);

            assertEquals(1, resultado.size());
            verify(productoRepository).obtenerProductosPocoStock(5);
        }

        @Test
        @DisplayName("Alerta de stock bajo debe usar umbral 0 por defecto si es null")
        void testProductoCercaAcabarseUmbralNull() {
            when(productoRepository.obtenerProductosPocoStock(0)).thenReturn(List.of(productoEjemplo));

            List<ProductoResponse> resultado = productoService.productoCercaAcabarse(null);

            assertEquals(1, resultado.size());
            verify(productoRepository).obtenerProductosPocoStock(0);
        }

        @Test
        @DisplayName("Valuación total debe retornar 0.0 si el repositorio devuelve Optional vacío")
        void testTotalInventarioVacio() {
            when(productoRepository.totalInventario()).thenReturn(Optional.empty());

            Double total = productoService.totalInventario();

            assertEquals(0.0, total, "Un inventario vacío debe valer 0.0, sin lanzar excepción 404");
        }

        @Test
        @DisplayName("Valuación total debe retornar el total calculado del inventario activo")
        void testTotalInventarioConStock() {
            when(productoRepository.totalInventario()).thenReturn(Optional.of(1500000.0));

            Double total = productoService.totalInventario();

            assertEquals(1500000.0, total);
        }
    }
}
