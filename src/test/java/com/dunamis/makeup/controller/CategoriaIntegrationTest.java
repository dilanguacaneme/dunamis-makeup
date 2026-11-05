package com.dunamis.makeup.controller;

import com.dunamis.makeup.entity.Categoria;
import com.dunamis.makeup.entity.RolUsuario;
import com.dunamis.makeup.entity.Usuario;
import com.dunamis.makeup.repository.CategoriaRepository;
import com.dunamis.makeup.repository.UsuarioRepository;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Pruebas de Integración - CategoriaController (Spec 008)")
class CategoriaIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private MockHttpSession adminSession;
    private MockHttpSession sellerSession;
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
        if (usuarioRepository.findByNombreUsuarioIgnoreCase("admin_cat_test").isEmpty()) {
            Usuario admin = new Usuario("admin_cat_test", "Admin Cat Test", passwordEncoder.encode("AdminPass1234*"));
            admin.setRol(RolUsuario.ADMIN);
            usuarioRepository.save(admin);
        }
        if (usuarioRepository.findByNombreUsuarioIgnoreCase("seller_cat_test").isEmpty()) {
            Usuario seller = new Usuario("seller_cat_test", "Seller Cat Test", passwordEncoder.encode("SellerPass1234*"));
            seller.setRol(RolUsuario.VENDEDOR);
            usuarioRepository.save(seller);
        }

        csrfCookie = obtainCsrfCookie();
        adminSession = login("admin_cat_test", "AdminPass1234*");
        sellerSession = login("seller_cat_test", "SellerPass1234*");

        categoriaRepository.findByNombreIgnoreCase("Cat Inactiva Test").ifPresentOrElse(
                c -> {
                    c.setActiva(false);
                    categoriaRepository.save(c);
                },
                () -> {
                    Categoria inactiva = new Categoria("Cat Inactiva Test");
                    inactiva.setActiva(false);
                    categoriaRepository.save(inactiva);
                }
        );
    }

    @Test
    @DisplayName("GET /categorias sin sesión debe responder 401 Unauthorized")
    void testListarSinSesion() throws Exception {
        mockMvc.perform(get("/categorias"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("GET /categorias como ADMIN debe listar categorías activas")
    void testListarActivas() throws Exception {
        mockMvc.perform(get("/categorias")
                        .session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)))
                .andExpect(jsonPath("$[*].nombre", not(hasItem("Cat Inactiva Test"))));
    }

    @Test
    @DisplayName("GET /categorias?incluirInactivas=true como ADMIN debe listar todas")
    void testListarTodasComoAdmin() throws Exception {
        mockMvc.perform(get("/categorias")
                        .session(adminSession)
                        .param("incluirInactivas", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].nombre", hasItem("Cat Inactiva Test")));
    }

    @Test
    @DisplayName("GET /categorias?incluirInactivas=true como VENDEDOR debe responder 403 Forbidden")
    void testListarTodasComoVendedorDenegado() throws Exception {
        mockMvc.perform(get("/categorias")
                        .session(sellerSession)
                        .param("incluirInactivas", "true"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("POST /categorias con datos válidos crea la categoría con HTTP 201")
    void testCrearCategoriaExitosa() throws Exception {
        String json = "{\"nombre\":\"Brochas de Maquillaje\"}";

        mockMvc.perform(post("/categorias")
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.nombre").value("Brochas de Maquillaje"))
                .andExpect(jsonPath("$.activa").value(true));
    }

    @Test
    @DisplayName("POST /categorias con nombre duplicado responde 409 Conflict")
    void testCrearCategoriaDuplicada() throws Exception {
        String json = "{\"nombre\":\"Rostro\"}";

        mockMvc.perform(post("/categorias")
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("CONFLICT"));
    }

    @Test
    @DisplayName("POST /categorias con rol VENDEDOR responde 403 Forbidden")
    void testCrearCategoriaComoVendedorDenegado() throws Exception {
        String json = "{\"nombre\":\"Fragancias Exclusivas\"}";

        mockMvc.perform(post("/categorias")
                        .session(sellerSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("PATCH /categorias/{id} actualiza nombre y estado con HTTP 200")
    void testActualizarCategoria() throws Exception {
        Categoria cat = categoriaRepository.findByNombreIgnoreCase("Cat Para Actualizar")
                .orElseGet(() -> categoriaRepository.save(new Categoria("Cat Para Actualizar")));

        String json = "{\"nombre\":\"Cat Actualizada Nombre\",\"activa\":false}";

        mockMvc.perform(patch("/categorias/" + cat.getId())
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Cat Actualizada Nombre"))
                .andExpect(jsonPath("$.activa").value(false));
    }

    @Test
    @DisplayName("PATCH /categorias/{id} con ID inexistente responde 404 Not Found")
    void testActualizarCategoriaInexistente() throws Exception {
        String json = "{\"nombre\":\"Inexistente\",\"activa\":true}";

        mockMvc.perform(patch("/categorias/999999")
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }
}
