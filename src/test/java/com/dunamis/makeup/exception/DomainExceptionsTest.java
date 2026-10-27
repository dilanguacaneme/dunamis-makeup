package com.dunamis.makeup.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Pruebas Unitarias - Jerarquía de Excepciones de Dominio (Spec 005 - RF-001, RF-002)")
class DomainExceptionsTest {

    @Test
    @DisplayName("RecursoNoEncontradoException debe construir mensajes formateados y heredar de DunamisException")
    void testRecursoNoEncontradoException() {
        RecursoNoEncontradoException exId = new RecursoNoEncontradoException("Producto", 42L);
        assertEquals("Producto no encontrado con id: 42", exId.getMessage());
        assertInstanceOf(DunamisException.class, exId);
        assertInstanceOf(RuntimeException.class, exId);

        RecursoNoEncontradoException exIdentificador = new RecursoNoEncontradoException("Marca", "Trendy");
        assertEquals("Marca no encontrado: Trendy", exIdentificador.getMessage());
    }

    @Test
    @DisplayName("ProductoNoEncontradoException e InventarioVacioException deben ser subclases de RecursoNoEncontradoException")
    void testSubclasesRecursoNoEncontrado() {
        ProductoNoEncontradoException prodEx = new ProductoNoEncontradoException(10L);
        assertEquals("Producto con id: 10 no encontrado", prodEx.getMessage());
        assertInstanceOf(RecursoNoEncontradoException.class, prodEx);

        InventarioVacioException invEx = new InventarioVacioException();
        assertEquals("El inventario se encuentra vacío", invEx.getMessage());
        assertInstanceOf(RecursoNoEncontradoException.class, invEx);
    }

    @Test
    @DisplayName("ReglaNegocioException debe heredar de DunamisException y retener mensaje y causa")
    void testReglaNegocioException() {
        IllegalArgumentException cause = new IllegalArgumentException("Valor negativo");
        ReglaNegocioException ex = new ReglaNegocioException("El umbral no puede ser menor a cero", cause);

        assertEquals("El umbral no puede ser menor a cero", ex.getMessage());
        assertSame(cause, ex.getCause());
        assertInstanceOf(DunamisException.class, ex);
    }

    @Test
    @DisplayName("ConflictoEstadoException y ProductoInsuficienteException deben representar conflictos de estado (409)")
    void testConflictoEstadoException() {
        ConflictoEstadoException conflictoEx = new ConflictoEstadoException("La factura ya se encuentra anulada");
        assertInstanceOf(DunamisException.class, conflictoEx);

        ProductoInsuficienteException stockEx = new ProductoInsuficienteException("Labial Mate", 5L, 2, 5);
        assertEquals("Stock insuficiente para el producto 'Labial Mate' (id: 5). Existencias disponibles: 2, solicitadas: 5", stockEx.getMessage());
        assertInstanceOf(ConflictoEstadoException.class, stockEx);
    }
}
