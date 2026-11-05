package com.dunamis.makeup.dto.categoria;

import com.dunamis.makeup.entity.Categoria;
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

@DisplayName("Pruebas Unitarias - DTOs de Categoria (Spec 008 - RF-001, RF-007, RF-011)")
class CategoriaDtoTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Nested
    @DisplayName("CategoriaResponse")
    class CategoriaResponseTests {

        @Test
        @DisplayName("Debe instanciar y exponer atributos inmutables correctamente")
        void testCreacionCategoriaResponse() {
            CategoriaResponse response = new CategoriaResponse(10L, "Skincare", true);

            assertEquals(10L, response.id());
            assertEquals("Skincare", response.nombre());
            assertTrue(response.activa());
        }

        @Test
        @DisplayName("Debe mapear correctamente desde una entidad JPA Categoria")
        void testFromEntity() {
            Categoria entidad = new Categoria("Fragancias");
            entidad.setId(5L);
            entidad.setActiva(false);

            CategoriaResponse response = CategoriaResponse.fromEntity(entidad);

            assertEquals(5L, response.id());
            assertEquals("Fragancias", response.nombre());
            assertFalse(response.activa());
        }

        @Test
        @DisplayName("Debe retornar null cuando la entidad es nula")
        void testFromEntityNull() {
            assertNull(CategoriaResponse.fromEntity(null));
        }
    }

    @Nested
    @DisplayName("CrearCategoriaRequest (RF-007)")
    class CrearCategoriaRequestTests {

        @Test
        @DisplayName("Debe ser válido con un nombre correcto entre 2 y 60 caracteres")
        void testCrearCategoriaValida() {
            CrearCategoriaRequest request = new CrearCategoriaRequest("Uñas Acrílicas");
            Set<ConstraintViolation<CrearCategoriaRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty());
        }

        @Test
        @DisplayName("Debe fallar si el nombre está en blanco")
        void testNombreEnBlanco() {
            CrearCategoriaRequest request = new CrearCategoriaRequest("   ");
            Set<ConstraintViolation<CrearCategoriaRequest>> violations = validator.validate(request);
            assertFalse(violations.isEmpty());
        }

        @Test
        @DisplayName("Debe fallar si el nombre tiene menos de 2 caracteres")
        void testNombreMuyCorto() {
            CrearCategoriaRequest request = new CrearCategoriaRequest("A");
            Set<ConstraintViolation<CrearCategoriaRequest>> violations = validator.validate(request);
            assertFalse(violations.isEmpty());
        }

        @Test
        @DisplayName("Debe fallar si el nombre supera los 60 caracteres")
        void testNombreMuyLargo() {
            String largo = "A".repeat(61);
            CrearCategoriaRequest request = new CrearCategoriaRequest(largo);
            Set<ConstraintViolation<CrearCategoriaRequest>> violations = validator.validate(request);
            assertFalse(violations.isEmpty());
        }
    }

    @Nested
    @DisplayName("ActualizarCategoriaRequest (RF-011)")
    class ActualizarCategoriaRequestTests {

        @Test
        @DisplayName("Debe ser válido si solo actualiza el nombre")
        void testSoloNombre() {
            ActualizarCategoriaRequest request = new ActualizarCategoriaRequest("Cuidado Facial", null);
            Set<ConstraintViolation<ActualizarCategoriaRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty());
            assertTrue(request.isValido());
        }

        @Test
        @DisplayName("Debe ser válido si solo actualiza el estado activa")
        void testSoloActiva() {
            ActualizarCategoriaRequest request = new ActualizarCategoriaRequest(null, false);
            Set<ConstraintViolation<ActualizarCategoriaRequest>> violations = validator.validate(request);
            assertTrue(violations.isEmpty());
            assertTrue(request.isValido());
        }

        @Test
        @DisplayName("Debe fallar si tanto nombre como activa son nulos")
        void testAmbosNulos() {
            ActualizarCategoriaRequest request = new ActualizarCategoriaRequest(null, null);
            Set<ConstraintViolation<ActualizarCategoriaRequest>> violations = validator.validate(request);
            assertFalse(violations.isEmpty());
            assertFalse(request.isValido());
        }

        @Test
        @DisplayName("Debe fallar si el nombre es cadena en blanco")
        void testNombreEspacios() {
            ActualizarCategoriaRequest request = new ActualizarCategoriaRequest("   ", true);
            Set<ConstraintViolation<ActualizarCategoriaRequest>> violations = validator.validate(request);
            assertFalse(violations.isEmpty());
            assertFalse(request.isValido());
        }
    }
}
