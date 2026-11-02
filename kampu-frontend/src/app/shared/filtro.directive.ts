import { Directive, ElementRef, HostListener, Input } from '@angular/core';

export type TipoFiltro = 'entero' | 'decimal' | 'telefono' | 'dni' | 'alfanumerico' | 'nombre' | 'placa' | 'codigo';

/** Caracteres que puede escribir cada tipo de campo. */
const PERMITIDOS: Record<TipoFiltro, RegExp> = {
  entero: /[0-9]/,
  decimal: /[0-9.]/,
  telefono: /[0-9+()\- ]/,
  dni: /[0-9]/,
  alfanumerico: /[A-Za-z0-9]/,
  nombre: /[\p{L} .'-]/u,
  placa: /[A-Za-z0-9-]/,
  codigo: /[A-Za-z0-9 ._/#-]/
};

/**
 * Impide escribir o pegar caracteres que no corresponden al campo
 * (por ejemplo letras o la "e" en un campo numérico). Uso: <input kpFiltro="entero">
 * Al pegar texto con caracteres inválidos, se pegan solo los válidos.
 */
@Directive({ selector: 'input[kpFiltro]', standalone: true })
export class FiltroDirective {
  @Input({ required: true }) kpFiltro!: TipoFiltro;
  /** Para "decimal": cantidad máxima de decimales */
  @Input() kpDecimales = 2;

  constructor(private el: ElementRef<HTMLInputElement>) {}

  private limpiar(texto: string) {
    const re = PERMITIDOS[this.kpFiltro];
    return [...texto].filter(c => re.test(c)).join('');
  }

  @HostListener('beforeinput', ['$event'])
  antesDeEscribir(e: InputEvent) {
    if (!e.data || e.isComposing || e.inputType === 'insertCompositionText' || e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop') return;
    if (this.limpiar(e.data) !== e.data) { e.preventDefault(); return; }
    if (this.kpFiltro === 'decimal') {
      const actual = this.el.nativeElement.value;
      if (e.data.includes('.') && actual.includes('.')) { e.preventDefault(); return; }
      const [, dec] = actual.split('.');
      // en un <input type="number"> no hay posición del cursor: se limita al escribir al final
      if (dec !== undefined && dec.length >= this.kpDecimales && /\d/.test(e.data) && this.cursorAlFinal()) e.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  alPegar(e: ClipboardEvent) {
    const texto = e.clipboardData?.getData('text') ?? '';
    const limpio = this.limpiar(texto.trim());
    if (limpio === texto) return;
    e.preventDefault();
    const input = this.el.nativeElement;
    if (input.type === 'number') input.value = limpio;
    else input.setRangeText(limpio, input.selectionStart ?? input.value.length, input.selectionEnd ?? input.value.length, 'end');
    input.dispatchEvent(new Event('input', { bubbles: true })); // avisa a ngModel
  }

  @HostListener('drop', ['$event'])
  alSoltar(e: DragEvent) { e.preventDefault(); }

  /** Evita que la rueda del ratón cambie un número sin querer. */
  @HostListener('wheel')
  rueda() { if (this.el.nativeElement.type === 'number' && document.activeElement === this.el.nativeElement) this.el.nativeElement.blur(); }

  private cursorAlFinal() {
    const input = this.el.nativeElement;
    try { return input.selectionStart === null || input.selectionStart === input.value.length; } catch { return true; }
  }
}
