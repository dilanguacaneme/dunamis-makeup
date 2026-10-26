package com.dunamis.makeup.controller;

import com.dunamis.makeup.Entity.Marca;
import com.dunamis.makeup.Entity.RolUsuario;
import com.dunamis.makeup.Entity.Usuario;
import com.dunamis.makeup.Repository.MarcaRepository;
import com.dunamis.makeup.Repository.UsuarioRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Pruebas de Seguridad RBAC - Restricciones de Vendedor en Marcas (RF-004, RF-009, RF-013)")
class MarcaRbacSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MarcaRepository marcaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private MockHttpSession vendedorSession;
    private Cookie csrfCookie;

    private Cookie obtainCsrfCookie() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andReturn();
        return result.getResponse().getCookie("XSRF-TOKEN");
    }

    private MockHttpSession login(String username, String password) throws Exception {
        Cookie csrf = obtainCsrfCookie();
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();

        return (MockHttpSession) result.getRequest().getSession();
    }

    @BeforeEach
    void setUp() throws Exception {
        if (usuarioRepository.findByNombreUsuarioIgnoreCase("vendedor_marcas").isEmpty()) {
            Usuario vendedor = new Usuario("vendedor_marcas", "Vendedor Marcas", passwordEncoder.encode("VendedorPass123*"));
            vendedor.setRol(RolUsuario.VENDEDOR);
            usuarioRepository.save(vendedor);
        }

        csrfCookie = obtainCsrfCookie();
        vendedorSession = login("vendedor_marcas", "VendedorPass123*");
    }

    @Test
    @DisplayName("VENDEDOR puede invocar GET /marcas para consultar marcas activas (RF-002)")
    void testVendedorPuedeListarActivas() throws Exception {
        mockMvc.perform(get("/marcas").session(vendedorSession))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }

    @Test
    @DisplayName("VENDEDOR al invocar GET /marcas?incluirInactivas=true recibe 403 Forbidden estructurado (RF-004)")
    void testVendedorNoPuedeConsultarInactivas() throws Exception {
        mockMvc.perform(get("/marcas")
                        .param("incluirInactivas", "true")
                        .session(vendedorSession))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("Acceso denegado: la consulta de marcas inactivas es exclusiva de administradores"));
    }

    @Test
    @DisplayName("VENDEDOR al intentar POST /marcas recibe 403 Forbidden estructurado (RF-009)")
    void testVendedorNoPuedeCrearMarca() throws Exception {
        mockMvc.perform(post("/marcas")
                        .session(vendedorSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Marca Ilegitima Vendedor\"}"))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("Acceso denegado: permisos insuficientes"));
    }

    @Test
    @DisplayName("VENDEDOR al intentar PATCH /marcas/{id} recibe 403 Forbidden estructurado (RF-013)")
    void testVendedorNoPuedeActualizarMarca() throws Exception {
        Marca marca = marcaRepository.findAll().get(0);

        mockMvc.perform(patch("/marcas/" + marca.getId())
                        .session(vendedorSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"activa\":false}"))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("Acceso denegado: permisos insuficientes"));
    }
}
