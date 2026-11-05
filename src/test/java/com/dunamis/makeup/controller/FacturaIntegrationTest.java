package com.dunamis.makeup.controller;

import com.dunamis.makeup.entity.*;
import com.dunamis.makeup.repository.AbonoFacturaRepository;
import com.dunamis.makeup.repository.CategoriaRepository;
import com.dunamis.makeup.repository.DetalleFacturaRepository;
import com.dunamis.makeup.repository.FacturaRepository;
import com.dunamis.makeup.repository.MarcaRepository;
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
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Pruebas de Integración - FacturaController Endpoints (RF-003 a RF-019)")
class FacturaIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FacturaRepository facturaRepository;

    @Autowired
    private DetalleFacturaRepository detalleFacturaRepository;

    @Autowired
    private AbonoFacturaRepository abonoFacturaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private MarcaRepository marcaRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private MockHttpSession adminSession;
    private Cookie csrfCookie;
    private Producto productoBase;
    private Producto productoLabial;

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
        if (usuarioRepository.findByNombreUsuarioIgnoreCase("admin_factura_test").isEmpty()) {
            Usuario admin = new Usuario("admin_factura_test", "Admin Factura", passwordEncoder.encode("AdminPass1234*"));
            admin.setRol(RolUsuario.ADMIN);
            usuarioRepository.save(admin);
        }

        csrfCookie = obtainCsrfCookie();
        adminSession = login("admin_factura_test", "AdminPass1234*");

        Marca marca = marcaRepository.findByNombreIgnoreCase("Trendy")
                .orElseGet(() -> marcaRepository.save(new Marca("Trendy")));

        Categoria rostro = categoriaRepository.findByNombreIgnoreCase("Rostro")
                .orElseGet(() -> categoriaRepository.save(new Categoria("Rostro")));
        Categoria labios = categoriaRepository.findByNombreIgnoreCase("Labios")
                .orElseGet(() -> categoriaRepository.save(new Categoria("Labios")));

        productoBase = new Producto();
        productoBase.setNombre("Base Cushion");
        productoBase.setPrecio(45000.0);
        productoBase.setCantidad(20);
        productoBase.setTotalProducto(900000.0);
        productoBase.setCategoria(rostro);
        productoBase.setMarca(marca);
        productoBase.setActivo(true);
        productoBase = productoRepository.save(productoBase);

        productoLabial = new Producto();
        productoLabial.setNombre("Labial Velvet");
        productoLabial.setPrecio(15000.0);
        productoLabial.setCantidad(10);
        productoLabial.setTotalProducto(150000.0);
        productoLabial.setCategoria(labios);
        productoLabial.setMarca(marca);
        productoLabial.setActivo(true);
        productoLabial = productoRepository.save(productoLabial);
    }

    @Test
    @DisplayName("POST /factura/crear exitoso con descuento atómico de stock (RF-003)")
    void testCrearFacturaExitoso() throws Exception {
        String payload = """
                {
                    "cliente": "Marcela Morales",
                    "telefonoCliente": "3009988776",
                    "detalles": [
                        { "productoId": %d, "cantidad": 2 },
                        { "productoId": %d, "cantidad": 1 }
                    ],
                    "estadoPago": "PAGADA",
                    "medioPagoInicial": "TRANSFERENCIA",
                    "notasPago": "Bancolombia"
                }
                """.formatted(productoBase.getId(), productoLabial.getId());

        mockMvc.perform(post("/factura/crear")
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.cliente", is("Marcela Morales")))
                .andExpect(jsonPath("$.total", is(105000.0))) // (45000 * 2) + (15000 * 1) = 105000
                .andExpect(jsonPath("$.estadoPago", is("PAGADA")))
                .andExpect(jsonPath("$.saldoPendiente", is(0.0)))
                .andExpect(jsonPath("$.anulada", is(false)))
                .andExpect(jsonPath("$.detalles", hasSize(2)));

        // Verificar que el inventario se descontó en la BD
        Producto baseActualizada = productoRepository.findById(productoBase.getId()).orElseThrow();
        assertEquals(18, baseActualizada.getCantidad()); // 20 - 2 = 18

        Producto labialActualizado = productoRepository.findById(productoLabial.getId()).orElseThrow();
        assertEquals(9, labialActualizado.getCantidad()); // 10 - 1 = 9
    }

    @Test
    @DisplayName("POST /factura/crear con stock insuficiente debe retornar 409 o 400 estructurado (RF-006)")
    void testCrearFacturaStockInsuficiente() throws Exception {
        String payload = """
                {
                    "cliente": "Cliente Exceso",
                    "detalles": [
                        { "productoId": %d, "cantidad": 999 }
                    ],
                    "estadoPago": "PAGADA"
                }
                """.formatted(productoLabial.getId());

        mockMvc.perform(post("/factura/crear")
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", is("CONFLICT")));

        // Verificar que las existencias permanecieron intactas
        Producto labial = productoRepository.findById(productoLabial.getId()).orElseThrow();
        assertEquals(10, labial.getCantidad());
    }

    @Test
    @DisplayName("GET /factura/obtener-factura-por-id/{id} inexistente retorna 404 estructurado (RF-012)")
    void testBuscarFacturaInexistenteRetorna404() throws Exception {
        mockMvc.perform(get("/factura/obtener-factura-por-id/999999")
                        .session(adminSession))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("NOT_FOUND")));
    }

    @Test
    @DisplayName("POST /factura/{id}/abonos registra abono y actualiza saldos (RF-014)")
    void testRegistrarAbonoIntegration() throws Exception {
        Factura f = new Factura();
        f.setCliente("Cliente Abono Test");
        f.setVendedorUsuario("admin_factura_test");
        f.setVendedorNombre("Admin Factura");
        f.setFecha(LocalDateTime.now());
        f.setTotal(80000.0);
        f.setEstadoPago(EstadoPagoFactura.ABONO_PARCIAL);
        f.setValorAbonado(30000.0);
        f.setSaldoPendiente(50000.0);
        f.setAnulada(false);
        f.setDetalles(new ArrayList<>());
        Factura guardada = facturaRepository.save(f);

        String payload = """
                {
                    "monto": 20000.0,
                    "medioPago": "NEQUI",
                    "notas": "Pago por app"
                }
                """;

        mockMvc.perform(post("/factura/" + guardada.getId() + "/abonos")
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.monto", is(20000.0)))
                .andExpect(jsonPath("$.medioPago", is("NEQUI")));

        Factura postAbono = facturaRepository.findById(guardada.getId()).orElseThrow();
        assertEquals(50000.0, postAbono.getValorAbonado());
        assertEquals(30000.0, postAbono.getSaldoPendiente());
        assertEquals(EstadoPagoFactura.ABONO_PARCIAL, postAbono.getEstadoPago());
    }

    @Test
    @DisplayName("GET /factura/{id}/abonos retorna historial de pagos (RF-016)")
    void testListarAbonosIntegration() throws Exception {
        Factura f = new Factura();
        f.setCliente("Cliente Historial Abonos");
        f.setVendedorUsuario("admin_factura_test");
        f.setVendedorNombre("Admin Factura");
        f.setFecha(LocalDateTime.now());
        f.setTotal(50000.0);
        f.setEstadoPago(EstadoPagoFactura.PENDIENTE);
        f.setValorAbonado(0.0);
        f.setSaldoPendiente(50000.0);
        f.setAnulada(false);
        Factura guardada = facturaRepository.save(f);

        AbonoFactura a1 = new AbonoFactura(guardada, 20000.0, MedioPago.EFECTIVO, "Caja", "admin_factura_test");
        abonoFacturaRepository.save(a1);

        mockMvc.perform(get("/factura/" + guardada.getId() + "/abonos")
                        .session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].monto", is(20000.0)))
                .andExpect(jsonPath("$[0].medioPago", is("EFECTIVO")));
    }

    @Test
    @DisplayName("POST /factura/{id}/anular restituye existencias y marca anulada (RF-017, RF-019)")
    void testAnularFacturaIntegration() throws Exception {
        // Crear factura que descuenta 5 labiales
        Producto labialParaAnular = new Producto();
        labialParaAnular.setNombre("Labial Anulable");
        labialParaAnular.setPrecio(10000.0);
        labialParaAnular.setCantidad(10);
        labialParaAnular.setTotalProducto(100000.0);
        Categoria labios = categoriaRepository.findByNombreIgnoreCase("Labios")
                .orElseGet(() -> categoriaRepository.save(new Categoria("Labios")));
        labialParaAnular.setCategoria(labios);
        labialParaAnular.setActivo(true);
        labialParaAnular = productoRepository.save(labialParaAnular);

        Factura f = new Factura();
        f.setCliente("Cliente Devolucion");
        f.setVendedorUsuario("admin_factura_test");
        f.setVendedorNombre("Admin Factura");
        f.setFecha(LocalDateTime.now());
        f.setTotal(30000.0);
        f.setEstadoPago(EstadoPagoFactura.PAGADA);
        f.setValorAbonado(30000.0);
        f.setSaldoPendiente(0.0);
        f.setAnulada(false);

        DetalleFactura d = new DetalleFactura();
        d.setFactura(f);
        d.setProducto(labialParaAnular);
        d.setCantidad(3); // 3 unidades vendidas
        d.setPrecioUnitario(10000.0);
        d.setSubtotal(30000.0);
        f.setDetalles(new ArrayList<>(List.of(d)));

        // Reducir stock simulando la venta previa
        labialParaAnular.setCantidad(7);
        labialParaAnular.setTotalProducto(70000.0);
        productoRepository.save(labialParaAnular);

        Factura guardada = facturaRepository.save(f);

        // Anular la factura
        String payloadAnular = """
                {
                    "motivo": "Devolución por cambio de tono"
                }
                """;

        mockMvc.perform(post("/factura/" + guardada.getId() + "/anular")
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadAnular))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(guardada.getId().intValue())))
                .andExpect(jsonPath("$.anulada", is(true)))
                .andExpect(jsonPath("$.motivoAnulacion", is("Devolución por cambio de tono")));

        // Verificar que el stock se restituyó: 7 + 3 = 10 unidades!
        Producto labialRestituido = productoRepository.findById(labialParaAnular.getId()).orElseThrow();
        assertEquals(10, labialRestituido.getCantidad());
        assertEquals(100000.0, labialRestituido.getTotalProducto());

        // Reintento de anular debe fallar con 409 Conflict
        mockMvc.perform(post("/factura/" + guardada.getId() + "/anular")
                        .session(adminSession)
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadAnular))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", is("CONFLICT")));
    }
}
