package com.dunamis.makeup.service;

import com.dunamis.makeup.dto.categoria.ActualizarCategoriaRequest;
import com.dunamis.makeup.dto.categoria.CategoriaResponse;
import com.dunamis.makeup.dto.categoria.CrearCategoriaRequest;
import com.dunamis.makeup.entity.Categoria;
import com.dunamis.makeup.exception.ConflictoEstadoException;
import com.dunamis.makeup.exception.RecursoNoEncontradoException;
import com.dunamis.makeup.repository.CategoriaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio de lógica de negocio para la gestión de categorías (Spec 008).
 */
@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;

    public CategoriaService(CategoriaRepository categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listarCategorias(boolean incluirInactivas) {
        List<Categoria> categorias = incluirInactivas
                ? categoriaRepository.findAllByOrderByNombreAsc()
                : categoriaRepository.findByActivaTrueOrderByNombreAsc();
        return categorias.stream().map(CategoriaResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<Categoria> listarCategoriasActivas() {
        return categoriaRepository.findByActivaTrueOrderByNombreAsc();
    }

    @Transactional
    public CategoriaResponse crearCategoria(CrearCategoriaRequest request) {
        String nombreNormalizado = normalizarNombre(request.nombre());
        if (categoriaRepository.findByNombreIgnoreCase(nombreNormalizado).isPresent()) {
            throw new ConflictoEstadoException("Ya existe una categoría con ese nombre");
        }
        Categoria categoria = new Categoria(nombreNormalizado);
        return CategoriaResponse.fromEntity(categoriaRepository.save(categoria));
    }

    @Transactional
    public CategoriaResponse actualizarCategoria(Long id, ActualizarCategoriaRequest request) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Categoría", id));

        if (request.nombre() != null && !request.nombre().isBlank()) {
            String nuevoNombre = normalizarNombre(request.nombre());
            if (!nuevoNombre.equalsIgnoreCase(categoria.getNombre())) {
                categoriaRepository.findByNombreIgnoreCase(nuevoNombre)
                        .filter(otra -> !otra.getId().equals(id))
                        .ifPresent(otra -> {
                            throw new ConflictoEstadoException("Ya existe una categoría con ese nombre");
                        });
                categoria.setNombre(nuevoNombre);
            }
        }

        if (request.activa() != null) {
            categoria.setActiva(request.activa());
        }

        return CategoriaResponse.fromEntity(categoriaRepository.save(categoria));
    }

    private String normalizarNombre(String nombre) {
        if (nombre == null) {
            return "";
        }
        return nombre.trim().replaceAll("\\s+", " ");
    }
}
