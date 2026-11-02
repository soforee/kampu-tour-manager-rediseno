package pe.edu.upeu.lp2_gp2.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record PasajeroRequestDTO(
        @NotBlank(message = "Completa nombre y documento de todos los pasajeros.")
        @Size(max = 150, message = "El nombre del pasajero admite máximo 150 caracteres.")
        @Pattern(regexp = Reglas.NOMBRE_PERSONA, message = "El nombre del pasajero " + Reglas.MSG_NOMBRE_PERSONA)
        String nombreCompleto,
        @NotNull(message = "El tipo de documento del pasajero es obligatorio.")
        @Pattern(regexp = "DNI|CE|PASAPORTE", message = "El tipo de documento debe ser DNI, CE o PASAPORTE.")
        String tipoDocumento,
        @NotBlank(message = "Completa nombre y documento de todos los pasajeros.")
        @Size(max = 20, message = "El documento del pasajero admite máximo 20 caracteres.")
        String numeroDocumento,
        @Size(max = 50, message = "La nacionalidad admite máximo 50 caracteres.")
        @Pattern(regexp = Reglas.NACIONALIDAD, message = "La nacionalidad solo admite letras y espacios.")
        String nacionalidad,
        @Past(message = "La fecha de nacimiento debe ser anterior a hoy.")
        LocalDate fechaNacimiento
) {
    @JsonIgnore
    @AssertTrue(message = Reglas.MSG_DOCUMENTO)
    public boolean isDocumentoValido() {
        return Reglas.documentoValido(tipoDocumento, numeroDocumento);
    }

    @JsonIgnore
    @AssertTrue(message = "La fecha de nacimiento no puede ser anterior a 1900.")
    public boolean isFechaNacimientoRazonable() {
        return fechaNacimiento == null || !fechaNacimiento.isBefore(Reglas.FECHA_MINIMA);
    }
}
