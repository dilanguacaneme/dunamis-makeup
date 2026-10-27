package com.dunamis.makeup.service;

import com.dunamis.makeup.Entity.*;
import com.dunamis.makeup.Exeption.ProductoInsuficienteException;
import com.dunamis.makeup.Exeption.ProductoNoEncontradoException;
import com.dunamis.makeup.Repository.AbonoFacturaRepository;
import com.dunamis.makeup.Repository.FacturaRepository;
import com.dunamis.makeup.Repository.ProductoRepository;
import com.dunamis.makeup.Repository.UsuarioRepository;
import com.dunamis.makeup.Service.FacturaService;
import com.dunamis.makeup.dto.factura.*;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas Unitarias - FacturaService (RF-003, RF-004, RF-005, RF-006, RF-007, RF-014, RF-015, RF-016)")
class FacturaServiceTest {

    @Mock
    private FacturaRepository facturaRepository;

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private AbonoFacturaRepository abonoFacturaRepository;

    @InjectMocks
    private FacturaService facturaService;

    private Producto productoActivo1;
    private Producto productoActivo2;
    private Usuario vendedorUsuario;

    @BeforeEach
    void setUp() {
        productoActivo1 = new Producto();
        productoActivo1.setId(1L);
        productoActivo1.setNombre("Base Líquida Matte");
        productoActivo1.setPrecio(30000.0);
        productoActivo1.setCantidad(10);
        productoActivo1.setTotalProducto(300000.0);
        productoActivo1.setActivo(true);

        productoActivo2 = new Producto();
        productoActivo2.setId(2L);
        productoActivo2.setNombre("Fijador de Maquillaje");
        productoActivo2.setPrecio(20000.0);
        productoActivo2.setCantidad(5);
        productoActivo2.setTotalProducto(100000.0);
        productoActivo2.setActivo(true);

        vendedorUsuario = new Usuario();
        vendedorUsuario.setNombreUsuario("maryuri");
        vendedorUsuario.setNombreCompleto("Maryuri Duque");
        vendedorUsuario.setRol(RolUsuario.ADMIN);
    }

    @Nested
    @DisplayName("Creación de Facturas y Descuento Atómico de Stock (RF-003)")
    class CreacionFacturaTests {

        @Test
        @DisplayName("Debe crear factura PAGADA descontando existencias y registrando abono total")
        void testCrearFacturaPagadaExitosa() {
            when(usuarioRepository.findByNombreUsuarioIgnoreCase("maryuri")).thenReturn(Optional.of(vendedorUsuario));
            when(productoRepository.findById(1L)).thenReturn(Optional.of(productoActivo1));
            when(productoRepository.findById(2L)).thenReturn(Optional.of(productoActivo2));
            when(facturaRepository.save(any(Factura.class))).thenAnswer(invocation -> {
                Factura f = invocation.getArgument(0);
                f.setId(100L);
                return f;
            });

            CrearFacturaRequest request = new CrearFacturaRequest(
                    "  Daniela Rojas  ",
                    "3112233445",
                    List.of(
                            new CrearDetalleFacturaRequest(1L, 2),
                            new CrearDetalleFacturaRequest(2L, 1)
                    ),
                    EstadoPagoFactura.PAGADA,
                    null,
                    MedioPago.NEQUI,
                    "Pago completo"
            );

            FacturaResponse response = facturaService.crearFactura(request, "maryuri");

            assertNotNull(response);
            assertEquals(100L, response.id());
            assertEquals("Daniela Rojas", response.cliente());
            assertEquals("Maryuri Duque", response.vendedorNombre());
            assertEquals(80000.0, response.total()); // (30000 * 2) + (20000 * 1) = 80000
            assertEquals(EstadoPagoFactura.PAGADA, response.estadoPago());
            assertEquals(80000.0, response.valorAbonado());
            assertEquals(0.0, response.saldoPendiente());
            assertFalse(response.anulada());

            // Verificar descuento de existencias en productos
            assertEquals(8, productoActivo1.getCantidad());
            assertEquals(240000.0, productoActivo1.getTotalProducto());
            assertEquals(4, productoActivo2.getCantidad());
            assertEquals(80000.0, productoActivo2.getTotalProducto());

            verify(productoRepository).save(productoActivo1);
            verify(productoRepository).save(productoActivo2);
            verify(facturaRepository).save(any(Factura.class));
        }

        @Test
        @DisplayName("Debe crear factura PENDIENTE con saldo total por cobrar y sin abonos iniciales")
        void testCrearFacturaPendiente() {
            when(usuarioRepository.findByNombreUsuarioIgnoreCase("maryuri")).thenReturn(Optional.of(vendedorUsuario));
            when(productoRepository.findById(1L)).thenReturn(Optional.of(productoActivo1));
            when(facturaRepository.save(any(Factura.class))).thenAnswer(invocation -> {
                Factura f = invocation.getArgument(0);
                f.setId(101L);
                return f;
            });

            CrearFacturaRequest request = new CrearFacturaRequest(
                    "Ana Torres",
                    null,
                    List.of(new CrearDetalleFacturaRequest(1L, 1)),
                    EstadoPagoFactura.PENDIENTE,
                    null,
                    null,
                    null
            );

            FacturaResponse response = facturaService.crearFactura(request, "maryuri");

            assertEquals(EstadoPagoFactura.PENDIENTE, response.estadoPago());
            assertEquals(0.0, response.valorAbonado());
            assertEquals(30000.0, response.saldoPendiente());
            assertEquals(30000.0, response.total());
            assertTrue(response.abonos().isEmpty());
        }

        @Test
        @DisplayName("Debe crear factura con ABONO_PARCIAL calculando saldo pendiente")
        void testCrearFacturaAbonoParcial() {
            when(usuarioRepository.findByNombreUsuarioIgnoreCase("maryuri")).thenReturn(Optional.of(vendedorUsuario));
            when(productoRepository.findById(1L)).thenReturn(Optional.of(productoActivo1));
            when(facturaRepository.save(any(Factura.class))).thenAnswer(invocation -> {
                Factura f = invocation.getArgument(0);
                f.setId(102L);
                return f;
            });

            CrearFacturaRequest request = new CrearFacturaRequest(
                    "Valentina Gómez",
                    "3155556677",
                    List.of(new CrearDetalleFacturaRequest(1L, 2)), // 60000 total
                    EstadoPagoFactura.ABONO_PARCIAL,
                    20000.0,
                    MedioPago.TRANSFERENCIA,
                    "Anticipo por Daviplata"
            );

            FacturaResponse response = facturaService.crearFactura(request, "maryuri");

            assertEquals(EstadoPagoFactura.ABONO_PARCIAL, response.estadoPago());
            assertEquals(20000.0, response.valorAbonado());
            assertEquals(40000.0, response.saldoPendiente());
            assertEquals(60000.0, response.total());
            assertEquals(1, response.abonos().size());
            assertEquals(20000.0, response.abonos().get(0).monto());
        }

        @Test
        @DisplayName("Debe consolidar cantidades de referencias repetidas en el mismo pedido")
        void testConsolidarCantidadesRepetidas() {
            when(usuarioRepository.findByNombreUsuarioIgnoreCase("maryuri")).thenReturn(Optional.of(vendedorUsuario));
            when(productoRepository.findById(1L)).thenReturn(Optional.of(productoActivo1));
            when(facturaRepository.save(any(Factura.class))).thenAnswer(invocation -> {
                Factura f = invocation.getArgument(0);
                f.setId(103L);
                return f;
            });

            // 1L solicitado en dos líneas: 3 + 4 = 7 unidades (disponibles 10)
            CrearFacturaRequest request = new CrearFacturaRequest(
                    "Cliente Consolidado",
                    null,
                    List.of(
                            new CrearDetalleFacturaRequest(1L, 3),
                            new CrearDetalleFacturaRequest(1L, 4)
                    ),
                    EstadoPagoFactura.PAGADA,
                    null,
                    MedioPago.EFECTIVO,
                    null
            );

            FacturaResponse response = facturaService.crearFactura(request, "maryuri");

            assertEquals(210000.0, response.total()); // 7 * 30000
            assertEquals(3, productoActivo1.getCantidad()); // 10 - 7 = 3
        }
    }

    @Nested
    @DisplayName("Validaciones y Casos de Error en Creación (RF-004, RF-005, RF-006, RF-007)")
    class ErroresCreacionFacturaTests {

        @Test
        @DisplayName("Debe fallar si algún producto no existe (404)")
        void testProductoInexistente() {
            when(productoRepository.findById(999L)).thenReturn(Optional.empty());

            CrearFacturaRequest request = new CrearFacturaRequest(
                    "Cliente",
                    null,
                    List.of(new CrearDetalleFacturaRequest(999L, 1)),
                    null,
                    null,
                    null,
                    null
            );

            assertThrows(ProductoNoEncontradoException.class, () ->
                    facturaService.crearFactura(request, "maryuri"));
            verify(facturaRepository, never()).save(any());
        }

        @Test
        @DisplayName("Debe fallar si algún producto está inactivo (400)")
        void testProductoInactivo() {
            Producto inactivo = new Producto();
            inactivo.setId(3L);
            inactivo.setNombre("Labial Descontinuado");
            inactivo.setActivo(false);
            inactivo.setCantidad(10);
            when(productoRepository.findById(3L)).thenReturn(Optional.of(inactivo));

            CrearFacturaRequest request = new CrearFacturaRequest(
                    "Cliente",
                    null,
                    List.of(new CrearDetalleFacturaRequest(3L, 1)),
                    null,
                    null,
                    null,
                    null
            );

            ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                    facturaService.crearFactura(request, "maryuri"));
            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
            assertTrue(ex.getReason().contains("inactivo"));
            verify(facturaRepository, never()).save(any());
        }

        @Test
        @DisplayName("Debe fallar con ProductoInsuficienteException si no hay existencias suficientes (409)")
        void testStockInsuficiente() {
            when(productoRepository.findById(2L)).thenReturn(Optional.of(productoActivo2)); // existencias: 5

            CrearFacturaRequest request = new CrearFacturaRequest(
                    "Cliente",
                    null,
                    List.of(new CrearDetalleFacturaRequest(2L, 6)), // solicita 6
                    null,
                    null,
                    null,
                    null
            );

            assertThrows(ProductoInsuficienteException.class, () ->
                    facturaService.crearFactura(request, "maryuri"));

            // Verificar que no se descontó ninguna existencia
            assertEquals(5, productoActivo2.getCantidad());
            verify(facturaRepository, never()).save(any());
        }

        @Test
        @DisplayName("Debe fallar si el abono parcial es inválido (monto <= 0 o mayor al total)")
        void testAbonoParcialInvalido() {
            when(productoRepository.findById(1L)).thenReturn(Optional.of(productoActivo1));

            // Total es 30000, abono enviado es 35000 (> total)
            CrearFacturaRequest requestSobrepago = new CrearFacturaRequest(
                    "Cliente",
                    null,
                    List.of(new CrearDetalleFacturaRequest(1L, 1)),
                    EstadoPagoFactura.ABONO_PARCIAL,
                    35000.0,
                    MedioPago.EFECTIVO,
                    null
            );

            ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                    facturaService.crearFactura(requestSobrepago, "maryuri"));
            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
            verify(facturaRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Registro de Abonos y Control Financiero (RF-014, RF-015, RF-016)")
    class RegistroAbonosTests {

        private Factura facturaParcial;

        @BeforeEach
        void initFactura() {
            facturaParcial = new Factura();
            facturaParcial.setId(50L);
            facturaParcial.setCliente("Paola Martínez");
            facturaParcial.setVendedorUsuario("maryuri");
            facturaParcial.setVendedorNombre("Maryuri Duque");
            facturaParcial.setFecha(LocalDateTime.now());
            facturaParcial.setTotal(100000.0);
            facturaParcial.setEstadoPago(EstadoPagoFactura.ABONO_PARCIAL);
            facturaParcial.setValorAbonado(40000.0);
            facturaParcial.setSaldoPendiente(60000.0);
            facturaParcial.setAnulada(false);
            facturaParcial.setAbonos(new ArrayList<>());
        }

        @Test
        @DisplayName("Debe registrar abono parcial exitoso recalculando saldos")
        void testRegistrarAbonoExitoso() {
            when(facturaRepository.findById(50L)).thenReturn(Optional.of(facturaParcial));
            when(abonoFacturaRepository.save(any(AbonoFactura.class))).thenAnswer(invocation -> {
                AbonoFactura a = invocation.getArgument(0);
                a.setId(301L);
                return a;
            });

            RegistrarAbonoRequest req = new RegistrarAbonoRequest(30000.0, MedioPago.NEQUI, "Segundo abono");

            AbonoResponse response = facturaService.registrarAbono(50L, req, "maryuri", true);

            assertNotNull(response);
            assertEquals(30000.0, response.monto());
            assertEquals(MedioPago.NEQUI, response.medioPago());
            assertEquals("maryuri", response.usuarioRegistro());

            assertEquals(70000.0, facturaParcial.getValorAbonado());
            assertEquals(30000.0, facturaParcial.getSaldoPendiente());
            assertEquals(EstadoPagoFactura.ABONO_PARCIAL, facturaParcial.getEstadoPago());
            verify(facturaRepository).save(facturaParcial);
        }

        @Test
        @DisplayName("Debe transicionar automáticamente a PAGADA cuando el abono cubre el saldo exacto")
        void testTransicionAutomaticaAPagada() {
            when(facturaRepository.findById(50L)).thenReturn(Optional.of(facturaParcial)); // saldo pendiente: 60000
            when(abonoFacturaRepository.save(any(AbonoFactura.class))).thenAnswer(invocation -> {
                AbonoFactura a = invocation.getArgument(0);
                a.setId(302L);
                return a;
            });

            RegistrarAbonoRequest req = new RegistrarAbonoRequest(60000.0, MedioPago.EFECTIVO, "Saldo final");

            AbonoResponse response = facturaService.registrarAbono(50L, req, "maryuri", false);

            assertNotNull(response);
            assertEquals(100000.0, facturaParcial.getValorAbonado());
            assertEquals(0.0, facturaParcial.getSaldoPendiente());
            assertEquals(EstadoPagoFactura.PAGADA, facturaParcial.getEstadoPago());
        }

        @Test
        @DisplayName("Debe rechazar abono si el monto excede el saldo pendiente (no sobrepago)")
        void testRechazarSobrepago() {
            when(facturaRepository.findById(50L)).thenReturn(Optional.of(facturaParcial)); // saldo: 60000

            RegistrarAbonoRequest req = new RegistrarAbonoRequest(65000.0, MedioPago.EFECTIVO, null);

            ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                    facturaService.registrarAbono(50L, req, "maryuri", true));
            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
            assertTrue(ex.getReason().contains("supera el saldo pendiente"));
            verify(abonoFacturaRepository, never()).save(any());
        }

        @Test
        @DisplayName("Debe rechazar abono si la factura ya está totalmente PAGADA")
        void testRechazarAbonoEnFacturaPagada() {
            facturaParcial.setEstadoPago(EstadoPagoFactura.PAGADA);
            facturaParcial.setSaldoPendiente(0.0);
            when(facturaRepository.findById(50L)).thenReturn(Optional.of(facturaParcial));

            RegistrarAbonoRequest req = new RegistrarAbonoRequest(10000.0, MedioPago.EFECTIVO, null);

            ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                    facturaService.registrarAbono(50L, req, "maryuri", true));
            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
            assertTrue(ex.getReason().contains("totalmente pagada"));
        }

        @Test
        @DisplayName("Debe rechazar abono si la factura se encuentra anulada (409)")
        void testRechazarAbonoEnFacturaAnulada() {
            facturaParcial.setAnulada(true);
            when(facturaRepository.findById(50L)).thenReturn(Optional.of(facturaParcial));

            RegistrarAbonoRequest req = new RegistrarAbonoRequest(10000.0, MedioPago.EFECTIVO, null);

            ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                    facturaService.registrarAbono(50L, req, "maryuri", true));
            assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
            assertTrue(ex.getReason().contains("factura anulada"));
        }

        @Test
        @DisplayName("Debe rechazar abono si un vendedor intenta abonar a la factura de otro vendedor (403)")
        void testRechazarAbonoVendedorAjeno() {
            facturaParcial.setVendedorUsuario("vendedor_1");
            when(facturaRepository.findById(50L)).thenReturn(Optional.of(facturaParcial));

            RegistrarAbonoRequest req = new RegistrarAbonoRequest(10000.0, MedioPago.EFECTIVO, null);

            ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                    facturaService.registrarAbono(50L, req, "vendedor_2", false)); // esAdmin = false
            assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        }
    }
}
