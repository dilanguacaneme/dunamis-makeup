package com.dunamis.makeup.service;

import com.dunamis.makeup.Entity.RolUsuario;
import com.dunamis.makeup.Entity.Usuario;
import com.dunamis.makeup.Repository.UsuarioRepository;
import com.dunamis.makeup.Service.UsuarioDetailsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas Unitarias - UsuarioDetailsService (RF-006, RF-012)")
class UsuarioDetailsServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    private UsuarioDetailsService usuarioDetailsService;

    @BeforeEach
    void setUp() {
        usuarioDetailsService = new UsuarioDetailsService(usuarioRepository);
    }

    @Test
    @DisplayName("Debe cargar usuario activo con rol ADMIN correctamente")
    void testCargarUsuarioAdmin() {
        Usuario usuario = new Usuario("maryuri", "Maryuri Admin", "$2a$12$hashDePrueba1234567890");
        usuario.setRol(RolUsuario.ADMIN);
        usuario.setActivo(true);

        when(usuarioRepository.findByNombreUsuarioIgnoreCase("maryuri")).thenReturn(Optional.of(usuario));

        UserDetails userDetails = usuarioDetailsService.loadUserByUsername("maryuri");

        assertNotNull(userDetails);
        assertEquals("maryuri", userDetails.getUsername());
        assertTrue(userDetails.isEnabled(), "El usuario activo debe estar habilitado");
        assertTrue(userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
    }

    @Test
    @DisplayName("RF-012: Debe asignar defensivamente ROLE_VENDEDOR si el rol en BD es null (Principio de Menor Privilegio)")
    void testRolNuloAsignaVendedorDefensivamente() {
        Usuario legacyUser = new Usuario("antiguo", "Usuario Legacy", "$2a$12$hashDePrueba1234567890");
        legacyUser.setRol(null); // Caso brownfield: usuario sin rol asignado
        legacyUser.setActivo(true);

        when(usuarioRepository.findByNombreUsuarioIgnoreCase("antiguo")).thenReturn(Optional.of(legacyUser));

        UserDetails userDetails = usuarioDetailsService.loadUserByUsername("antiguo");

        assertNotNull(userDetails);
        // Debe ser VENDEDOR para no otorgar permisos administrativos por omisión
        assertTrue(userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_VENDEDOR")),
                "Un rol nulo DEBE mapearse a ROLE_VENDEDOR por principio de menor privilegio");
        assertFalse(userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")),
                "Un rol nulo NUNCA debe elevarse a ROLE_ADMIN");
    }

    @Test
    @DisplayName("RF-006: Usuario inactivo debe tener isEnabled() = false")
    void testUsuarioInactivoDeshabilitado() {
        Usuario inactivo = new Usuario("suspendido", "Usuario Inactivo", "$2a$12$hashDePrueba1234567890");
        inactivo.setRol(RolUsuario.VENDEDOR);
        inactivo.setActivo(false);

        when(usuarioRepository.findByNombreUsuarioIgnoreCase("suspendido")).thenReturn(Optional.of(inactivo));

        UserDetails userDetails = usuarioDetailsService.loadUserByUsername("suspendido");

        assertNotNull(userDetails);
        assertFalse(userDetails.isEnabled(), "Un usuario con activo=false debe retornar isEnabled()=false");
    }

    @Test
    @DisplayName("Debe normalizar el username aplicando trim() antes de consultar el repositorio")
    void testNormalizacionUsername() {
        Usuario usuario = new Usuario("caterin", "Caterin Admin", "$2a$12$hashDePrueba1234567890");
        usuario.setRol(RolUsuario.ADMIN);
        usuario.setActivo(true);

        when(usuarioRepository.findByNombreUsuarioIgnoreCase("caterin")).thenReturn(Optional.of(usuario));

        UserDetails userDetails = usuarioDetailsService.loadUserByUsername("  caterin  ");

        assertNotNull(userDetails);
        verify(usuarioRepository).findByNombreUsuarioIgnoreCase("caterin");
    }

    @Test
    @DisplayName("Debe lanzar UsernameNotFoundException si el usuario no existe")
    void testUsuarioNoEncontrado() {
        when(usuarioRepository.findByNombreUsuarioIgnoreCase(anyString())).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () ->
                usuarioDetailsService.loadUserByUsername("fantasma"));
    }
}
