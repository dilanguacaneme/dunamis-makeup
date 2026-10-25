package com.dunamis.makeup.controller;

import com.dunamis.makeup.Entity.RolUsuario;
import com.dunamis.makeup.Entity.Usuario;
import com.dunamis.makeup.Repository.UsuarioRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Pruebas de Integración - Control de Acceso Basado en Roles RBAC (RF-013, RF-014, RF-015)")
class AuthRbacSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Cookie obtainCsrfCookie() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andReturn();
        return result.getResponse().getCookie("XSRF-TOKEN");
    }

    private org.springframework.mock.web.MockHttpSession login(String username, String password) throws Exception {
        Cookie csrf = obtainCsrfCookie();
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();

        return (org.springframework.mock.web.MockHttpSession) result.getRequest().getSession();
    }

    @BeforeEach
    void setUp() {
        if (usuarioRepository.findByNombreUsuarioIgnoreCase("vendedor_rbac").isEmpty()) {
            Usuario vendedor = new Usuario(
                    "vendedor_rbac",
                    "Vendedor Pruebas",
                    passwordEncoder.encode("VendedorPass123*")
            );
            vendedor.setRol(RolUsuario.VENDEDOR);
            usuarioRepository.save(vendedor);
        }
    }

    @Test
    @DisplayName("RF-013: Rol VENDEDOR puede consultar catálogo GET /producto/obtener-productos")
    void testVendedorPuedeConsultarCatalogo() throws Exception {
        org.springframework.mock.web.MockHttpSession session = login("vendedor_rbac", "VendedorPass123*");
        assertNotNull(session);

        mockMvc.perform(get("/producto/obtener-productos")
                        .session(session))
                .andExpect(status().is2xxSuccessful());
    }

    @Test
    @DisplayName("RF-014: Rol VENDEDOR recibe 403 Forbidden estructurado al intentar mutar catálogo")
    void testVendedorNoPuedeCrearProducto() throws Exception {
        org.springframework.mock.web.MockHttpSession session = login("vendedor_rbac", "VendedorPass123*");
        Cookie csrf = obtainCsrfCookie();

        mockMvc.perform(post("/producto")
                        .session(session)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Labial\",\"precio\":15000}"))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("Acceso denegado: permisos insuficientes"))
                .andExpect(jsonPath("$.timestamp").isNumber());
    }

    @Test
    @DisplayName("RF-015: Rol ADMIN tiene acceso a mutaciones de catálogo")
    void testAdminPuedeCrearProductoOModificar() throws Exception {
        org.springframework.mock.web.MockHttpSession session = login("maryuri", "TestMaryuri123*");
        Cookie csrf = obtainCsrfCookie();

        // Verificamos que no sea interceptado con 403 (puede dar 400 por payload incompleto, pero no 403)
        mockMvc.perform(post("/producto")
                        .session(session)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(
                        403, result.getResponse().getStatus(), "ADMIN no debe ser bloqueado con 403"));
    }
}
