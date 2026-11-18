package com.dunamis.makeup.dto.producto;

import com.dunamis.makeup.dto.categoria.CategoriaResponse;
import com.dunamis.makeup.entity.Categoria;
import com.dunamis.makeup.entity.CategoriaProducto;
import com.dunamis.makeup.entity.Marca;
import com.dunamis.makeup.entity.Producto;
import com.dunamis.makeup.dto.marca.MarcaResponse;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Pruebas Unitarias - DTOs de Producto (RF-001, RF-002, RF-008, RF-010, RF-012, RF-013, RF-014)")
class ProductoDtoTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Nested
    @DisplayName("ProductoResponse (RF-001, RF-002)")
    class ProductoResponseTests {

        @Test
        @DisplayName("Debe instanciar y exponer atributos inmutables correctamente")
        void testCreacionProductoResponse() {
            MarcaResponse marca = new MarcaResponse(1L, "Trendy", true);
            CategoriaResponse categoria = new CategoriaResponse(1L, "Rostro", true);
            ProductoResponse response = new ProductoResponse(
                    10L,
                    "Polvo Traslúcido",
                    25000.0,
                    15,
                    375000.0,
                    categoria,
                    marca,
                    true
            );

            assertEquals(10L, response.id());
            assertEquals("Polvo Traslúcido", response.nombre());
            assertEquals(25000.0, response.precio());
            assertEquals(15, response.cantidad());
            assertEquals(375000.0, response.totalProducto());
            assertEquals("Rostro", response.categoria().nombre());
            assertNotNull(response.marca());
            assertEquals("Trendy", response.marca().nombre());
            assertTrue(response.activo());
        }

        @Test
        @DisplayName("Debe mapear correctamente desde una entidad JPA Producto calculando totalProducto")
        void testFromEntity() {
            Marca marca = new Marca("Purpure");
            marca.setId(2L);
            marca.setActiva(true);

            Producto producto = new Producto();
            producto.setId(20L);
            producto.setNombre("Labial Matte");
            producto.setPrecio(18000.0);
            producto.setCantidad(5);
            producto.setTotalProducto(90000.0);
            producto.setCategoria(new Categoria("Labios"));
            producto.setMarca(marca);
            producto.setActivo(true);

            ProductoResponse response = ProductoResponse.fromEntity(producto);

            assertEquals(20L, response.id());
            assertEquals("Labial Matte", response.nombre());
            assertEquals(18000.0, response.precio());
            assertEquals(5, response.cantidad());
            assertEquals(90000.0, response.totalProducto());
            assertEquals("Labios", response.categoria().nombre());
            assertNotNull(response.marca());
            assertEquals("Purpure", response.marca().nombre());
            assertTrue(response.activo());
        }

        @Test
        @DisplayName("Debe manejar producto sin marca y valor activo nulo con valor por defecto true")
        void testFromEntitySinMarcaYActivoNull() {
            Producto producto = new Producto();
            producto.setId(30L);
            producto.setNombre("Sombra Individual");
            producto.setPrecio(12000.0);
            producto.setCantidad(4);
            producto.setCategoria(new Categoria("Ojos"));
            producto.setActivo(null); // Caso retrospectivo brownfield

            ProductoResponse response = ProductoResponse.fromEntity(producto);

            assertEquals(30L, response.id());
            assertNull(response.marca());
            assertTrue(response.activo(), "Si activo es null en DB brownfield, debe proyectarse como true");
            assertEquals(48000.0, response.totalProducto(), "Debe calcular precio * cantidad si totalProducto era null");
        }
    }

    @Nested
    @DisplayName("CrearProductoRequest (RF-008, RF-010)")
    class CrearProductoRequestTests {

        @Test
        @DisplayName("Debe validar exitosamente cuando los campos son válidos")
        void testRequestValido() {
            CrearProductoRequest request = new CrearProductoRequest(
                    "Corrector Líquido",
                    22000.0,
                    10,
                    CategoriaProducto.ROSTRO,
                    1L
            );

            Set<ConstraintViolation<CrearProductoRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty(), "No debe haber violaciones para una solicitud válida");
        }

        @Test
        @DisplayName("Debe rechazar nombre nulo, en blanco o menor a 2 caracteres")
        void testNombreInvalido() {
            CrearProductoRequest reqNull = new CrearProductoRequest(null, 15000.0, 5, CategoriaProducto.LABIOS, 1L);
            CrearProductoRequest reqBlanco = new CrearProductoRequest("   ", 15000.0, 5, CategoriaProducto.LABIOS, 1L);
            CrearProductoRequest reqCorto = new CrearProductoRequest("A", 15000.0, 5, CategoriaProducto.LABIOS, 1L);

            assertFalse(validator.validate(reqNull).isEmpty());
            assertFalse(validator.validate(reqBlanco).isEmpty());
            assertFalse(validator.validate(reqCorto).isEmpty());
        }

        @Test
        @DisplayName("Debe rechazar precio nulo o negativo")
        void testPrecioInvalido() {
            CrearProductoRequest reqNull = new CrearProductoRequest("Delineador", null, 5, CategoriaProducto.OJOS, 1L);
            CrearProductoRequest reqNegativo = new CrearProductoRequest("Delineador", -100.0, 5, CategoriaProducto.OJOS, 1L);

            assertFalse(validator.validate(reqNull).isEmpty());
            assertFalse(validator.validate(reqNegativo).isEmpty());
        }

        @Test
        @DisplayName("Debe rechazar cantidad nula o negativa")
        void testCantidadInvalida() {
            CrearProductoRequest reqNull = new CrearProductoRequest("Betún Cejas", 12000.0, null, CategoriaProducto.CEJAS, 1L);
            CrearProductoRequest reqNegativa = new CrearProductoRequest("Betún Cejas", 12000.0, -1, CategoriaProducto.CEJAS, 1L);

            assertFalse(validator.validate(reqNull).isEmpty());
            assertFalse(validator.validate(reqNegativa).isEmpty());
        }

        @Test
        @DisplayName("Debe rechazar categoría nula o marcaId nulo")
        void testCategoriaYMarcaRequeridas() {
            CrearProductoRequest reqSinCategoria = new CrearProductoRequest("Rubor", 18000.0, 8, null, 1L);
            CrearProductoRequest reqSinMarca = new CrearProductoRequest("Rubor", 18000.0, 8, CategoriaProducto.ROSTRO, null);

            assertFalse(validator.validate(reqSinCategoria).isEmpty());
            assertFalse(validator.validate(reqSinMarca).isEmpty());
        }

        @Test
        @DisplayName("Debe aceptar tonos válidos ('1' al '10' y 'NO_APLICA') y asignar 'NO_APLICA' por defecto")
        void testTonosValidosCreacion() {
            CrearProductoRequest reqDefault = new CrearProductoRequest(
                    "Base Líquida", 30000.0, 10, null, CategoriaProducto.ROSTRO, 1L, null
            );
            assertEquals("NO_APLICA", reqDefault.tono(), "Si tono es null, debe normalizarse a NO_APLICA");
            assertTrue(validator.validate(reqDefault).isEmpty());

            CrearProductoRequest reqTono1 = new CrearProductoRequest(
                    "Base Líquida", 30000.0, 10, null, CategoriaProducto.ROSTRO, 1L, "1"
            );
            assertTrue(validator.validate(reqTono1).isEmpty());

            CrearProductoRequest reqTono10 = new CrearProductoRequest(
                    "Base Líquida", 30000.0, 10, null, CategoriaProducto.ROSTRO, 1L, "10"
            );
            assertTrue(validator.validate(reqTono10).isEmpty());
        }

        @Test
        @DisplayName("Debe rechazar tonos fuera de rango o texto arbitrario")
        void testTonosInvalidosCreacion() {
            CrearProductoRequest reqCero = new CrearProductoRequest(
                    "Base Líquida", 30000.0, 10, null, CategoriaProducto.ROSTRO, 1L, "0"
            );
            assertFalse(validator.validate(reqCero).isEmpty());

            CrearProductoRequest reqOnce = new CrearProductoRequest(
                    "Base Líquida", 30000.0, 10, null, CategoriaProducto.ROSTRO, 1L, "11"
            );
            assertFalse(validator.validate(reqOnce).isEmpty());

            CrearProductoRequest reqTexto = new CrearProductoRequest(
                    "Base Líquida", 30000.0, 10, null, CategoriaProducto.ROSTRO, 1L, "claro"
            );
            assertFalse(validator.validate(reqTexto).isEmpty());
        }
    }

    @Nested
    @DisplayName("ActualizarProductoRequest (RF-012, RF-013, RF-014)")
    class ActualizarProductoRequestTests {

        @Test
        @DisplayName("Debe rechazar payload vacío donde todos los campos son nulos")
        void testPayloadVacioInvalido() {
            ActualizarProductoRequest request = new ActualizarProductoRequest(
                    null, null, null, null, null, null
            );

            Set<ConstraintViolation<ActualizarProductoRequest>> violations = validator.validate(request);
            assertFalse(violations.isEmpty(), "Un payload sin ningún campo para actualizar debe ser rechazado");
            assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("al menos un campo")));
        }

        @Test
        @DisplayName("Debe aceptar payload con solo activo para reactivación o desactivación")
        void testPayloadSoloActivoValido() {
            ActualizarProductoRequest request = new ActualizarProductoRequest(
                    null, null, null, null, null, false
            );

            Set<ConstraintViolation<ActualizarProductoRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty(), "Actualizar solo activo debe ser válido");
        }

        @Test
        @DisplayName("Debe aceptar payload con solo cantidad para ajuste rápido de existencias")
        void testPayloadSoloCantidadValido() {
            ActualizarProductoRequest request = new ActualizarProductoRequest(
                    null, null, 25, (CategoriaProducto) null, null, null
            );

            Set<ConstraintViolation<ActualizarProductoRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty(), "Actualizar solo cantidad debe ser válido");
        }

        @Test
        @DisplayName("Debe rechazar precio negativo o cantidad negativa")
        void testValoresNegativosRechazados() {
            ActualizarProductoRequest reqPrecioNeg = new ActualizarProductoRequest(
                    null, -500.0, null, (CategoriaProducto) null, null, null
            );
            ActualizarProductoRequest reqCantidadNeg = new ActualizarProductoRequest(
                    null, null, -10, (CategoriaProducto) null, null, null
            );

            assertFalse(validator.validate(reqPrecioNeg).isEmpty());
            assertFalse(validator.validate(reqCantidadNeg).isEmpty());
        }

        @Test
        @DisplayName("Debe aceptar payload con solo tono válido para actualización")
        void testPayloadSoloTonoValido() {
            ActualizarProductoRequest request = new ActualizarProductoRequest(
                    null, null, null, null, null, null, null, "5"
            );

            Set<ConstraintViolation<ActualizarProductoRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty(), "Actualizar solo tono debe ser válido");
            assertEquals("5", request.tono());
        }

        @Test
        @DisplayName("Debe rechazar tono inválido en ActualizarProductoRequest")
        void testTonoInvalidoActualizacion() {
            ActualizarProductoRequest request = new ActualizarProductoRequest(
                    null, null, null, null, null, null, null, "11"
            );

            Set<ConstraintViolation<ActualizarProductoRequest>> violations = validator.validate(request);
            assertFalse(violations.isEmpty(), "Tono 11 debe ser rechazado");
            assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("El tono debe ser")));
        }
    }
}
