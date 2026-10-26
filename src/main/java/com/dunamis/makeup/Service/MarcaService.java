package com.dunamis.makeup.Service;

import com.dunamis.makeup.Entity.Marca;
import com.dunamis.makeup.Repository.MarcaRepository;
import com.dunamis.makeup.dto.marca.ActualizarMarcaRequest;
import com.dunamis.makeup.dto.marca.CrearMarcaRequest;
import com.dunamis.makeup.dto.marca.MarcaResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class MarcaService {

    private final MarcaRepository marcaRepository;

    public MarcaService(MarcaRepository marcaRepository) {
        this.marcaRepository = marcaRepository;
    }

    @Transactional(readOnly = true)
    public List<MarcaResponse> listarMarcas(boolean incluirInactivas) {
        List<Marca> marcas = incluirInactivas
                ? marcaRepository.findAllByOrderByNombreAsc()
                : marcaRepository.findByActivaTrueOrderByNombreAsc();
        return marcas.stream().map(MarcaResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<Marca> listarMarcasActivas() {
        return marcaRepository.findByActivaTrueOrderByNombreAsc();
    }

    @Transactional
    public MarcaResponse crearMarca(CrearMarcaRequest request) {
        String nombreNormalizado = normalizarNombre(request.nombre());
        if (marcaRepository.findByNombreIgnoreCase(nombreNormalizado).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una marca con ese nombre");
        }
        Marca marca = new Marca(nombreNormalizado);
        return MarcaResponse.fromEntity(marcaRepository.save(marca));
    }

    @Transactional
    public Marca crearMarca(Marca marca) {
        String nombre = normalizarNombre(marca.getNombre());
        if (marcaRepository.findByNombreIgnoreCase(nombre).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una marca con ese nombre");
        }
        return marcaRepository.save(new Marca(nombre));
    }

    @Transactional
    public MarcaResponse actualizarMarca(Long id, ActualizarMarcaRequest request) {
        Marca marca = marcaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Marca no encontrada"));

        if (request.nombre() != null && !request.nombre().isBlank()) {
            String nuevoNombre = normalizarNombre(request.nombre());
            if (!nuevoNombre.equalsIgnoreCase(marca.getNombre())) {
                marcaRepository.findByNombreIgnoreCase(nuevoNombre)
                        .filter(otra -> !otra.getId().equals(id))
                        .ifPresent(otra -> {
                            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una marca con ese nombre");
                        });
                marca.setNombre(nuevoNombre);
            }
        }

        if (request.activa() != null) {
            marca.setActiva(request.activa());
        }

        return MarcaResponse.fromEntity(marcaRepository.save(marca));
    }

    @Transactional
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

    public String normalizarNombre(String nombre) {
        if (nombre == null || nombre.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre de la marca es obligatorio");
        }
        return nombre.trim().replaceAll("\\s+", " ");
    }
}
