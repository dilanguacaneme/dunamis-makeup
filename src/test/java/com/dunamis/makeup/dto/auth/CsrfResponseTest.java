package com.dunamis.makeup.dto.auth;

import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Pruebas Unitarias - DTO CsrfResponse")
class CsrfResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("Debe instanciar y acceder a los campos de CsrfResponse correctamente")
    void testCreacionCsrfResponse() {
        CsrfResponse response = new CsrfResponse(true);
        assertTrue(response.ready());

        CsrfResponse responseFalse = new CsrfResponse(false);
        assertFalse(responseFalse.ready());
    }

    @Test
    @DisplayName("Debe serializar CsrfResponse a JSON con campo ready")
    void testSerializacionJson() throws Exception {
        CsrfResponse response = new CsrfResponse(true);
        String json = objectMapper.writeValueAsString(response);

        assertEquals("{\"ready\":true}", json);
    }

    @Test
    @DisplayName("Debe deserializar JSON a CsrfResponse")
    void testDeserializacionJson() throws Exception {
        String json = "{\"ready\":true}";
        CsrfResponse response = objectMapper.readValue(json, CsrfResponse.class);

        assertNotNull(response);
        assertTrue(response.ready());
    }
}
