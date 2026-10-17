package com.dunamis.makeup.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

@Entity
@Getter
@Setter
public class Factura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 255)
    @Size(max = 255, message = "El nombre del cliente no puede superar 255 caracteres")
    private String cliente;

    @Size(max = 30, message = "El teléfono no puede superar 30 caracteres")
    private String telefonoCliente;

    @Column(length = 120)
    private String vendedorNombre;

    @Column(length = 50)
    private String vendedorUsuario;
    private LocalDate fecha = LocalDate.now();
    private Double total;

    @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL)
    @NotEmpty(message = "La factura debe tener al menos un producto")
    @Valid
    private List<DetalleFactura> detalles;
}
