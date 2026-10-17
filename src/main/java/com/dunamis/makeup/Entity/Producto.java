package com.dunamis.makeup.Entity;


import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Producto {


    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "El nombre del producto no puede estar vacio")
    private String nombre;

    @NotNull(message = "El precio del producto no puede estar vacio")
    @DecimalMin(value = "0.0", message = "El precio no puede ser negativo")
    private Double precio;

    @NotNull(message = "La cantidad no puede estar vacia")
    @Min(value = 0, message = "Las existencias no pueden ser negativas")
    private Integer cantidad;

    private Integer cantidadInicial;

    private Double totalProducto;

    @NotNull(message = "La categoria no puede estar vacia")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoriaProducto categoria;

    // Nullable for existing catalog rows; new products must select a brand in the service.
    @ManyToOne
    @JoinColumn(name = "marca_id")
    private Marca marca;


}
