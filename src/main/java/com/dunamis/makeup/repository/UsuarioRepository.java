package com.dunamis.makeup.repository;

import com.dunamis.makeup.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByNombreUsuarioIgnoreCase(String nombreUsuario);
}
