import { Component, Input } from '@angular/core';

/**
 * Isotipo KAMPU (una "K" atravesada por un camino) y logotipo "Kampu" con hoja.
 * variante: 'isotipo' | 'horizontal' | 'vertical'. oscuro = versión para fondos oscuros.
 * alto = alto del isotipo en px.
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.css'
})
export class LogoComponent {
  @Input() variante: 'isotipo' | 'horizontal' | 'vertical' = 'horizontal';
  @Input() oscuro = false;
  @Input() alto = 32;
  /** Color del isotipo (para usar el logo sobre fotografías) */
  @Input() colorCarpa?: string;

  // verde oliva de la marca; sobre fondos oscuros se usa el crema
  get marca() { return this.colorCarpa ?? (this.oscuro ? '#FDF8E6' : '#4B5B1D'); }
  get texto() { return this.oscuro ? '#FDF8E6' : '#4B5B1D'; }
}
