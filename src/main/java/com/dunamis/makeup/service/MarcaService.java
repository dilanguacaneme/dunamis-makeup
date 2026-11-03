package com.dunamis.makeup.service;

import com.dunamis.makeup.entity.Marca;
import com.dunamis.makeup.exception.ConflictoEstadoException;
import com.dunamis.makeup.exception.RecursoNoEncontradoException;
import com.dunamis.makeup.repository.MarcaRepository;
import com.dunamis.makeup.dto.marca.ActualizarMarcaRequest;
import com.dunamis.makeup.dto.marca.CrearMarcaRequest;
import com.dunamis.makeup.dto.marca.MarcaResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
            throw new ConflictoEstadoException("Ya existe una marca con ese nombre");
        }
        Marca marca = new Marca(nombreNormalizado);
        return MarcaResponse.fromEntity(marcaRepository.save(marca));
    }

    @Transactional
    public Marca crearMarca(Marca marca) {
        String nombre = normalizarNombre(marca.getNombre());
        if (marcaRepository.findByNombreIgnoreCase(nombre).isPresent()) {
            throw new ConflictoEstadoException("Ya existe una marca con ese nombre");
        }
        return marcaRepository.save(new Marca(nombre));
    }

    @Transactional
    public MarcaResponse actualizarMarca(Long id, ActualizarMarcaRequest request) {
        Marca marca = marcaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Marca", id));

        if (request.nombre() != null && !request.nombre().isBlank()) {
            String nuevoNombre = normalizarNombre(request.nombre());
            if (!nuevoNombre.equalsIgnoreCase(marca.getNombre())) {
                marcaRepository.findByNombreIgnoreCase(nuevoNombre)
                        .filter(otra -> !otra.getId().equals(id))
                        .ifPresent(otra -> {
                            throw new ConflictoEstadoException("Ya existe una marca con ese nombre");
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
    public Marca actualizarMarca(Long id, Marca datosNuevos) {
        Marca marca = marcaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Marca", id));

        if (datosNuevos.getNombre() != null && !datosNuevos.getNombre().isBlank()) {
            String nuevoNombre = normalizarNombre(datosNuevos.getNombre());
            if (!nuevoNombre.equalsIgnoreCase(marca.getNombre())) {
                marcaRepository.findByNombreIgnoreCase(nuevoNombre)
                        .filter(otra -> !otra.getId().equals(id))
                        .ifPresent(otra -> {
                            throw new ConflictoEstadoException("Ya existe una marca con ese nombre");
                        });
                marca.setNombre(nuevoNombre);
            }
        }

        if (datosNuevos.getActiva() != null) {
            marca.setActiva(datosNuevos.getActiva());
        }

        return marcaRepository.save(marca);
    }

    private String normalizarNombre(String nombre) {
        if (nombre == null) {
            return "";
        }
        return nombre.trim().replaceAll("\\s+", " ");
    }
}
