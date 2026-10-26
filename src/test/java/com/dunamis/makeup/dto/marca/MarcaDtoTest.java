package com.dunamis.makeup.dto.marca;

import com.dunamis.makeup.Entity.Marca;
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

@DisplayName("Pruebas Unitarias - DTOs de Marca (RF-001, RF-007, RF-011)")
class MarcaDtoTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Nested
    @DisplayName("MarcaResponse")
    class MarcaResponseTests {

        @Test
        @DisplayName("Debe instanciar y exponer atributos inmutables correctamente")
        void testCreacionMarcaResponse() {
            MarcaResponse response = new MarcaResponse(10L, "Trendy", true);

            assertEquals(10L, response.id());
            assertEquals("Trendy", response.nombre());
            assertTrue(response.activa());
        }

        @Test
        @DisplayName("Debe mapear correctamente desde una entidad JPA Marca")
        void testFromEntity() {
            Marca entidad = new Marca("Purpure");
            entidad.setId(5L);
            entidad.setActiva(false);

            MarcaResponse response = MarcaResponse.fromEntity(entidad);

            assertEquals(5L, response.id());
            assertEquals("Purpure", response.nombre());
            assertFalse(response.activa());
        }
    }

    @Nested
    @DisplayName("CrearMarcaRequest (RF-007)")
    class CrearMarcaRequestTests {

        @Test
        @DisplayName("Debe ser válido cuando el nombre tiene entre 2 y 80 caracteres")
        void testCrearMarcaRequestValido() {
            CrearMarcaRequest request = new CrearMarcaRequest("Trendy");
            Set<ConstraintViolation<CrearMarcaRequest>> violations = validator.validate(request);

            assertTrue(violations.isEmpty(), "No debería tener violaciones de validación");
            assertEquals("Trendy", request.nombre());
        }

        @Test
        @DisplayName("Debe fallar cuando el nombre es nulo o vacío")
        void testNombreNuloOVacio() {
            CrearMarcaRequest requestNulo = new CrearMarcaRequest(null);
            Set<ConstraintViolation<CrearMarcaRequest>> violationsNulo = validator.validate(requestNulo);
            assertFalse(violationsNulo.isEmpty());

            CrearMarcaRequest requestVacio = new CrearMarcaRequest("   ");
            Set<ConstraintViolation<CrearMarcaRequest>> violationsVacio = validator.validate(requestVacio);
            assertFalse(violationsVacio.isEmpty());
        }

        @Test
        @DisplayName("Debe fallar cuando el nombre tiene menos de 2 caracteres")
        void testNombreMenorALongitudMinima() {
            CrearMarcaRequest request = new CrearMarcaRequest("A");
            Set<ConstraintViolation<CrearMarcaRequest>> violations = validator.validate(request);

            assertFalse(violations.isEmpty(), "Debe fallar por tamaño mínimo");
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("nombre")));
        }

        @Test
        @DisplayName("Debe fallar cuando el nombre supera los 80 caracteres")
        void testNombreSuperaLongitudMaxima() {
            String nombreLargo = "M".repeat(81);
            CrearMarcaRequest request = new CrearMarcaRequest(nombreLargo);
            Set<ConstraintViolation<CrearMarcaRequest>> violations = validator.validate(request);

            assertFalse(violations.isEmpty(), "Debe fallar por tamaño máximo de 80");
            assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("nombre")));
        }
    }

    @Nested
    @DisplayName("ActualizarMarcaRequest (RF-011)")
    class ActualizarMarcaRequestTests {

        @Test
        @DisplayName("Debe ser válido al actualizar solo el nombre")
        void testActualizarSoloNombre() {
            ActualizarMarcaRequest request = new ActualizarMarcaRequest("Trendy Cosméticos", null);
            Set<ConstraintViolation<ActualizarMarcaRequest>> violations = validator.validate(request);

            assertTrue(violations.isEmpty());
            assertEquals("Trendy Cosméticos", request.nombre());
            assertNull(request.activa());
        }

        @Test
        @DisplayName("Debe ser válido al actualizar solo el estado activa")
        void testActualizarSoloEstado() {
            ActualizarMarcaRequest request = new ActualizarMarcaRequest(null, false);
            Set<ConstraintViolation<ActualizarMarcaRequest>> violations = validator.validate(request);

            assertTrue(violations.isEmpty());
            assertNull(request.nombre());
            assertFalse(request.activa());
        }

        @Test
        @DisplayName("Debe ser válido al actualizar nombre y estado simultáneamente")
        void testActualizarAmbosCampos() {
            ActualizarMarcaRequest request = new ActualizarMarcaRequest("Trendy Pro", true);
            Set<ConstraintViolation<ActualizarMarcaRequest>> violations = validator.validate(request);

            assertTrue(violations.isEmpty());
            assertEquals("Trendy Pro", request.nombre());
            assertTrue(request.activa());
        }

        @Test
        @DisplayName("Debe fallar cuando todos los campos son nulos (payload vacío)")
        void testPayloadVacio() {
            ActualizarMarcaRequest request = new ActualizarMarcaRequest(null, null);
            Set<ConstraintViolation<ActualizarMarcaRequest>> violations = validator.validate(request);

            assertFalse(violations.isEmpty(), "Debe violar la regla de al menos un campo presente");
        }

        @Test
        @DisplayName("Debe fallar cuando nombre solo contiene espacios y activa es nulo")
        void testNombreSoloEspacios() {
            ActualizarMarcaRequest request = new ActualizarMarcaRequest("   ", null);
            Set<ConstraintViolation<ActualizarMarcaRequest>> violations = validator.validate(request);

            assertFalse(violations.isEmpty(), "Debe rechazar nombre en blanco");
        }

        @Test
        @DisplayName("Debe fallar cuando el nombre supera los 80 caracteres")
        void testNombreSuperaMaximo() {
            String nombreLargo = "B".repeat(81);
            ActualizarMarcaRequest request = new ActualizarMarcaRequest(nombreLargo, null);
            Set<ConstraintViolation<ActualizarMarcaRequest>> violations = validator.validate(request);

            assertFalse(violations.isEmpty(), "Debe rechazar longitud mayor a 80");
        }
    }
}
