package com.dunamis.makeup.controller;

import com.dunamis.makeup.Entity.CategoriaProducto;
import com.dunamis.makeup.Entity.Marca;
import com.dunamis.makeup.Entity.Producto;
import com.dunamis.makeup.Entity.RolUsuario;
import com.dunamis.makeup.Entity.Usuario;
import com.dunamis.makeup.Repository.MarcaRepository;
import com.dunamis.makeup.Repository.ProductoRepository;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Pruebas de Integración - Endpoints MarcaController (RF-002, RF-003, RF-005 a RF-014)")
class MarcaIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MarcaRepository marcaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private MockHttpSession adminSession;
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
        if (usuarioRepository.findByNombreUsuarioIgnoreCase("admin_marcas").isEmpty()) {
            Usuario admin = new Usuario("admin_marcas", "Admin Marcas", passwordEncoder.encode("AdminPass1234*"));
            admin.setRol(RolUsuario.ADMIN);
            usuarioRepository.save(admin);
        }

        csrfCookie = obtainCsrfCookie();
        adminSession = login("admin_marcas", "AdminPass1234*");

        marcaRepository.findByNombreIgnoreCase("Marca Test Inactiva").ifPresentOrElse(
                m -> {
                    m.setActiva(false);
                    marcaRepository.save(m);
                },
                () -> {
                    Marca inactiva = new Marca("Marca Test Inactiva");
                    inactiva.setActiva(false);
                    marcaRepository.save(inactiva);
                }
        );
    }

    @Test
    @DisplayName("GET /marcas sin sesión debe retornar 401 Unauthorized estructurado (RF-005)")
    void testGetMarcasSinSesionRetorna401() throws Exception {
        mockMvc.perform(get("/marcas"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Se requiere iniciar sesión"))
                .andExpect(jsonPath("$.timestamp").isNumber());
    }

    @Test
    @DisplayName("GET /marcas con sesión ADMIN retorna solo marcas activas ordenadas alfabéticamente (RF-002)")
    void testGetMarcasSoloActivas() throws Exception {
        mockMvc.perform(get("/marcas").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", isA(Iterable.class)))
                .andExpect(jsonPath("$[*].activa", everyItem(is(true))))
                .andExpect(jsonPath("$[?(@.nombre == 'Marca Test Inactiva')]").doesNotExist());
    }

    @Test
    @DisplayName("GET /marcas?incluirInactivas=true con sesión ADMIN retorna activas e inactivas (RF-003)")
    void testGetMarcasTodasAdmin() throws Exception {
        mockMvc.perform(get("/marcas")
                        .param("incluirInactivas", "true")
                        .session(adminSession))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[?(@.nombre == 'Marca Test Inactiva')]").exists())
                .andExpect(jsonPath("$[?(@.nombre == 'Marca Test Inactiva')].activa").value(false));
    }

    @Test
    @DisplayName("POST /marcas exitoso retorna 201 Created y DTO MarcaResponse (RF-006)")
    void testPostMarcaExitosa() throws Exception {
        String jsonPayload = "{\"nombre\":\"Nueva Marca Cosmética\"}";

        mockMvc.perform(post("/marcas")
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.nombre").value("Nueva Marca Cosmética"))
                .andExpect(jsonPath("$.activa").value(true));
    }

    @Test
    @DisplayName("POST /marcas normaliza espacios redundantes internos (RF-006)")
    void testPostMarcaNormalizaEspacios() throws Exception {
        String jsonPayload = "{\"nombre\":\"   Marca     Espaciada    Especial   \"}";

        mockMvc.perform(post("/marcas")
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre").value("Marca Espaciada Especial"))
                .andExpect(jsonPath("$.activa").value(true));
    }

    @Test
    @DisplayName("POST /marcas con nombre duplicado retorna 409 Conflict (RF-008)")
    void testPostMarcaDuplicadaRetorna409() throws Exception {
        String jsonPayload = "{\"nombre\":\"trendy\"}";

        mockMvc.perform(post("/marcas")
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("CONFLICT"))
                .andExpect(jsonPath("$.message").value("Ya existe una marca con ese nombre"));
    }

    @Test
    @DisplayName("POST /marcas con nombre en blanco retorna 400 Bad Request estructurado (RF-007)")
    void testPostMarcaNombreInvalidoRetorna400() throws Exception {
        String jsonPayload = "{\"nombre\":\"   \"}";

        mockMvc.perform(post("/marcas")
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("BAD_REQUEST"));
    }

    @Test
    @DisplayName("POST /marcas sin token CSRF es rechazado con 403 Forbidden (RF-006)")
    void testPostMarcaSinCsrfRechazado() throws Exception {
        mockMvc.perform(post("/marcas")
                        .session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Marca Sin CSRF\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("CSRF_INVALID"));
    }

    @Test
    @DisplayName("PATCH /marcas/{id} renombra la marca exitosamente (RF-010)")
    void testPatchMarcaRenombrar() throws Exception {
        Marca m = marcaRepository.save(new Marca("Marca Para Renombrar"));

        mockMvc.perform(patch("/marcas/" + m.getId())
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Marca Renombrada Ok\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(m.getId()))
                .andExpect(jsonPath("$.nombre").value("Marca Renombrada Ok"));
    }

    @Test
    @DisplayName("PATCH /marcas/{id} permite alternar el estado activa (RF-010)")
    void testPatchMarcaToggleActiva() throws Exception {
        Marca m = marcaRepository.save(new Marca("Marca Para Toggle"));

        mockMvc.perform(patch("/marcas/" + m.getId())
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"activa\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activa").value(false));

        mockMvc.perform(patch("/marcas/" + m.getId())
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"activa\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activa").value(true));
    }

    @Test
    @DisplayName("PATCH /marcas/{id} con payload vacío retorna 400 Bad Request (RF-011)")
    void testPatchMarcaPayloadVacioRetorna400() throws Exception {
        Marca m = marcaRepository.findAll().get(0);

        mockMvc.perform(patch("/marcas/" + m.getId())
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("BAD_REQUEST"));
    }

    @Test
    @DisplayName("PATCH /marcas/{id} con ID inexistente retorna 404 Not Found (RF-012)")
    void testPatchMarcaInexistenteRetorna404() throws Exception {
        mockMvc.perform(patch("/marcas/99999")
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"activa\":false}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("DELETE /marcas/{id} debe estar prohibido y retornar 405 Method Not Allowed (RF-014)")
    void testDeleteMarcaProhibido() throws Exception {
        mockMvc.perform(delete("/marcas/1")
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue()))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    @DisplayName("Desactivar marca preserva integridad referencial de productos asociados (RF-015)")
    void testIntegridadMarcaInactivaConProductos() throws Exception {
        Marca marca = marcaRepository.save(new Marca("Marca Con Productos"));
        Producto producto = new Producto();
        producto.setNombre("Labial Velvet");
        producto.setPrecio(25000.0);
        producto.setCantidad(10);
        producto.setCategoria(CategoriaProducto.LABIOS);
        producto.setMarca(marca);
        producto = productoRepository.save(producto);

        // Desactivar marca vía PATCH
        mockMvc.perform(patch("/marcas/" + marca.getId())
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"activa\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activa").value(false));

        // Verificar persistencia del producto e integridad referencial (RF-015, Principio 5 y 12)
        Producto productoEnDb = productoRepository.findById(producto.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("Labial Velvet", productoEnDb.getNombre());
        org.junit.jupiter.api.Assertions.assertNotNull(productoEnDb.getMarca());
        org.junit.jupiter.api.Assertions.assertEquals(marca.getId(), productoEnDb.getMarca().getId());
        org.junit.jupiter.api.Assertions.assertEquals(false, productoEnDb.getMarca().getActiva());
    }
}
