package com.dunamis.makeup.Service;

import com.dunamis.makeup.Entity.Usuario;
import com.dunamis.makeup.Entity.RolUsuario;
import com.dunamis.makeup.Repository.UsuarioRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UsuarioDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String nombreUsuario) throws UsernameNotFoundException {
        String usernameNormalizado = nombreUsuario == null ? "" : nombreUsuario.trim();

        Usuario usuario = usuarioRepository.findByNombreUsuarioIgnoreCase(usernameNormalizado)
                .orElseThrow(() -> new UsernameNotFoundException("Credenciales inválidas"));

        // Principio 12 y Menor Privilegio (RF-012): rol null se mapea defensivamente a VENDEDOR
        RolUsuario rol = usuario.getRol() == null ? RolUsuario.VENDEDOR : usuario.getRol();

        return User.withUsername(usuario.getNombreUsuario())
                .password(usuario.getPasswordHash())
                .authorities("ROLE_" + rol.name())
                .disabled(!usuario.isActivo())
                .build();
    }
}
