package com.dunamis.makeup.config;

import com.dunamis.makeup.Repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("Pruebas de Integración - Aislamiento del Perfil de Tests (RF-018)")
class TestIsolationIntegrationTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Value("${app.admin.maryuri-password}")
    private String adminPassword;

    @Test
    @DisplayName("Debe conectarse a una base de datos H2 en memoria y no a PostgreSQL de producción")
    void testAislamientoBaseDeDatos() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            String dbProductName = connection.getMetaData().getDatabaseProductName();
            assertEquals("H2", dbProductName, "El entorno de pruebas debe usar exclusivamente H2 en memoria");
        }
    }

    @Test
    @DisplayName("Debe arrancar el contexto sin variables de entorno obligatorias (RF-018)")
    void testPropiedadesTestCargadas() {
        assertNotNull(adminPassword, "La contraseña de prueba debe estar inyectada");
        assertEquals("TestMaryuri123*", adminPassword);
    }

    @Test
    @DisplayName("Debe inicializar las administradoras en la base de datos en memoria")
    void testSembradoInicialEnMemoria() {
        assertTrue(usuarioRepository.findByNombreUsuarioIgnoreCase("maryuri").isPresent(),
                "La administradora maryuri debe sembrarse automáticamente en H2");
        assertTrue(usuarioRepository.findByNombreUsuarioIgnoreCase("caterin").isPresent(),
                "La administradora caterin debe sembrarse automáticamente en H2");
    }
}
