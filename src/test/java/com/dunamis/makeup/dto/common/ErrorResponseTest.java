package com.dunamis.makeup.dto.common;

import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Pruebas Unitarias - DTO ErrorResponse")
class ErrorResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("Debe instanciar y acceder a los campos del record correctamente")
    void testCreacionErrorResponse() {
        long now = System.currentTimeMillis();
        ErrorResponse errorResponse = new ErrorResponse("UNAUTHORIZED", "Usuario o contraseña incorrectos", now);

        assertEquals("UNAUTHORIZED", errorResponse.error());
        assertEquals("Usuario o contraseña incorrectos", errorResponse.message());
        assertEquals(now, errorResponse.timestamp());
    }

    @Test
    @DisplayName("Debe serializar ErrorResponse a JSON cumpliendo el contrato del Principio 11")
    void testSerializacionJson() throws Exception {
        long timestamp = 1700000000000L;
        ErrorResponse errorResponse = new ErrorResponse("FORBIDDEN", "Acceso denegado", timestamp);

        String json = objectMapper.writeValueAsString(errorResponse);

        assertTrue(json.contains("\"error\":\"FORBIDDEN\""));
        assertTrue(json.contains("\"message\":\"Acceso denegado\""));
        assertTrue(json.contains("\"timestamp\":1700000000000"));
    }

    @Test
    @DisplayName("Debe deserializar un JSON a objeto ErrorResponse")
    void testDeserializacionJson() throws Exception {
        String json = "{\"error\":\"BAD_REQUEST\",\"message\":\"Payload inválido\",\"timestamp\":1700000000000}";

        ErrorResponse response = objectMapper.readValue(json, ErrorResponse.class);

        assertNotNull(response);
        assertEquals("BAD_REQUEST", response.error());
        assertEquals("Payload inválido", response.message());
        assertEquals(1700000000000L, response.timestamp());
    }

    @Test
    @DisplayName("Método de fábrica ErrorResponse.of(error, message) genera timestamp automático")
    void testFactoryMethod() {
        long antes = System.currentTimeMillis();
        ErrorResponse errorResponse = ErrorResponse.of("CSRF_INVALID", "Token CSRF inválido o faltante");
        long despues = System.currentTimeMillis();

        assertEquals("CSRF_INVALID", errorResponse.error());
        assertEquals("Token CSRF inválido o faltante", errorResponse.message());
        assertTrue(errorResponse.timestamp() >= antes && errorResponse.timestamp() <= despues);
    }
}
