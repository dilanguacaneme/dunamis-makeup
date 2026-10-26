package com.dunamis.makeup.Controller;

import com.dunamis.makeup.Service.ProductoService;
import com.dunamis.makeup.dto.producto.ActualizarProductoRequest;
import com.dunamis.makeup.dto.producto.CrearProductoRequest;
import com.dunamis.makeup.dto.producto.ProductoResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/producto")
public class ProductoController {

    @Autowired
    private ProductoService productoService;

    // Create (RF-008, RF-010, RF-011)
    @PostMapping("/crear")
    public ResponseEntity<ProductoResponse> crearProducto(@Valid @RequestBody CrearProductoRequest request) {
        ProductoResponse productoCreado = productoService.crearProducto(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(productoCreado);
    }

    // Read all (RF-003, RF-004, RF-005)
    @GetMapping("/obtener-productos")
    public ResponseEntity<List<ProductoResponse>> buscarProducto(
            @RequestParam(name = "incluirInactivos", defaultValue = "false") boolean incluirInactivos,
            Authentication authentication
    ) {
        if (incluirInactivos && (authentication == null || authentication.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN")))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Acceso denegado: la consulta de productos inactivos es exclusiva de administradores");
        }

        List<ProductoResponse> lista = productoService.buscarProductos(incluirInactivos);
        return ResponseEntity.ok(lista);
    }

    // Read by id (RF-006, RF-007)
    @GetMapping("/obtener-productos-por-id/{id}")
    public ResponseEntity<ProductoResponse> buscarProductoPorId(@PathVariable Long id) {
        ProductoResponse producto = productoService.buscarProductoPorId(id);
        return ResponseEntity.ok(producto);
    }

    // Delete / Soft-delete (RF-015, RF-016)
    @DeleteMapping("/borrar-producto-por-id/{id}")
    public ResponseEntity<ProductoResponse> borrarProductoPorId(@PathVariable Long id) {
        ProductoResponse productoAEliminar = productoService.borrarProductoPorId(id);
        return ResponseEntity.ok(productoAEliminar);
    }

    // Update (RF-012, RF-013, RF-014)
    @PatchMapping("/actualizar/{id}")
    public ResponseEntity<ProductoResponse> actualizarProducto(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarProductoRequest request
    ) {
        ProductoResponse proActualizado = productoService.actualizarProducto(id, request);
        return ResponseEntity.ok(proActualizado);
    }

    // Total inventario (RF-019)
    @GetMapping("/total-inventario")
    public ResponseEntity<Double> totalInventario() {
        Double inventarioTotal = productoService.totalInventario();
        return ResponseEntity.ok(inventarioTotal);
    }

    // Alerta de stock / Acabarse (RF-017, RF-018)
    @GetMapping("/acabarse")
    public ResponseEntity<List<ProductoResponse>> productoCercaAcabarse(
            @RequestParam(name = "umbral", required = false) Integer umbral
    ) {
        if (umbral != null && umbral < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El umbral de existencias debe ser un número entero mayor o igual a cero");
        }

        List<ProductoResponse> lstProntoAAcabar = productoService.productoCercaAcabarse(umbral);
        return ResponseEntity.ok(lstProntoAAcabar);
    }
}
