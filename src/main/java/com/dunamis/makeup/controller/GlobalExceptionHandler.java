package com.dunamis.makeup.controller;

import com.dunamis.makeup.dto.auth.LoginRequest;
import com.dunamis.makeup.dto.common.ErrorResponse;
import com.dunamis.makeup.exception.ConflictoEstadoException;
import com.dunamis.makeup.exception.RecursoNoEncontradoException;
import com.dunamis.makeup.exception.ReglaNegocioException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Manejador global centralizado de excepciones de la API REST (Principio 11 de la Constitución).
 * Garantiza respuestas estructuradas en formato JSON uniforme y 0% de texto plano.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 1. Errores de Autenticación (401 Unauthorized)
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse.of("UNAUTHORIZED", "Usuario o contraseña incorrectos"));
    }

    // 2. Errores de Acceso y Autorización RBAC (403 Forbidden)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse.of("FORBIDDEN", "Acceso denegado: permisos insuficientes para realizar esta operación"));
    }

    // 3. Recursos no encontrados (404 Not Found)
    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ErrorResponse> handleRecursoNoEncontrado(RecursoNoEncontradoException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of("NOT_FOUND", ex.getMessage()));
    }

    // 4. Violaciones de Reglas de Negocio y Parámetros (400 Bad Request)
    @ExceptionHandler(ReglaNegocioException.class)
    public ResponseEntity<ErrorResponse> handleReglaNegocio(ReglaNegocioException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of("BAD_REQUEST", ex.getMessage()));
    }

    // 5. Conflictos de Estado, Stock Insuficiente y Concurrencia (409 Conflict)
    @ExceptionHandler(ConflictoEstadoException.class)
    public ResponseEntity<ErrorResponse> handleConflictoEstado(ConflictoEstadoException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponse.of("CONFLICT", ex.getMessage()));
    }

    // 6. Violaciones de Integridad de Base de Datos (409 Conflict seguro, sin exponer SQL)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.warn("Violación de integridad referencial o unicidad en base de datos: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ErrorResponse.of("DATA_INTEGRITY_VIOLATION",
                        "La operación no pudo completarse debido a una restricción de integridad de datos (registro duplicado o dependencias existentes)"));
    }

    // 7. Validación de Entrada de DTOs con desglose por campo (400 Bad Request)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        if (ex.getTarget() instanceof LoginRequest) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ErrorResponse.of("BAD_REQUEST", "Los datos de inicio de sesión son inválidos o están incompletos"));
        }

        Map<String, String> detalles = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            detalles.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        String primerMensaje = ex.getBindingResult().getAllErrors().stream()
                .findFirst()
                .map(DefaultMessageSourceResolvable::getDefaultMessage)
                .orElse("Los datos de la solicitud son inválidos o están incompletos");

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of("VALIDATION_FAILED", primerMensaje, detalles));
    }

    // 8. Cuerpo JSON Malformado o Tipos Incompatibles (400 Bad Request)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of("BAD_REQUEST",
                        "El cuerpo de la solicitud es inválido, está mal formado o contiene tipos de datos incompatibles"));
    }

    // 9. Parámetro de URL con tipo inválido (400 Bad Request)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String mensaje = String.format("El parámetro '%s' debe ser de tipo válido (valor recibido: '%s')",
                ex.getName(), ex.getValue());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of("BAD_REQUEST", mensaje));
    }

    // 10. Compatibilidad con ResponseStatusException existente
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatusException(ResponseStatusException ex) {
        String error = switch (ex.getStatusCode().value()) {
            case 404 -> "NOT_FOUND";
            case 409 -> "CONFLICT";
            case 400 -> "BAD_REQUEST";
            case 403 -> "FORBIDDEN";
            default -> ex.getStatusCode().toString();
        };
        String message = ex.getReason() != null ? ex.getReason() : "Error en la solicitud";
        return ResponseEntity.status(ex.getStatusCode())
                .body(ErrorResponse.of(error, message));
    }

    // 11. Fallback Global de Excepciones no Controladas (500 Internal Server Error seguro)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        log.error("Excepción no controlada en el servidor", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("INTERNAL_SERVER_ERROR",
                        "Ha ocurrido un error interno en el servidor. Por favor contacte al administrador"));
    }
}
