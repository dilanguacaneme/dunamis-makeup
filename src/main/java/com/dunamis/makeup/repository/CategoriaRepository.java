package com.dunamis.makeup.repository;

import com.dunamis.makeup.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio Spring Data JPA para la entidad Categoria (Spec 008).
 */
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    Optional<Categoria> findByNombreIgnoreCase(String nombre);
    boolean existsByNombreIgnoreCase(String nombre);
    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Long id);
    List<Categoria> findByActivaTrueOrderByNombreAsc();
    List<Categoria> findAllByOrderByNombreAsc();
}
