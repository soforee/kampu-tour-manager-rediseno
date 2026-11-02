// Reglas de validación de formularios.
// Son las mismas que aplica el backend (dto/Reglas.java), para que ambos lados acepten y rechacen lo mismo.
import { TipoDocumento } from '../models';

export type ErrorCampo = string | null;

const NOMBRE_PERSONA = /^\p{L}[\p{L} .'-]*$/u;
const TEXTO = /^[\p{L}\p{N} .,;:'"()&/+#°ºª¡!¿?%-]*$/u;
const NACIONALIDAD = /^\p{L}[\p{L} ]*$/u;
const TELEFONO = /^\+?[0-9][0-9 ()-]*$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/;
const PLACA = /^[A-Za-z0-9-]{3,15}$/;
const CODIGO = /^[A-Za-z0-9 ._/#-]*$/;

/** "Los días deben…" / "La capacidad debe…" */
const debe = (campo: string) => /^(Los|Las) /.test(campo) ? 'deben' : 'debe';
const ingresa = (campo: string) => `Ingresa ${campo.charAt(0).toLowerCase() + campo.slice(1)} (solo números).`;

const vacio = (v: unknown) => v === null || v === undefined || String(v).trim() === '';

export const V = {
  requerido(v: unknown, campo: string): ErrorCampo {
    return vacio(v) ? `${campo} es obligatorio.` : null;
  },

  nombrePersona(v: string, campo = 'El nombre', max = 150): ErrorCampo {
    const t = (v ?? '').trim();
    if (!t) return `${campo} es obligatorio.`;
    if (t.length > max) return `${campo} admite máximo ${max} caracteres.`;
    return NOMBRE_PERSONA.test(t) ? null : `${campo} solo admite letras, espacios y los signos . ' -`;
  },

  texto(v: string, campo: string, max: number, obligatorio = false): ErrorCampo {
    const t = (v ?? '').trim();
    if (!t) return obligatorio ? `${campo} es obligatorio.` : null;
    if (t.length > max) return `${campo} admite máximo ${max} caracteres.`;
    return TEXTO.test(t) ? null : `${campo} contiene caracteres no permitidos.`;
  },

  nacionalidad(v: string): ErrorCampo {
    const t = (v ?? '').trim();
    if (!t) return null;
    if (t.length > 50) return 'La nacionalidad admite máximo 50 caracteres.';
    return NACIONALIDAD.test(t) ? null : 'La nacionalidad solo admite letras y espacios.';
  },

  documento(tipo: TipoDocumento, v: string): ErrorCampo {
    const t = (v ?? '').trim();
    if (!t) return 'El número de documento es obligatorio.';
    if (tipo === 'DNI') return /^\d{8}$/.test(t) ? null : 'El DNI debe tener exactamente 8 dígitos.';
    if (tipo === 'CE') return /^[A-Za-z0-9]{8,12}$/.test(t) ? null : 'El carné de extranjería tiene de 8 a 12 letras o números.';
    return /^[A-Za-z0-9]{6,12}$/.test(t) ? null : 'El pasaporte tiene de 6 a 12 letras o números.';
  },

  email(v: string): ErrorCampo {
    const t = (v ?? '').trim();
    if (!t) return null;
    if (t.length > 100) return 'El correo admite máximo 100 caracteres.';
    return EMAIL.test(t) ? null : 'Escribe un correo válido (ejemplo: nombre@dominio.com).';
  },

  telefono(v: string): ErrorCampo {
    const t = (v ?? '').trim();
    if (!t) return null;
    if (t.length > 20) return 'El teléfono admite máximo 20 caracteres.';
    const digitos = t.replace(/\D/g, '').length;
    return TELEFONO.test(t) && digitos >= 6 && digitos <= 15 ? null : 'El teléfono debe tener entre 6 y 15 dígitos (puede llevar + ( ) -).';
  },

  placa(v: string): ErrorCampo {
    const t = (v ?? '').trim();
    if (!t) return 'La placa es obligatoria.';
    return PLACA.test(t) ? null : 'La placa solo admite letras, números y guion (3 a 15 caracteres).';
  },

  codigo(v: string): ErrorCampo {
    const t = (v ?? '').trim();
    if (!t) return null;
    if (t.length > 100) return 'El código admite máximo 100 caracteres.';
    return CODIGO.test(t) ? null : 'El código solo admite letras, números y . _ / # -';
  },

  /** Número entero en [min, max]. Un campo numérico vacío o con texto llega como null/NaN. */
  entero(v: number | null, campo: string, min: number, max: number): ErrorCampo {
    if (v === null || v === undefined || (typeof v === 'number' && isNaN(v))) return ingresa(campo);
    if (!Number.isInteger(v)) return `${campo} ${debe(campo)} ser un número entero.`;
    return v < min || v > max ? `${campo} ${debe(campo)} estar entre ${min} y ${max}.` : null;
  },

  /** Importe con hasta 2 decimales, mayor a 0 y que quepa en NUMBER(10,2). */
  importe(v: number | null, campo: string): ErrorCampo {
    if (v === null || v === undefined || (typeof v === 'number' && isNaN(v))) return ingresa(campo);
    if (v <= 0) return `${campo} ${debe(campo)} ser mayor a 0.`;
    if (v > 99999999.99) return `${campo} no puede superar 99,999,999.99.`;
    return Math.round(v * 100) / 100 === v ? null : `${campo} admite como máximo 2 decimales.`;
  },

  /** Fecha AAAA-MM-DD real (el navegador deja vacío el valor si la fecha está incompleta). */
  fecha(v: string, campo: string, obligatorio = true): ErrorCampo {
    if (!v) return obligatorio ? `${campo} es obligatoria.` : null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(new Date(v + 'T00:00:00').getTime())) return `${campo} no es una fecha válida.`;
    return null;
  }
};

/**
 * Estado de validación de un formulario: los errores se muestran cuando el campo pierde el foco
 * (y desde ahí se actualizan mientras se escribe) o cuando se intenta guardar.
 */
export class FormValidacion<K extends string = string> {
  private tocados = new Set<string>();
  private intentado = false;

  constructor(private reglas: () => Partial<Record<K, ErrorCampo>>) {}

  tocar(campo: K) { this.tocados.add(campo); }

  /** Mensaje a mostrar debajo del campo (null si no hay error o aún no corresponde mostrarlo). */
  error(campo: K): ErrorCampo {
    if (!this.intentado && !this.tocados.has(campo)) return null;
    return this.reglas()[campo] ?? null;
  }

  /** Marca el intento de envío y devuelve si no hay errores. */
  valido(): boolean {
    this.intentado = true;
    return Object.values(this.reglas()).every(e => !e);
  }

  reiniciar() { this.tocados.clear(); this.intentado = false; }
}
