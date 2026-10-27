package com.dunamis.makeup.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.ArrayList;
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

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    private Double total;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private EstadoPagoFactura estadoPago = EstadoPagoFactura.PAGADA;

    private Double valorAbonado;

    private Double saldoPendiente;

    @Column(nullable = false)
    private Boolean anulada = false;

    private LocalDateTime fechaAnulacion;

    @Column(length = 500)
    private String motivoAnulacion;

    @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL, orphanRemoval = true)
    @NotEmpty(message = "La factura debe tener al menos un producto")
    @Valid
    private List<DetalleFactura> detalles = new ArrayList<>();

    @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AbonoFactura> abonos = new ArrayList<>();

    @PrePersist
    @PostLoad
    public void asegurarValoresPorDefecto() {
        if (fecha == null) {
            fecha = LocalDateTime.now();
        }
        if (anulada == null) {
            anulada = false;
        }
        if (estadoPago == null) {
            estadoPago = EstadoPagoFactura.PAGADA;
        }
        if (estadoPago == EstadoPagoFactura.PAGADA) {
            if (valorAbonado == null || valorAbonado == 0.0) {
                valorAbonado = total != null ? total : 0.0;
            }
            saldoPendiente = 0.0;
        } else {
            if (valorAbonado == null) {
                valorAbonado = 0.0;
            }
            if (saldoPendiente == null && total != null) {
                saldoPendiente = Math.max(0.0, total - valorAbonado);
            }
        }
    }
}
