package com.dunamis.makeup.controller;

import com.dunamis.makeup.dto.common.ErrorResponse;
import com.dunamis.makeup.exception.ConflictoEstadoException;
import com.dunamis.makeup.exception.RecursoNoEncontradoException;
import com.dunamis.makeup.exception.ReglaNegocioException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.http.MockHttpInputMessage;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Pruebas Unitarias - GlobalExceptionHandler (Spec 005 - RF-003 a RF-010)")
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("Debe manejar RecursoNoEncontradoException retornando HTTP 404 JSON uniforme")
    void testHandleRecursoNoEncontrado() {
        RecursoNoEncontradoException ex = new RecursoNoEncontradoException("Producto", 99L);
        ResponseEntity<ErrorResponse> response = handler.handleRecursoNoEncontrado(ex);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("NOT_FOUND", response.getBody().error());
        assertEquals("Producto no encontrado con id: 99", response.getBody().message());
        assertTrue(response.getBody().timestamp() > 0);
        assertNull(response.getBody().detalles());
    }

    @Test
    @DisplayName("Debe manejar ReglaNegocioException retornando HTTP 400 Bad Request")
    void testHandleReglaNegocio() {
        ReglaNegocioException ex = new ReglaNegocioException("El umbral de existencias no puede ser menor a cero");
        ResponseEntity<ErrorResponse> response = handler.handleReglaNegocio(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("BAD_REQUEST", response.getBody().error());
        assertEquals("El umbral de existencias no puede ser menor a cero", response.getBody().message());
    }

    @Test
    @DisplayName("Debe manejar ConflictoEstadoException retornando HTTP 409 Conflict")
    void testHandleConflictoEstado() {
        ConflictoEstadoException ex = new ConflictoEstadoException("La factura #101 ya se encuentra anulada");
        ResponseEntity<ErrorResponse> response = handler.handleConflictoEstado(ex);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("CONFLICT", response.getBody().error());
        assertEquals("La factura #101 ya se encuentra anulada", response.getBody().message());
    }

    @Test
    @DisplayName("Debe manejar DataIntegrityViolationException con mensaje seguro y sin exponer SQL sensible")
    void testHandleDataIntegrityViolation() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "ERROR: update or delete on table 'producto' violates foreign key constraint 'fk_detalle_factura_producto' on table 'detalle_factura'");
        ResponseEntity<ErrorResponse> response = handler.handleDataIntegrityViolation(ex);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("DATA_INTEGRITY_VIOLATION", response.getBody().error());
        assertTrue(response.getBody().message().contains("restricción de integridad de datos"));
        assertFalse(response.getBody().message().contains("ERROR: update or delete"));
        assertFalse(response.getBody().message().contains("fk_detalle_factura_producto"));
    }

    @Test
    @DisplayName("Debe manejar MethodArgumentNotValidException retornando mapa ordenado de errores por campo")
    void testHandleMethodArgumentNotValid() throws Exception {
        Object dummyTarget = new Object();
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(dummyTarget, "target");
        bindingResult.addError(new FieldError("target", "nombre", "El nombre es obligatorio"));
        bindingResult.addError(new FieldError("target", "precio", "El precio debe ser mayor a 0"));

        Method dummyMethod = this.getClass().getDeclaredMethod("testHandleMethodArgumentNotValid");
        MethodParameter parameter = new MethodParameter(dummyMethod, -1);

        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(parameter, bindingResult);
        ResponseEntity<ErrorResponse> response = handler.handleMethodArgumentNotValid(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("VALIDATION_FAILED", response.getBody().error());
        assertNotNull(response.getBody().detalles());
        assertEquals(2, response.getBody().detalles().size());
        assertEquals("El nombre es obligatorio", response.getBody().detalles().get("nombre"));
        assertEquals("El precio debe ser mayor a 0", response.getBody().detalles().get("precio"));
    }

    @Test
    @DisplayName("Debe manejar HttpMessageNotReadableException retornando HTTP 400 Bad Request")
    void testHandleHttpMessageNotReadable() {
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException(
                "JSON parse error: Unrecognized token 'invalido'", new MockHttpInputMessage("invalido".getBytes()));
        ResponseEntity<ErrorResponse> response = handler.handleHttpMessageNotReadable(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("BAD_REQUEST", response.getBody().error());
        assertTrue(response.getBody().message().contains("El cuerpo de la solicitud es inválido"));
    }

    @Test
    @DisplayName("Debe manejar AccessDeniedException retornando HTTP 403 Forbidden")
    void testHandleAccessDenied() {
        AccessDeniedException ex = new AccessDeniedException("Acceso denegado");
        ResponseEntity<ErrorResponse> response = handler.handleAccessDeniedException(ex);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("FORBIDDEN", response.getBody().error());
        assertTrue(response.getBody().message().contains("permisos insuficientes"));
    }

    @Test
    @DisplayName("Debe manejar AuthenticationException retornando HTTP 401 Unauthorized")
    void testHandleAuthenticationException() {
        BadCredentialsException ex = new BadCredentialsException("Bad credentials");
        ResponseEntity<ErrorResponse> response = handler.handleAuthenticationException(ex);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("UNAUTHORIZED", response.getBody().error());
        assertEquals("Usuario o contraseña incorrectos", response.getBody().message());
    }

    @Test
    @DisplayName("Debe manejar HttpRequestMethodNotSupportedException retornando HTTP 405 Method Not Allowed")
    void testHandleHttpRequestMethodNotSupported() {
        HttpRequestMethodNotSupportedException ex = new HttpRequestMethodNotSupportedException("DELETE");
        ResponseEntity<ErrorResponse> response = handler.handleHttpRequestMethodNotSupported(ex);

        assertEquals(HttpStatus.METHOD_NOT_ALLOWED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("METHOD_NOT_ALLOWED", response.getBody().error());
        assertEquals("El método HTTP no está permitido para este recurso", response.getBody().message());
    }

    @Test
    @DisplayName("Debe manejar Exception no controlada retornando HTTP 500 seguro sin texto plano ni trazas")
    void testHandleGeneralException() {
        NullPointerException ex = new NullPointerException("Falla interna inesperada de prueba");
        ResponseEntity<ErrorResponse> response = handler.handleGeneralException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("INTERNAL_SERVER_ERROR", response.getBody().error());
        assertEquals("Ha ocurrido un error interno en el servidor. Por favor contacte al administrador", response.getBody().message());
        assertFalse(response.getBody().message().contains("NullPointerException"));
    }
}
