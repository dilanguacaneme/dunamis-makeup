package com.dunamis.makeup.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class AbonoFactura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "factura_id", nullable = false)
    @JsonIgnore
    private Factura factura;

    @NotNull(message = "El monto del abono es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto del abono debe ser mayor a cero")
    @Column(nullable = false)
    private Double monto;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @NotNull(message = "El medio de pago es obligatorio")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MedioPago medioPago;

    @Size(max = 255, message = "Las notas no pueden superar 255 caracteres")
    @Column(length = 255)
    private String notas;

    @Column(nullable = false, length = 50)
    private String usuarioRegistro;

    public AbonoFactura(Factura factura, Double monto, MedioPago medioPago, String notas, String usuarioRegistro) {
        this.factura = factura;
        this.monto = monto;
        this.medioPago = medioPago;
        this.notas = notas;
        this.usuarioRegistro = usuarioRegistro;
        this.fecha = LocalDateTime.now();
    }
}
