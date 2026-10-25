package com.dunamis.makeup.service;

import com.dunamis.makeup.Entity.RolUsuario;
import com.dunamis.makeup.Entity.Usuario;
import com.dunamis.makeup.Repository.UsuarioRepository;
import com.dunamis.makeup.Service.UsuariosIniciales;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas Unitarias - Sembrado Inicial Idempotente (RF-016, RF-017)")
class UsuariosInicialesTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("RF-016: Si BD está vacía y falta la contraseña, lanza IllegalStateException")
    void testFallaSiNoHayVariablesEnPrimerArranque() {
        when(usuarioRepository.findAll()).thenReturn(Collections.emptyList());
        when(usuarioRepository.findByNombreUsuarioIgnoreCase("maryuri")).thenReturn(Optional.empty());

        UsuariosIniciales seeder = new UsuariosIniciales(
                usuarioRepository,
                passwordEncoder,
                "", // Contraseña vacía
                ""
        );

        assertThrows(IllegalStateException.class, () -> seeder.run(new DefaultApplicationArguments()));
    }

    @Test
    @DisplayName("RF-017: Si las cuentas ya existen, arranca normalmente sin requerir contraseñas")
    void testArranqueIdempotenteSiCuentasYaExisten() {
        when(usuarioRepository.findAll()).thenReturn(Collections.emptyList());
        when(usuarioRepository.findByNombreUsuarioIgnoreCase("maryuri"))
                .thenReturn(Optional.of(new Usuario("maryuri", "Maryuri", "hash")));
        when(usuarioRepository.findByNombreUsuarioIgnoreCase("caterin"))
                .thenReturn(Optional.of(new Usuario("caterin", "Caterin", "hash")));

        UsuariosIniciales seeder = new UsuariosIniciales(
                usuarioRepository,
                passwordEncoder,
                "", // Sin variables en reinicio
                ""
        );

        assertDoesNotThrow(() -> seeder.run(new DefaultApplicationArguments()));
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }
}
