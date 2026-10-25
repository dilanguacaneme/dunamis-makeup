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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Pruebas de Integración - Login JSON, Sesión y Logout (RF-003, RF-004, RF-005, RF-006, RF-008, RF-009, RF-010, RF-011)")
class AuthLoginIntegrationTest {

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

    @BeforeEach
    void setUp() {
        // Asegurar que exista un usuario vendedor activo y uno inactivo para las pruebas
        if (usuarioRepository.findByNombreUsuarioIgnoreCase("vendedora").isEmpty()) {
            Usuario vendedor = new Usuario(
                    "vendedora",
                    "Laura Vendedora",
                    passwordEncoder.encode("VendedoraPass123*")
            );
            vendedor.setRol(RolUsuario.VENDEDOR);
            vendedor.setActivo(true);
            usuarioRepository.save(vendedor);
        }

        if (usuarioRepository.findByNombreUsuarioIgnoreCase("inactivo").isEmpty()) {
            Usuario inactivo = new Usuario(
                    "inactivo",
                    "Usuario Inactivo",
                    passwordEncoder.encode("InactivoPass123*")
            );
            inactivo.setRol(RolUsuario.VENDEDOR);
            inactivo.setActivo(false);
            usuarioRepository.save(inactivo);
        }
    }

    @Test
    @DisplayName("RF-003: Login JSON exitoso crea sesión JSESSIONID y responde authenticated=true")
    void testLoginJsonExitoso() throws Exception {
        Cookie csrf = obtainCsrfCookie();
        assertNotNull(csrf);

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"maryuri\",\"password\":\"TestMaryuri123*\"}"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.authenticated").value(true))
                .andReturn();

        Cookie jsessionId = result.getResponse().getCookie("JSESSIONID");
        assertNotNull(jsessionId, "Debe emitirse la cookie JSESSIONID al autenticar con éxito");
    }

    @Test
    @DisplayName("RF-004: Login con payload inválido o vacío retorna 400 Bad Request con ErrorResponse")
    void testLoginPayloadInvalidoRetorna400() throws Exception {
        Cookie csrf = obtainCsrfCookie();
        assertNotNull(csrf);

        mockMvc.perform(post("/api/auth/login")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"   \",\"password\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value("Los datos de inicio de sesión son inválidos o están incompletos"))
                .andExpect(jsonPath("$.timestamp").isNumber());
    }

    @Test
    @DisplayName("RF-005: Login con credenciales incorrectas retorna 401 Unauthorized con ErrorResponse unificado")
    void testLoginCredencialesIncorrectasRetorna401() throws Exception {
        Cookie csrf = obtainCsrfCookie();
        assertNotNull(csrf);

        mockMvc.perform(post("/api/auth/login")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"maryuri\",\"password\":\"ClaveEquivocada123*\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Usuario o contraseña incorrectos"))
                .andExpect(jsonPath("$.timestamp").isNumber());
    }

    @Test
    @DisplayName("RF-006: Login con cuenta deshabilitada retorna 401 Unauthorized con mismo mensaje unificado")
    void testLoginUsuarioInactivoRetorna401() throws Exception {
        Cookie csrf = obtainCsrfCookie();
        assertNotNull(csrf);

        mockMvc.perform(post("/api/auth/login")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"inactivo\",\"password\":\"InactivoPass123*\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Usuario o contraseña incorrectos"))
                .andExpect(jsonPath("$.timestamp").isNumber());
    }

    @Test
    @DisplayName("RF-008: GET /api/auth/me con sesión activa retorna UsuarioResponse desacoplado")
    void testConsultaSesionMeConSesionActiva() throws Exception {
        Cookie csrf = obtainCsrfCookie();
        assertNotNull(csrf);

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"maryuri\",\"password\":\"TestMaryuri123*\"}"))
                .andExpect(status().isOk())
                .andReturn();

        Cookie jsessionId = loginResult.getResponse().getCookie("JSESSIONID");
        assertNotNull(jsessionId);
        org.springframework.mock.web.MockHttpSession session =
                (org.springframework.mock.web.MockHttpSession) loginResult.getRequest().getSession();
        assertNotNull(session);

        mockMvc.perform(get("/api/auth/me")
                        .session(session)
                        .cookie(jsessionId))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.username").value("maryuri"))
                .andExpect(jsonPath("$.fullName").value("Maryuri Andrea Salazar"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    @DisplayName("RF-009: GET /api/auth/me sin sesión retorna 401 Unauthorized con ErrorResponse")
    void testConsultaSesionMeSinSesionRetorna401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Se requiere iniciar sesión"))
                .andExpect(jsonPath("$.timestamp").isNumber());
    }

    @Test
    @DisplayName("RF-010 y RF-011: POST /api/auth/logout invalida sesión y es idempotente")
    void testLogoutIdempotente() throws Exception {
        Cookie csrf = obtainCsrfCookie();
        assertNotNull(csrf);

        // 1. Logout con sesión activa
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"maryuri\",\"password\":\"TestMaryuri123*\"}"))
                .andExpect(status().isOk())
                .andReturn();

        Cookie jsessionId = loginResult.getResponse().getCookie("JSESSIONID");
        org.springframework.mock.web.MockHttpSession session =
                (org.springframework.mock.web.MockHttpSession) loginResult.getRequest().getSession();

        mockMvc.perform(post("/api/auth/logout")
                        .session(session)
                        .cookie(csrf, jsessionId)
                        .header("X-XSRF-TOKEN", csrf.getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(false));

        // 2. Logout sin sesión (idempotente - no debe fallar)
        mockMvc.perform(post("/api/auth/logout")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(false));
    }
}
