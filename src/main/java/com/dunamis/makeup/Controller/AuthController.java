package com.dunamis.makeup.Controller;

import com.dunamis.makeup.Entity.Usuario;
import com.dunamis.makeup.Repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository usuarioRepository;

    public AuthController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/csrf")
    public CsrfResponse csrf() {
        return new CsrfResponse(true);
    }

    @GetMapping("/me")
    public UsuarioResponse currentUser(Authentication authentication) {
        Usuario usuario = usuarioRepository.findByNombreUsuarioIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return new UsuarioResponse(usuario.getNombreUsuario(), usuario.getNombreCompleto(), "ADMIN");
    }

    public record CsrfResponse(boolean ready) {
    }

    public record UsuarioResponse(String username, String fullName, String role) {
    }
}
