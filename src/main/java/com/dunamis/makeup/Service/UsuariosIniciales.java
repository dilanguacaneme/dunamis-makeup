package com.dunamis.makeup.Service;

import com.dunamis.makeup.Entity.Usuario;
import com.dunamis.makeup.Entity.RolUsuario;
import com.dunamis.makeup.Repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class UsuariosIniciales implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final String passwordMaryuri;
    private final String passwordCaterin;

    public UsuariosIniciales(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.maryuri-password:}") String passwordMaryuri,
            @Value("${app.admin.caterin-password:}") String passwordCaterin) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordMaryuri = passwordMaryuri;
        this.passwordCaterin = passwordCaterin;
    }

    @Override
    public void run(ApplicationArguments args) {
        // Complete the new role column for users created before role support existed.
        usuarioRepository.findAll().stream()
                .filter(usuario -> usuario.getRol() == null)
                .forEach(usuario -> {
                    usuario.setRol(RolUsuario.ADMIN);
                    usuarioRepository.save(usuario);
                });

        List<CuentaAdmin> cuentas = List.of(
                new CuentaAdmin("maryuri", "Maryuri Andrea Salazar", passwordMaryuri),
                new CuentaAdmin("caterin", "Caterin Rojas Hererra", passwordCaterin)
        );

        for (CuentaAdmin cuenta : cuentas) {
            if (usuarioRepository.findByNombreUsuarioIgnoreCase(cuenta.nombreUsuario()).isPresent()) {
                continue;
            }
            if (cuenta.password().isBlank()) {
                throw new IllegalStateException("Configura la variable de entorno para crear la cuenta inicial "
                        + cuenta.nombreUsuario() + ".");
            }
            if (cuenta.password().length() < 12) {
                throw new IllegalStateException("La contraseña inicial de " + cuenta.nombreUsuario() + " debe tener al menos 12 caracteres.");
            }

            usuarioRepository.save(new Usuario(
                    cuenta.nombreUsuario(),
                    cuenta.nombreCompleto(),
                    passwordEncoder.encode(cuenta.password())
            ));
        }
    }

    private record CuentaAdmin(String nombreUsuario, String nombreCompleto, String password) {
    }
}
