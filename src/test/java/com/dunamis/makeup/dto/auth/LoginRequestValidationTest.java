package com.dunamis.makeup.dto.auth;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Pruebas Unitarias - Validación de LoginRequest")
class LoginRequestValidationTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("Debe ser válido cuando username y password cumplen todas las restricciones")
    void testLoginRequestValido() {
        LoginRequest request = new LoginRequest("admin", "Admin123456*");
        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty(), "No debería haber violaciones de validación");
        assertEquals("admin", request.username());
        assertEquals("Admin123456*", request.password());
    }

    @Test
    @DisplayName("Debe fallar cuando username es nulo o vacío (RF-004)")
    void testUsernameVacio() {
        LoginRequest request = new LoginRequest("", "Admin123456*");
        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty(), "Debe detectar violación de @NotBlank en username");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("username")));
    }

    @Test
    @DisplayName("Debe fallar cuando password es nulo o en blanco (RF-004)")
    void testPasswordEnBlanco() {
        LoginRequest request = new LoginRequest("admin", "   ");
        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty(), "Debe detectar violación de @NotBlank en password");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("password")));
    }

    @Test
    @DisplayName("Debe fallar cuando username supera 50 caracteres (RF-004)")
    void testUsernameSuperaLongitudMaxima() {
        String usernameLargo = "a".repeat(51);
        LoginRequest request = new LoginRequest(usernameLargo, "Admin123456*");
        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);

        assertFalse(violations.isEmpty(), "Debe detectar violación de @Size en username");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("username")));
    }
}
