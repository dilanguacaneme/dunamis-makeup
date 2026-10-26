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
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Pruebas de Seguridad y RBAC - Productos (RF-005, RF-011)")
class ProductoRbacSecurityTest {

    @Autowired
    private MockMvc mockMvc;

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
        if (usuarioRepository.findByNombreUsuarioIgnoreCase("vendedor_rbac_prod").isEmpty()) {
            Usuario vendedor = new Usuario("vendedor_rbac_prod", "Vendedor RBAC", passwordEncoder.encode("VendedorPass1234*"));
            vendedor.setRol(RolUsuario.VENDEDOR);
            usuarioRepository.save(vendedor);
        }

        csrfCookie = obtainCsrfCookie();
        vendedorSession = login("vendedor_rbac_prod", "VendedorPass1234*");
    }

    @Test
    @DisplayName("POST /producto/crear con rol VENDEDOR debe retornar 403 Forbidden estructurado (RF-011)")
    void testCrearProductoVendedorRetorna403() throws Exception {
        String payload = """
                {
                    "nombre": "Producto Prohibido",
                    "precio": 25000.0,
                    "cantidad": 5,
                    "categoria": "ROSTRO",
                    "marcaId": 1
                }
                """;

        mockMvc.perform(post("/producto/crear")
                        .session(vendedorSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error", is("FORBIDDEN")));
    }

    @Test
    @DisplayName("PATCH /producto/actualizar/{id} con rol VENDEDOR debe retornar 403 Forbidden")
    void testActualizarProductoVendedorRetorna403() throws Exception {
        String payload = """
                {
                    "precio": 30000.0
                }
                """;

        mockMvc.perform(patch("/producto/actualizar/1")
                        .session(vendedorSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error", is("FORBIDDEN")));
    }

    @Test
    @DisplayName("DELETE /producto/borrar-producto-por-id/{id} con rol VENDEDOR debe retornar 403 Forbidden")
    void testBorrarProductoVendedorRetorna403() throws Exception {
        mockMvc.perform(delete("/producto/borrar-producto-por-id/1")
                        .session(vendedorSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue()))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error", is("FORBIDDEN")));
    }
}
