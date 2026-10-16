package com.dunamis.makeup.Service;

import com.dunamis.makeup.Entity.Usuario;
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
        Usuario usuario = usuarioRepository.findByNombreUsuarioIgnoreCase(nombreUsuario)
                .orElseThrow(() -> new UsernameNotFoundException("Credenciales inválidas"));

        return User.withUsername(usuario.getNombreUsuario())
                .password(usuario.getPasswordHash())
                .authorities("ROLE_ADMIN")
                .disabled(!usuario.isActivo())
                .build();
    }
}
