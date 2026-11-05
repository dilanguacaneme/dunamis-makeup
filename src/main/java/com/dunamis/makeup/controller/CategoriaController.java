package com.dunamis.makeup.controller;

import com.dunamis.makeup.dto.categoria.ActualizarCategoriaRequest;
import com.dunamis.makeup.dto.categoria.CategoriaResponse;
import com.dunamis.makeup.dto.categoria.CrearCategoriaRequest;
import com.dunamis.makeup.service.CategoriaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST para el catálogo y gestión de categorías (Spec 008).
 */
@RestController
@RequestMapping("/categorias")
public class CategoriaController {

    private final CategoriaService categoriaService;

    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @GetMapping
    public ResponseEntity<List<CategoriaResponse>> listar(
            @RequestParam(defaultValue = "false") boolean incluirInactivas,
            Authentication authentication
    ) {
        if (incluirInactivas) {
            boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!isAdmin) {
                throw new AccessDeniedException("Acceso denegado: la consulta de categorías inactivas es exclusiva de administradores");
            }
        }
        return ResponseEntity.ok(categoriaService.listarCategorias(incluirInactivas));
    }

    @PostMapping
    public ResponseEntity<CategoriaResponse> crear(@Valid @RequestBody CrearCategoriaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoriaService.crearCategoria(request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<CategoriaResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarCategoriaRequest request
    ) {
        return ResponseEntity.ok(categoriaService.actualizarCategoria(id, request));
    }
}
