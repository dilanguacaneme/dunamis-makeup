package com.dunamis.makeup.Service;

import com.dunamis.makeup.Entity.Marca;
import com.dunamis.makeup.Repository.MarcaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class MarcaService {

    private final MarcaRepository marcaRepository;

    public MarcaService(MarcaRepository marcaRepository) {
        this.marcaRepository = marcaRepository;
    }

    public List<Marca> listarMarcasActivas() {
        return marcaRepository.findByActivaTrueOrderByNombreAsc();
    }

    public Marca crearMarca(Marca marca) {
        String nombre = normalizarNombre(marca.getNombre());
        if (marcaRepository.findByNombreIgnoreCase(nombre).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una marca con ese nombre");
        }
        return marcaRepository.save(new Marca(nombre));
    }

    public Marca actualizarMarca(Long id, Marca cambios) {
        Marca marca = marcaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Marca no encontrada"));

        if (cambios.getNombre() != null) {
            String nombre = normalizarNombre(cambios.getNombre());
            marcaRepository.findByNombreIgnoreCase(nombre)
                    .filter(otra -> !otra.getId().equals(id))
                    .ifPresent(otra -> {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una marca con ese nombre");
                    });
            marca.setNombre(nombre);
        }
        if (cambios.getActiva() != null) {
            marca.setActiva(cambios.getActiva());
        }
        return marcaRepository.save(marca);
    }

    private String normalizarNombre(String nombre) {
        if (nombre == null || nombre.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre de la marca es obligatorio");
        }
        return nombre.trim();
    }
}
