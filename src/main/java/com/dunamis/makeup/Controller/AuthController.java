package com.dunamis.makeup.Controller;

import com.dunamis.makeup.Entity.Usuario;
import com.dunamis.makeup.Repository.UsuarioRepository;
import com.dunamis.makeup.dto.auth.CsrfResponse;
import com.dunamis.makeup.dto.auth.LoginRequest;
import com.dunamis.makeup.dto.auth.UsuarioResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    public AuthController(UsuarioRepository usuarioRepository, AuthenticationManager authenticationManager) {
        this.usuarioRepository = usuarioRepository;
        this.authenticationManager = authenticationManager;
    }

    @GetMapping("/csrf")
    public CsrfResponse csrf() {
        return new CsrfResponse(true);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Boolean>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        String normalizedUsername = request.username().trim().toLowerCase();

        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedUsername, request.password())
        );

        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        HttpSession newSession = httpRequest.getSession(true);

        Cookie jsessionCookie = new Cookie("JSESSIONID", newSession.getId());
        jsessionCookie.setPath("/");
        jsessionCookie.setHttpOnly(true);
        httpResponse.addCookie(jsessionCookie);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        return ResponseEntity.ok(Map.of("authenticated", true));
    }

    @GetMapping("/me")
    public UsuarioResponse currentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        Usuario usuario = usuarioRepository.findByNombreUsuarioIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        String role = usuario.getRol() == null ? "VENDEDOR" : usuario.getRol().name();
        return new UsuarioResponse(usuario.getNombreUsuario(), usuario.getNombreCompleto(), role);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Boolean>> logout(HttpServletRequest request, HttpServletResponse response) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();

        Cookie jsessionCookie = new Cookie("JSESSIONID", "");
        jsessionCookie.setPath("/");
        jsessionCookie.setMaxAge(0);
        jsessionCookie.setHttpOnly(true);
        response.addCookie(jsessionCookie);

        return ResponseEntity.ok(Map.of("authenticated", false));
    }
}
