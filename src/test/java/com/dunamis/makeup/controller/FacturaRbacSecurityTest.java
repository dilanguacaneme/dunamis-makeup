package com.dunamis.makeup.controller;

import com.dunamis.makeup.entity.*;
import com.dunamis.makeup.repository.FacturaRepository;
import com.dunamis.makeup.repository.ProductoRepository;
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

import java.time.LocalDateTime;
import java.util.ArrayList;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Pruebas de Seguridad y RBAC - Facturación (RF-008, RF-009, RF-011, RF-013, RF-018)")
class FacturaRbacSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private FacturaRepository facturaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private MockHttpSession adminSession;
    private MockHttpSession vendedorSession1;
    private MockHttpSession vendedorSession2;
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
        if (usuarioRepository.findByNombreUsuarioIgnoreCase("admin_rbac_factura").isEmpty()) {
            Usuario admin = new Usuario("admin_rbac_factura", "Admin RBAC", passwordEncoder.encode("AdminPass1234*"));
            admin.setRol(RolUsuario.ADMIN);
            usuarioRepository.save(admin);
        }

        if (usuarioRepository.findByNombreUsuarioIgnoreCase("vendedor_rbac_factura1").isEmpty()) {
            Usuario vend1 = new Usuario("vendedor_rbac_factura1", "Vendedor Uno", passwordEncoder.encode("VendPass1234*"));
            vend1.setRol(RolUsuario.VENDEDOR);
            usuarioRepository.save(vend1);
        }

        if (usuarioRepository.findByNombreUsuarioIgnoreCase("vendedor_rbac_factura2").isEmpty()) {
            Usuario vend2 = new Usuario("vendedor_rbac_factura2", "Vendedor Dos", passwordEncoder.encode("VendPass1234*"));
            vend2.setRol(RolUsuario.VENDEDOR);
            usuarioRepository.save(vend2);
        }

        csrfCookie = obtainCsrfCookie();
        adminSession = login("admin_rbac_factura", "AdminPass1234*");
        vendedorSession1 = login("vendedor_rbac_factura1", "VendPass1234*");
        vendedorSession2 = login("vendedor_rbac_factura2", "VendPass1234*");
    }

    @Test
    @DisplayName("Petición sin autenticar a /factura/crear retorna 401 Unauthorized estructurado")
    void testCrearFacturaSinAutenticacionRetorna401() throws Exception {
        String payload = """
                {
                    "cliente": "Cliente Anónimo",
                    "detalles": [
                        { "productoId": 1, "cantidad": 1 }
                    ]
                }
                """;

        mockMvc.perform(post("/factura/crear")
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("UNAUTHORIZED")));
    }

    @Test
    @DisplayName("POST /factura/{id}/anular como VENDEDOR debe retornar 403 Forbidden (RF-018)")
    void testVendedorAnularFacturaRetorna403() throws Exception {
        mockMvc.perform(post("/factura/1/anular")
                        .session(vendedorSession1)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error", is("FORBIDDEN")));
    }

    @Test
    @DisplayName("GET /factura/obtener-facturas como VENDEDOR solo lista facturas de su autoría (RF-009)")
    void testSegregacionListadoVendedor() throws Exception {
        Factura f1 = new Factura();
        f1.setCliente("Cliente Vendedor 1");
        f1.setVendedorUsuario("vendedor_rbac_factura1");
        f1.setVendedorNombre("Vendedor Uno");
        f1.setFecha(LocalDateTime.now());
        f1.setTotal(50000.0);
        f1.setEstadoPago(EstadoPagoFactura.PAGADA);
        f1.setValorAbonado(50000.0);
        f1.setSaldoPendiente(0.0);
        f1.setAnulada(false);
        f1.setDetalles(new ArrayList<>());
        facturaRepository.save(f1);

        Factura f2 = new Factura();
        f2.setCliente("Cliente Vendedor 2");
        f2.setVendedorUsuario("vendedor_rbac_factura2");
        f2.setVendedorNombre("Vendedor Dos");
        f2.setFecha(LocalDateTime.now());
        f2.setTotal(60000.0);
        f2.setEstadoPago(EstadoPagoFactura.PAGADA);
        f2.setValorAbonado(60000.0);
        f2.setSaldoPendiente(0.0);
        f2.setAnulada(false);
        f2.setDetalles(new ArrayList<>());
        facturaRepository.save(f2);

        // Vendedor 1 consulta
        mockMvc.perform(get("/factura/obtener-facturas")
                        .session(vendedorSession1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].vendedorUsuario", everyItem(is("vendedor_rbac_factura1"))))
                .andExpect(jsonPath("$[*].cliente", hasItem("Cliente Vendedor 1")))
                .andExpect(jsonPath("$[*].cliente", not(hasItem("Cliente Vendedor 2"))));
    }

    @Test
    @DisplayName("GET /factura/obtener-factura-por-id/{id} de factura ajena como VENDEDOR retorna 404 o 403 (RF-013)")
    void testVendedorConsultarFacturaAjenaRetornaError() throws Exception {
        Factura f2 = new Factura();
        f2.setCliente("Cliente Exclusivo 2");
        f2.setVendedorUsuario("vendedor_rbac_factura2");
        f2.setVendedorNombre("Vendedor Dos");
        f2.setFecha(LocalDateTime.now());
        f2.setTotal(75000.0);
        f2.setEstadoPago(EstadoPagoFactura.PAGADA);
        f2.setValorAbonado(75000.0);
        f2.setSaldoPendiente(0.0);
        f2.setAnulada(false);
        f2.setDetalles(new ArrayList<>());
        Factura guardada = facturaRepository.save(f2);

        // Vendedor 1 intenta ver la factura del vendedor 2
        mockMvc.perform(get("/factura/obtener-factura-por-id/" + guardada.getId())
                        .session(vendedorSession1))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("NOT_FOUND")));
    }
}
