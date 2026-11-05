package com.dunamis.makeup.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entidad JPA representativa de una categoría cosmética dinámica (Spec 008).
 */
@Entity
@Table(name = "categorias")
@Getter
@Setter
@NoArgsConstructor
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre de la categoría es obligatorio")
    @Size(min = 2, max = 60, message = "El nombre de la categoría debe tener entre 2 y 60 caracteres")
    @Column(nullable = false, unique = true, length = 60)
    private String nombre;

    @Column(nullable = false)
    private Boolean activa;

    public Categoria(String nombre) {
        this.nombre = nombre != null ? nombre.trim() : null;
        this.activa = true;
    }
}
