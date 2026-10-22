package com.dunamis.makeup.dto.auth;

import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Pruebas Unitarias - DTO UsuarioResponse")
class UsuarioResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("Debe instanciar y acceder a los campos de UsuarioResponse correctamente (RF-008)")
    void testCreacionUsuarioResponse() {
        UsuarioResponse response = new UsuarioResponse("maryuri", "Maryuri Admin", "ADMIN");

        assertEquals("maryuri", response.username());
        assertEquals("Maryuri Admin", response.fullName());
        assertEquals("ADMIN", response.role());
    }

    @Test
    @DisplayName("Debe serializar UsuarioResponse a JSON sin exponer hashes ni contraseñas")
    void testSerializacionJson() throws Exception {
        UsuarioResponse response = new UsuarioResponse("caterin", "Caterin Admin", "ADMIN");
        String json = objectMapper.writeValueAsString(response);

        assertTrue(json.contains("\"username\":\"caterin\""));
        assertTrue(json.contains("\"fullName\":\"Caterin Admin\""));
        assertTrue(json.contains("\"role\":\"ADMIN\""));
        assertFalse(json.contains("password"));
        assertFalse(json.contains("hash"));
    }

    @Test
    @DisplayName("Debe deserializar JSON a UsuarioResponse")
    void testDeserializacionJson() throws Exception {
        String json = "{\"username\":\"vendedor1\",\"fullName\":\"Vendedor Prueba\",\"role\":\"VENDEDOR\"}";
        UsuarioResponse response = objectMapper.readValue(json, UsuarioResponse.class);

        assertNotNull(response);
        assertEquals("vendedor1", response.username());
        assertEquals("Vendedor Prueba", response.fullName());
        assertEquals("VENDEDOR", response.role());
    }
}
