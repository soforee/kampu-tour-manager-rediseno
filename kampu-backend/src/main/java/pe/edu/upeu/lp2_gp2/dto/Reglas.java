package pe.edu.upeu.lp2_gp2.dto;

import java.time.LocalDate;

/**
 * Reglas de formato compartidas por los DTO de entrada.
 * Las mismas expresiones se usan en el frontend (core/utils/validacion.ts) para que ambos lados validen igual.
 * Los campos opcionales aceptan vacío ("^$|..."); los espacios al inicio y al final se toleran porque el servicio los recorta.
 */
public final class Reglas {
    private Reglas() {
    }

    /** Nombres de personas: letras (con tildes y ñ), espacios, punto, apóstrofo y guion. */
    public static final String NOMBRE_PERSONA = "^\\s*(\\p{L}[\\p{L} .'-]*)?\\s*$"; // vacío: lo informa @NotBlank
    public static final String MSG_NOMBRE_PERSONA = "solo admite letras, espacios y los signos . ' -";

    /** Texto general (nombres de paquetes, especialidades, métodos de pago): letras, números y signos comunes. */
    public static final String TEXTO = "^$|^[\\p{L}\\p{N} .,;:'\"()&/+#°ºª¡!¿?%-]*$";

    /** Nacionalidad: solo letras y espacios. */
    public static final String NACIONALIDAD = "^$|^\\s*\\p{L}[\\p{L} ]*\\s*$";

    /** Teléfono opcional: dígitos con +, espacios, guiones o paréntesis; entre 6 y 15 dígitos (se revisa aparte). */
    public static final String TELEFONO = "^$|^\\s*\\+?[0-9][0-9 ()-]*\\s*$";
    public static final String MSG_TELEFONO = "El teléfono solo admite números y los signos + ( ) - (entre 6 y 15 dígitos).";

    /** Correo opcional con dominio (ejemplo@dominio.com). */
    public static final String EMAIL = "^$|^\\s*[^@\\s]+@[^@\\s]+\\.[A-Za-z]{2,}\\s*$";

    /** Placa: letras, números y guion (3 a 15). */
    public static final String PLACA = "^\\s*([A-Za-z0-9-]{3,15})?\\s*$"; // vacío: lo informa @NotBlank

    /** Código de transacción opcional: letras, números y . _ / # - */
    public static final String CODIGO = "^$|^[A-Za-z0-9 ._/#-]*$";

    public static final LocalDate FECHA_MINIMA = LocalDate.of(1900, 1, 1);

    /** Número de documento según el tipo: DNI 8 dígitos; CE 8 a 12 letras o números; pasaporte 6 a 12 letras o números. */
    public static boolean documentoValido(String tipo, String numero) {
        if (tipo == null || numero == null || numero.isBlank()) return true; // de eso se encargan @NotBlank/@NotNull
        String n = numero.trim();
        return switch (tipo) {
            case "DNI" -> n.matches("\\d{8}");
            case "CE" -> n.matches("[A-Za-z0-9]{8,12}");
            case "PASAPORTE" -> n.matches("[A-Za-z0-9]{6,12}");
            default -> true; // @Pattern del tipo ya lo rechaza
        };
    }

    public static final String MSG_DOCUMENTO =
            "Número de documento no válido: el DNI tiene 8 dígitos; el CE, de 8 a 12 letras o números; el pasaporte, de 6 a 12 letras o números.";

    /** El teléfono debe tener entre 6 y 15 dígitos (sin contar signos). */
    public static boolean telefonoValido(String telefono) {
        if (telefono == null || telefono.isBlank()) return true;
        long digitos = telefono.chars().filter(Character::isDigit).count();
        return digitos >= 6 && digitos <= 15;
    }
}
