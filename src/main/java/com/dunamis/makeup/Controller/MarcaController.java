package com.dunamis.makeup.Controller;

import com.dunamis.makeup.Service.MarcaService;
import com.dunamis.makeup.dto.common.ErrorResponse;
import com.dunamis.makeup.dto.marca.ActualizarMarcaRequest;
import com.dunamis.makeup.dto.marca.CrearMarcaRequest;
import com.dunamis.makeup.dto.marca.MarcaResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/marcas")
public class MarcaController {

    private final MarcaService marcaService;

    public MarcaController(MarcaService marcaService) {
        this.marcaService = marcaService;
    }

    @GetMapping
    public ResponseEntity<?> listar(
            @RequestParam(defaultValue = "false") boolean incluirInactivas,
            Authentication authentication
    ) {
        if (incluirInactivas) {
            boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ErrorResponse.of("FORBIDDEN", "Acceso denegado: la consulta de marcas inactivas es exclusiva de administradores"));
            }
        }
        return ResponseEntity.ok(marcaService.listarMarcas(incluirInactivas));
    }

    @PostMapping
    public ResponseEntity<MarcaResponse> crear(@Valid @RequestBody CrearMarcaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(marcaService.crearMarca(request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<MarcaResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarMarcaRequest request
    ) {
        return ResponseEntity.ok(marcaService.actualizarMarca(id, request));
    }
}
