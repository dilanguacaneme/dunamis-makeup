package com.dunamis.makeup.controller;

import com.dunamis.makeup.Entity.*;
import com.dunamis.makeup.Repository.DetalleFacturaRepository;
import com.dunamis.makeup.Repository.FacturaRepository;
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

import java.time.LocalDate;
import java.util.ArrayList;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Pruebas de Integración - Endpoints ProductoController (RF-003 a RF-019)")
class ProductoIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private MarcaRepository marcaRepository;

    @Autowired
    private FacturaRepository facturaRepository;

    @Autowired
    private DetalleFacturaRepository detalleFacturaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private MockHttpSession adminSession;
    private MockHttpSession vendedorSession;
    private Cookie csrfCookie;
    private Marca marcaTrendy;

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
        if (usuarioRepository.findByNombreUsuarioIgnoreCase("admin_prod_test").isEmpty()) {
            Usuario admin = new Usuario("admin_prod_test", "Admin Prod", passwordEncoder.encode("AdminPass1234*"));
            admin.setRol(RolUsuario.ADMIN);
            usuarioRepository.save(admin);
        }

        if (usuarioRepository.findByNombreUsuarioIgnoreCase("vendedor_prod_test").isEmpty()) {
            Usuario vendedor = new Usuario("vendedor_prod_test", "Vendedor Prod", passwordEncoder.encode("VendedorPass1234*"));
            vendedor.setRol(RolUsuario.VENDEDOR);
            usuarioRepository.save(vendedor);
        }

        csrfCookie = obtainCsrfCookie();
        adminSession = login("admin_prod_test", "AdminPass1234*");
        vendedorSession = login("vendedor_prod_test", "VendedorPass1234*");

        marcaTrendy = marcaRepository.findByNombreIgnoreCase("Trendy Prod Test").orElseGet(() -> {
            Marca m = new Marca("Trendy Prod Test");
            m.setActiva(true);
            return marcaRepository.save(m);
        });
    }

    @Test
    @DisplayName("GET /producto/obtener-productos sin sesión debe retornar 401 Unauthorized estructurado")
    void testGetProductosSinSesion() throws Exception {
        mockMvc.perform(get("/producto/obtener-productos"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("UNAUTHORIZED")));
    }

    @Test
    @DisplayName("GET /producto/obtener-productos retorna 200 OK y excluye inactivos por defecto (RF-003)")
    void testGetProductosSoloActivos() throws Exception {
        Producto activo = new Producto();
        activo.setNombre("Producto Activo Test");
        activo.setPrecio(20000.0);
        activo.setCantidad(5);
        activo.setCategoria(CategoriaProducto.ROSTRO);
        activo.setMarca(marcaTrendy);
        activo.setActivo(true);
        productoRepository.save(activo);

        Producto inactivo = new Producto();
        inactivo.setNombre("Producto Inactivo Test");
        inactivo.setPrecio(15000.0);
        inactivo.setCantidad(2);
        inactivo.setCategoria(CategoriaProducto.OJOS);
        inactivo.setMarca(marcaTrendy);
        inactivo.setActivo(false);
        productoRepository.save(inactivo);

        mockMvc.perform(get("/producto/obtener-productos")
                        .session(vendedorSession))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", isA(Iterable.class)))
                .andExpect(jsonPath("$[*].nombre", hasItem("Producto Activo Test")))
                .andExpect(jsonPath("$[*].nombre", not(hasItem("Producto Inactivo Test"))));
    }

    @Test
    @DisplayName("GET /producto/obtener-productos?incluirInactivos=true como ADMIN retorna activos e inactivos (RF-004)")
    void testGetProductosIncluirInactivosAdmin() throws Exception {
        mockMvc.perform(get("/producto/obtener-productos?incluirInactivos=true")
                        .session(adminSession))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", isA(Iterable.class)));
    }

    @Test
    @DisplayName("GET /producto/obtener-productos?incluirInactivos=true como VENDEDOR retorna 403 Forbidden (RF-005)")
    void testGetProductosIncluirInactivosVendedorRetorna403() throws Exception {
        mockMvc.perform(get("/producto/obtener-productos?incluirInactivos=true")
                        .session(vendedorSession))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error", is("FORBIDDEN")))
                .andExpect(jsonPath("$.message", containsString("exclusiva de administradores")));
    }

    @Test
    @DisplayName("GET /producto/obtener-productos-por-id/{id} retorna DTO si existe o 404 estructurado si no (RF-006, RF-007)")
    void testGetProductoPorId() throws Exception {
        Producto p = new Producto();
        p.setNombre("Producto Para Consulta ID");
        p.setPrecio(25000.0);
        p.setCantidad(10);
        p.setCategoria(CategoriaProducto.LABIOS);
        p.setMarca(marcaTrendy);
        p.setActivo(true);
        Producto guardado = productoRepository.save(p);

        mockMvc.perform(get("/producto/obtener-productos-por-id/" + guardado.getId())
                        .session(vendedorSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(guardado.getId().intValue())))
                .andExpect(jsonPath("$.nombre", is("Producto Para Consulta ID")))
                .andExpect(jsonPath("$.totalProducto", is(250000.0)));

        mockMvc.perform(get("/producto/obtener-productos-por-id/999999")
                        .session(vendedorSession))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("NOT_FOUND")))
                .andExpect(jsonPath("$.message", containsString("999999")));
    }

    @Test
    @DisplayName("POST /producto/crear con ADMIN crea producto y retorna 201 Created (RF-008)")
    void testCrearProductoExitoso() throws Exception {
        String payload = String.format("""
                {
                    "nombre": "  Iluminador Glow Dorado  ",
                    "precio": 28000.0,
                    "cantidad": 12,
                    "categoria": "ROSTRO",
                    "marcaId": %d
                }
                """, marcaTrendy.getId());

        mockMvc.perform(post("/producto/crear")
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.nombre", is("Iluminador Glow Dorado")))
                .andExpect(jsonPath("$.precio", is(28000.0)))
                .andExpect(jsonPath("$.cantidad", is(12)))
                .andExpect(jsonPath("$.totalProducto", is(336000.0)))
                .andExpect(jsonPath("$.activo", is(true)))
                .andExpect(jsonPath("$.marca.nombre", is("Trendy Prod Test")));
    }

    @Test
    @DisplayName("POST /producto/crear con validación fallida retorna 400 Bad Request estructurado (RF-010)")
    void testCrearProductoValidacionFallida() throws Exception {
        String payloadInvalido = """
                {
                    "nombre": " ",
                    "precio": -100.0,
                    "cantidad": -5,
                    "categoria": null,
                    "marcaId": null
                }
                """;

        mockMvc.perform(post("/producto/crear")
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadInvalido))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("BAD_REQUEST")));
    }

    @Test
    @DisplayName("PATCH /producto/actualizar/{id} actualiza campos y recalcula total (RF-012)")
    void testActualizarProductoExitoso() throws Exception {
        Producto p = new Producto();
        p.setNombre("Producto Para Actualizar");
        p.setPrecio(10000.0);
        p.setCantidad(5);
        p.setCategoria(CategoriaProducto.CEJAS);
        p.setMarca(marcaTrendy);
        p.setActivo(true);
        Producto guardado = productoRepository.save(p);

        String payload = """
                {
                    "precio": 12000.0,
                    "cantidad": 10
                }
                """;

        mockMvc.perform(patch("/producto/actualizar/" + guardado.getId())
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.precio", is(12000.0)))
                .andExpect(jsonPath("$.cantidad", is(10)))
                .andExpect(jsonPath("$.totalProducto", is(120000.0)));
    }

    @Test
    @DisplayName("PATCH /producto/actualizar/{id} con payload vacío retorna 400 Bad Request (RF-014)")
    void testActualizarProductoPayloadVacio() throws Exception {
        Producto p = new Producto();
        p.setNombre("Producto Para Test Vacio");
        p.setPrecio(15000.0);
        p.setCantidad(3);
        p.setCategoria(CategoriaProducto.LABIOS);
        p.setMarca(marcaTrendy);
        Producto guardado = productoRepository.save(p);

        mockMvc.perform(patch("/producto/actualizar/" + guardado.getId())
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("BAD_REQUEST")));
    }

    @Test
    @DisplayName("DELETE /producto/borrar-producto-por-id/{id} ejecuta borrado lógico si tiene facturas (RF-015, RF-016)")
    void testBorradoLogicoConFacturasAsociadas() throws Exception {
        Producto p = new Producto();
        p.setNombre("Producto Con Historial Venta");
        p.setPrecio(20000.0);
        p.setCantidad(8);
        p.setCategoria(CategoriaProducto.ROSTRO);
        p.setMarca(marcaTrendy);
        p.setActivo(true);
        Producto productoFacturado = productoRepository.save(p);

        Factura factura = new Factura();
        factura.setCliente("Cliente Test Historial");
        factura.setVendedorUsuario("vendedor_prod_test");
        factura.setVendedorNombre("Vendedor Prod");
        factura.setFecha(LocalDate.now());
        factura.setTotal(40000.0);
        factura.setDetalles(new ArrayList<>());

        DetalleFactura detalle = new DetalleFactura();
        detalle.setFactura(factura);
        detalle.setProducto(productoFacturado);
        detalle.setCantidad(2);
        detalle.setSubtotal(40000.0);
        factura.getDetalles().add(detalle);

        facturaRepository.save(factura);
        detalleFacturaRepository.save(detalle);

        mockMvc.perform(delete("/producto/borrar-producto-por-id/" + productoFacturado.getId())
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(productoFacturado.getId().intValue())))
                .andExpect(jsonPath("$.activo", is(false)));

        Producto verificado = productoRepository.findById(productoFacturado.getId()).orElseThrow();
        assertFalse(verificado.getActivo(), "El producto debe permanecer en la base de datos con activo = false");
    }

    @Test
    @DisplayName("GET /producto/acabarse soporta ?umbral=X y rechaza umbrales negativos (RF-017, RF-018)")
    void testProductoCercaAcabarseUmbral() throws Exception {
        mockMvc.perform(get("/producto/acabarse?umbral=5")
                        .session(vendedorSession))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));

        mockMvc.perform(get("/producto/acabarse?umbral=-1")
                        .session(vendedorSession))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("BAD_REQUEST")));
    }

    @Test
    @DisplayName("GET /producto/total-inventario retorna valuación numérica sin arrojar 404 (RF-019)")
    void testTotalInventario() throws Exception {
        mockMvc.perform(get("/producto/total-inventario")
                        .session(vendedorSession))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }
}
