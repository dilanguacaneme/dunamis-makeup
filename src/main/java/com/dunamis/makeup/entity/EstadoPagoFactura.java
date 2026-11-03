package com.dunamis.makeup.entity;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum EstadoPagoFactura {
    PAGADA,
    ABONO_PARCIAL,
    PENDIENTE;

    @JsonCreator
    public static EstadoPagoFactura fromString(String value) {
        if (value == null || value.isBlank()) {
            return PAGADA;
        }
        String clean = value.trim().toUpperCase();
        if ("PARCIAL".equals(clean)) {
            return ABONO_PARCIAL;
        }
        for (EstadoPagoFactura estado : values()) {
            if (estado.name().equalsIgnoreCase(clean)) {
                return estado;
            }
        }
        throw new IllegalArgumentException("Estado de pago no reconocido: " + value);
    }
}

