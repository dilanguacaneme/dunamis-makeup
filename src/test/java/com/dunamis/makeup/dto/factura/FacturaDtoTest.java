package com.dunamis.makeup.dto.factura;

import com.dunamis.makeup.entity.*;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Pruebas Unitarias - DTOs de Facturación (RF-001, RF-002, RF-007, RF-014, RF-020)")
class FacturaDtoTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Nested
    @DisplayName("CrearFacturaRequest y CrearDetalleFacturaRequest (RF-001, RF-003, RF-007)")
    class CrearFacturaRequestTests {

        @Test
        @DisplayName("Debe validar exitosamente cuando los datos son completos y válidos")
        void testCrearFacturaValida() {
            CrearDetalleFacturaRequest detalle = new CrearDetalleFacturaRequest(10L, 2);
            CrearFacturaRequest request = new CrearFacturaRequest(
                    "María Camila Restrepo",
                    "3101234567",
                    List.of(detalle),
                    EstadoPagoFactura.PAGADA,
                    50000.0,
                    MedioPago.NEQUI,
                    "Pago por transferencia inmediata"
            );

            Set<ConstraintViolation<CrearFacturaRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty(), "No debe haber violaciones para un request válido");
        }

        @Test
        @DisplayName("Debe rechazar cliente en blanco o nulo")
        void testRechazarClienteInvalido() {
            CrearDetalleFacturaRequest detalle = new CrearDetalleFacturaRequest(10L, 1);
            CrearFacturaRequest reqVacio = new CrearFacturaRequest(
                    "   ",
                    "3001234567",
                    List.of(detalle),
                    EstadoPagoFactura.PAGADA,
                    null,
                    null,
                    null
            );

            Set<ConstraintViolation<CrearFacturaRequest>> violations = validator.validate(reqVacio);
            assertFalse(violations.isEmpty());
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("cliente")));
        }

        @Test
        @DisplayName("Debe rechazar lista de detalles vacía o nula")
        void testRechazarDetallesVacios() {
            CrearFacturaRequest reqSinDetalles = new CrearFacturaRequest(
                    "Carlos Gómez",
                    null,
                    Collections.emptyList(),
                    null,
                    null,
                    null,
                    null
            );

            Set<ConstraintViolation<CrearFacturaRequest>> violations = validator.validate(reqSinDetalles);
            assertFalse(violations.isEmpty());
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("detalles")));
        }

        @Test
        @DisplayName("Debe rechazar detalle con productoId nulo o cantidad menor o igual a cero")
        void testRechazarDetalleInvalido() {
            CrearDetalleFacturaRequest detalleInvalido = new CrearDetalleFacturaRequest(null, 0);
            CrearFacturaRequest request = new CrearFacturaRequest(
                    "Laura Pérez",
                    null,
                    List.of(detalleInvalido),
                    null,
                    null,
                    null,
                    null
            );

            Set<ConstraintViolation<CrearFacturaRequest>> violations = validator.validate(request);
            assertFalse(violations.isEmpty());
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().contains("detalles[0].productoId")));
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().contains("detalles[0].cantidad")));
        }
    }

    @Nested
    @DisplayName("RegistrarAbonoRequest (RF-001, RF-014, RF-015)")
    class RegistrarAbonoRequestTests {

        @Test
        @DisplayName("Debe validar exitosamente con monto positivo y medio de pago válido")
        void testAbonoValido() {
            RegistrarAbonoRequest request = new RegistrarAbonoRequest(
                    25000.0,
                    MedioPago.EFECTIVO,
                    "Abono en caja 1"
            );

            Set<ConstraintViolation<RegistrarAbonoRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty());
        }

        @Test
        @DisplayName("Debe rechazar abono con monto cero o negativo")
        void testRechazarMontoInvalido() {
            RegistrarAbonoRequest reqCero = new RegistrarAbonoRequest(0.0, MedioPago.DAVIPLATA, null);
            RegistrarAbonoRequest reqNegativo = new RegistrarAbonoRequest(-500.0, MedioPago.NEQUI, null);

            assertFalse(validator.validate(reqCero).isEmpty());
            assertFalse(validator.validate(reqNegativo).isEmpty());
        }

        @Test
        @DisplayName("Debe rechazar abono sin medio de pago especificado")
        void testRechazarMedioPagoNulo() {
            RegistrarAbonoRequest request = new RegistrarAbonoRequest(10000.0, null, null);
            Set<ConstraintViolation<RegistrarAbonoRequest>> violations = validator.validate(request);
            assertFalse(violations.isEmpty());
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("medioPago")));
        }
    }

    @Nested
    @DisplayName("FacturaResponse y Mapeo desde Entidad JPA (RF-001, RF-002, RF-020)")
    class FacturaResponseTests {

        @Test
        @DisplayName("Debe mapear correctamente desde una entidad Factura con detalles y abonos")
        void testFromEntityCompleto() {
            Producto prod = new Producto();
            prod.setId(5L);
            prod.setNombre("Rubor Compacto");
            prod.setPrecio(20000.0);

            DetalleFactura detalle = new DetalleFactura();
            detalle.setId(101L);
            detalle.setProducto(prod);
            detalle.setPrecioUnitario(20000.0);
            detalle.setCantidad(2);
            detalle.setSubtotal(40000.0);

            Factura factura = new Factura();
            factura.setId(50L);
            factura.setCliente("Sofia Vergara");
            factura.setTelefonoCliente("3209876543");
            factura.setVendedorNombre("Maryuri Duque");
            factura.setVendedorUsuario("maryuri");
            factura.setFecha(LocalDateTime.of(2026, 10, 27, 10, 30, 0));
            factura.setTotal(40000.0);
            factura.setEstadoPago(EstadoPagoFactura.ABONO_PARCIAL);
            factura.setValorAbonado(15000.0);
            factura.setSaldoPendiente(25000.0);
            factura.setAnulada(false);
            factura.setDetalles(List.of(detalle));

            AbonoFactura abono = new AbonoFactura(factura, 15000.0, MedioPago.TRANSFERENCIA, "Anticipo", "maryuri");
            abono.setId(201L);
            abono.setFecha(LocalDateTime.of(2026, 10, 27, 10, 31, 0));
            factura.setAbonos(List.of(abono));

            FacturaResponse response = FacturaResponse.fromEntity(factura);

            assertEquals(50L, response.id());
            assertEquals("Sofia Vergara", response.cliente());
            assertEquals("3209876543", response.telefonoCliente());
            assertEquals("Maryuri Duque", response.vendedorNombre());
            assertEquals("maryuri", response.vendedorUsuario());
            assertEquals(LocalDateTime.of(2026, 10, 27, 10, 30, 0), response.fecha());
            assertEquals(40000.0, response.total());
            assertEquals(EstadoPagoFactura.ABONO_PARCIAL, response.estadoPago());
            assertEquals(15000.0, response.valorAbonado());
            assertEquals(25000.0, response.saldoPendiente());
            assertFalse(response.anulada());

            assertEquals(1, response.detalles().size());
            DetalleFacturaResponse dDto = response.detalles().get(0);
            assertEquals(101L, dDto.id());
            assertEquals(5L, dDto.productoId());
            assertEquals("Rubor Compacto", dDto.productoNombre());
            assertEquals(20000.0, dDto.precioUnitario());
            assertEquals(2, dDto.cantidad());
            assertEquals(40000.0, dDto.subtotal());

            assertEquals(1, response.abonos().size());
            AbonoResponse aDto = response.abonos().get(0);
            assertEquals(201L, aDto.id());
            assertEquals(50L, aDto.facturaId());
            assertEquals(15000.0, aDto.monto());
            assertEquals(MedioPago.TRANSFERENCIA, aDto.medioPago());
            assertEquals("Anticipo", aDto.notas());
            assertEquals("maryuri", aDto.usuarioRegistro());
        }

        @Test
        @DisplayName("Debe manejar de forma retrocompatible una factura brownfield con campos nulos")
        void testFromEntityBrownfieldNullTolerance() {
            Factura factura = new Factura();
            factura.setId(60L);
            factura.setCliente("Cliente Antiguo");
            factura.setTotal(30000.0);
            // fecha, estadoPago, valorAbonado, saldoPendiente, anulada son null
            factura.asegurarValoresPorDefecto();

            FacturaResponse response = FacturaResponse.fromEntity(factura);

            assertEquals(60L, response.id());
            assertEquals("Cliente Antiguo", response.cliente());
            assertEquals(30000.0, response.total());
            assertEquals(EstadoPagoFactura.PAGADA, response.estadoPago());
            assertEquals(30000.0, response.valorAbonado());
            assertEquals(0.0, response.saldoPendiente());
            assertFalse(response.anulada());
            assertNotNull(response.fecha());
            assertTrue(response.detalles().isEmpty());
            assertTrue(response.abonos().isEmpty());
        }
    }

    @Nested
    @DisplayName("EstadoPagoFactura Deserialización y Tolerancia Dual (Spec 007 - RF-005)")
    class EstadoPagoFacturaDeserializationTests {

        @Test
        @DisplayName("Debe resolver PARCIAL y ABONO_PARCIAL hacia EstadoPagoFactura.ABONO_PARCIAL")
        void testMapeoParcial() {
            assertEquals(EstadoPagoFactura.ABONO_PARCIAL, EstadoPagoFactura.fromString("PARCIAL"));
            assertEquals(EstadoPagoFactura.ABONO_PARCIAL, EstadoPagoFactura.fromString("parcial"));
            assertEquals(EstadoPagoFactura.ABONO_PARCIAL, EstadoPagoFactura.fromString("ABONO_PARCIAL"));
            assertEquals(EstadoPagoFactura.ABONO_PARCIAL, EstadoPagoFactura.fromString("abono_parcial"));
        }

        @Test
        @DisplayName("Debe resolver PAGADA y PENDIENTE correctamente")
        void testMapeoPagadaYPendiente() {
            assertEquals(EstadoPagoFactura.PAGADA, EstadoPagoFactura.fromString("PAGADA"));
            assertEquals(EstadoPagoFactura.PAGADA, EstadoPagoFactura.fromString("pagada"));
            assertEquals(EstadoPagoFactura.PENDIENTE, EstadoPagoFactura.fromString("PENDIENTE"));
            assertEquals(EstadoPagoFactura.PENDIENTE, EstadoPagoFactura.fromString("pendiente"));
        }

        @Test
        @DisplayName("Debe predeterminar PAGADA ante valores nulos o vacíos")
        void testMapeoNuloOVacio() {
            assertEquals(EstadoPagoFactura.PAGADA, EstadoPagoFactura.fromString(null));
            assertEquals(EstadoPagoFactura.PAGADA, EstadoPagoFactura.fromString(""));
            assertEquals(EstadoPagoFactura.PAGADA, EstadoPagoFactura.fromString("   "));
        }

        @Test
        @DisplayName("Debe arrojar IllegalArgumentException ante valores no reconocidos")
        void testMapeoInvalido() {
            assertThrows(IllegalArgumentException.class, () -> EstadoPagoFactura.fromString("DESCONOCIDO"));
        }
    }
}
