import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TourStore } from '../../core/services/tour-store.service';
import { AlertService } from '../../core/services/alert.service';
import { ImagenService } from '../../core/services/imagen.service';
import { PaqueteTour } from '../../core/models';
import { hoy } from '../../core/utils/date.util';
import { BadgeComponent } from '../../shared/badge.component';
import { IconComponent } from '../../shared/icon.component';
import { FiltroDirective } from '../../shared/filtro.directive';
import { FormValidacion, V } from '../../core/utils/validacion';
import { LogoComponent } from '../../shared/logo.component';
import { ModalComponent } from '../../shared/modal.component';

@Component({
  selector: 'app-paquetes',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, BadgeComponent, IconComponent, FiltroDirective, LogoComponent, ModalComponent],
  templateUrl: './paquetes.component.html',
  styleUrl: './paquetes.component.css'
})
export class PaquetesComponent {
  private store = inject(TourStore);
  private alerts = inject(AlertService);
  imagenes = inject(ImagenService);

  private gradientes = [
    'from-zinc-800 to-zinc-900', 'from-brand-500 to-brand-700', 'from-earth-500 to-earth-700',
    'from-emerald-600 to-zinc-900', 'from-brand-600 to-zinc-900', 'from-earth-400 to-zinc-900'
  ];

  texto = signal('');
  abierto = signal(false);
  nuevaImagen = signal<string | null>(null); // imagen elegida, aún sin guardar
  quitar = signal(false);
  editId: number | null = null;
  form: Omit<PaqueteTour, 'paqueteId'> = this.vacio();
  v = new FormValidacion<'nombre' | 'descripcion' | 'dias' | 'noches' | 'precio'>(() => ({
    nombre: V.texto(this.form.nombre, 'El nombre', 100, true),
    descripcion: (this.form.descripcion ?? '').length > 1000 ? 'La descripción admite máximo 1000 caracteres.' : null,
    dias: V.entero(this.form.dias, 'Los días', 1, 99),
    noches: V.entero(this.form.noches, 'Las noches', 0, 99)
      ?? (this.form.noches > this.form.dias ? 'Las noches no pueden ser más que los días.' : null),
    precio: V.importe(this.form.precioBase, 'El precio base')
  }));

  private vacio(): Omit<PaqueteTour, 'paqueteId'> {
    return { nombre: '', descripcion: '', precioBase: 0, dias: 1, noches: 0, imagen: '', estado: 'ACTIVO' };
  }

  filas = computed(() => {
    const t = this.texto().toLowerCase().trim();
    const hoyStr = hoy();
    return this.store.paquetes()
      .filter(p => !t || p.nombre.toLowerCase().includes(t) || p.descripcion.toLowerCase().includes(t))
      .map(p => ({
        paquete: p,
        gradiente: this.gradientes[p.paqueteId % this.gradientes.length],
        proximas: this.store.salidasDe(p.paqueteId)
          .filter(s => (s.estado === 'PROGRAMADA' || s.estado === 'CONFIRMADA') && s.fechaInicio >= hoyStr && s.cuposDisponibles > 0).length
      }));
  });

  /** Imagen que se muestra en el formulario: la recién elegida o la ya guardada */
  get vistaPrevia(): string | null {
    if (this.quitar()) return null;
    return this.nuevaImagen() ?? this.imagenes.url(this.form.imagen);
  }

  async elegir(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // permite volver a elegir el mismo archivo
    if (file) await this.procesar(file);
  }

  async soltar(ev: DragEvent) {
    ev.preventDefault();
    const file = ev.dataTransfer?.files?.[0];
    if (file) await this.procesar(file);
  }

  private async procesar(file: File) {
    try {
      this.nuevaImagen.set(await this.imagenes.comprimir(file));
      this.quitar.set(false);
    } catch (e) {
      this.alerts.error((e as Error).message);
    }
  }

  quitarImagen() { this.nuevaImagen.set(null); this.quitar.set(true); }

  nuevo() { this.editId = null; this.form = this.vacio(); this.reiniciarImagen(); this.v.reiniciar(); this.abierto.set(true); }

  private reiniciarImagen() { this.nuevaImagen.set(null); this.quitar.set(false); }

  editar(id: number) {
    const { paqueteId, ...resto } = this.store.getPaquete(id)!;
    this.editId = paqueteId;
    this.form = { ...resto, imagen: this.imagenes.url(resto.imagen) ? resto.imagen : '' };
    this.reiniciarImagen();
    this.v.reiniciar();
    this.abierto.set(true);
  }

  /** Al crear: las noches se sugieren como días - 1 */
  sugerirNoches() {
    if (!this.editId && this.form.dias >= 1) this.form.noches = this.form.dias - 1;
  }

  async guardar() {
    if (this.store.ocupado()) return;
    const f = this.form;
    if (!this.v.valido()) { this.alerts.toast('Revisa los campos marcados en rojo', 'error'); return; }

    // Imagen: se sube al backend y la ruta resultante es lo que se guarda en la columna IMAGEN.
    // El backend borra el archivo anterior cuando la imagen cambia o se quita.
    let imagen = f.imagen;
    const nueva = this.nuevaImagen();
    if (nueva) {
      const r = await this.imagenes.guardar(nueva);
      if (!r.ok) { this.alerts.error(r.error!); return; }
      imagen = r.data!;
    } else if (this.quitar()) {
      imagen = '';
    }
    const res = await this.store.guardarPaquete({ ...f, nombre: f.nombre.trim(), descripcion: (f.descripcion ?? '').trim(), imagen }, this.editId ?? undefined);
    if (!res.ok) { this.alerts.error(res.error!); return; }
    this.abierto.set(false);
    this.alerts.toast(this.editId ? 'Paquete actualizado' : 'Paquete creado');
  }

  async eliminar(id: number) {
    if (!(await this.alerts.confirm('Esta acción no se puede deshacer.', 'Eliminar paquete'))) return;
    const res = await this.store.eliminarPaquete(id);
    if (!res.ok) { this.alerts.error(res.error!); return; }
    this.alerts.toast('Paquete eliminado');
  }
}
