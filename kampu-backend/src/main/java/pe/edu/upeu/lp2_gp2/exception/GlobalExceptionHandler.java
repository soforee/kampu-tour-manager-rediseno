package pe.edu.upeu.lp2_gp2.exception;

import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import pe.edu.upeu.lp2_gp2.dto.ErrorDTO;

import java.time.LocalDate;
import java.util.Map;

/** Convierte las excepciones en {status, error, timestamp}; el frontend muestra "error". */
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private ResponseEntity<ErrorDTO> responder(HttpStatus status, String mensaje) {
        return ResponseEntity.status(status).body(new ErrorDTO(status.value(), mensaje));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorDTO> noEncontrado(ResourceNotFoundException e) {
        return responder(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorDTO> negocio(BusinessException e) {
        return responder(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorDTO> duplicado(DuplicateResourceException e) {
        return responder(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorDTO> noAutorizado(UnauthorizedException e) {
        return responder(HttpStatus.UNAUTHORIZED, e.getMessage());
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorDTO> prohibido(ForbiddenException e) {
        return responder(HttpStatus.FORBIDDEN, e.getMessage());
    }

    /** Bean Validation: se devuelve el primer mensaje (igual que las alertas del frontend). */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorDTO> validacion(MethodArgumentNotValidException e) {
        String mensaje = e.getBindingResult().getAllErrors().stream()
                .map(err -> err.getDefaultMessage())
                .findFirst().orElse("Datos inválidos.");
        return responder(HttpStatus.BAD_REQUEST, mensaje);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ErrorDTO> validacionMetodo(HandlerMethodValidationException e) {
        String mensaje = e.getAllErrors().stream()
                .map(err -> err.getDefaultMessage())
                .findFirst().orElse("Datos inválidos.");
        return responder(HttpStatus.BAD_REQUEST, mensaje);
    }

    /** Nombres legibles de los campos para los mensajes de formato. */
    private static final Map<String, String> CAMPOS = Map.ofEntries(
            Map.entry("dias", "días"), Map.entry("noches", "noches"), Map.entry("precioBase", "precio base"),
            Map.entry("capacidad", "capacidad"), Map.entry("cuposMaximos", "cupos máximos"), Map.entry("monto", "monto"),
            Map.entry("fechaInicio", "fecha de inicio"), Map.entry("fechaFin", "fecha fin"),
            Map.entry("fechaNacimiento", "fecha de nacimiento"), Map.entry("paqueteId", "paquete"),
            Map.entry("clienteId", "cliente"), Map.entry("salidaId", "salida"), Map.entry("guiaId", "guía"),
            Map.entry("transporteId", "transporte"), Map.entry("reservaId", "reserva"));

    /** JSON con un tipo incorrecto (p. ej. letras o decimales en un campo entero, o una fecha mal escrita). */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorDTO> formato(HttpMessageNotReadableException e) {
        if (e.getCause() instanceof MismatchedInputException mie && !mie.getPath().isEmpty()) {
            String campo = mie.getPath().get(mie.getPath().size() - 1).getFieldName();
            Class<?> tipo = mie.getTargetType();
            if (campo != null) {
                String nombre = CAMPOS.getOrDefault(campo, campo);
                String esperado = tipo == null ? "un valor válido"
                        : (tipo == Integer.class || tipo == int.class || tipo == Long.class || tipo == long.class) ? "un número entero"
                        : Number.class.isAssignableFrom(tipo) ? "un número"
                        : tipo == LocalDate.class ? "una fecha válida (AAAA-MM-DD)"
                        : "un valor válido";
                return responder(HttpStatus.BAD_REQUEST, "El campo " + nombre + " debe ser " + esperado + ".");
            }
        }
        return responder(HttpStatus.BAD_REQUEST, "El formato de los datos enviados no es válido.");
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorDTO> parametro(MethodArgumentTypeMismatchException e) {
        return responder(HttpStatus.BAD_REQUEST, "El parámetro " + e.getName() + " no tiene un formato válido.");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorDTO> archivoGrande(MaxUploadSizeExceededException e) {
        return responder(HttpStatus.PAYLOAD_TOO_LARGE, "La imagen supera el tamaño máximo permitido.");
    }

    /** Última defensa: UNIQUE, FK o CHECK del script Oracle. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorDTO> integridad(DataIntegrityViolationException e) {
        log.warn("Violación de integridad: {}", e.getMostSpecificCause().getMessage());
        return responder(HttpStatus.CONFLICT, "La operación viola una restricción de la base de datos (registro duplicado o en uso).");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorDTO> metodo(HttpRequestMethodNotSupportedException e) {
        return responder(HttpStatus.METHOD_NOT_ALLOWED, "Método HTTP no soportado.");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorDTO> rutaInexistente(NoResourceFoundException e) {
        return responder(HttpStatus.NOT_FOUND, "Recurso no encontrado.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDTO> general(Exception e) {
        log.error("Error no controlado", e);
        return responder(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrió un error inesperado en el servidor.");
    }
}
