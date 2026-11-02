import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TourStore } from '../../core/services/tour-store.service';
import { AlertService } from '../../core/services/alert.service';
import { IconComponent } from '../../shared/icon.component';
import { FiltroDirective } from '../../shared/filtro.directive';
import { FormValidacion, V } from '../../core/utils/validacion';
import { ModalComponent } from '../../shared/modal.component';

@Component({
  selector: 'app-recursos',
  standalone: true,
  imports: [FormsModule, IconComponent, FiltroDirective, ModalComponent],
  templateUrl: './recursos.component.html',
  styleUrl: './recursos.component.css'
})
export class RecursosComponent {
  store = inject(TourStore);
  private alerts = inject(AlertService);

  tab = signal<'guias' | 'transporte'>('guias');
  abierto = signal(false);
  editId: number | null = null;
  guia = { nombreCompleto: '', especialidad: '', telefono: '' };
  transp = { placa: '', marcaModelo: '', capacidad: 10 as number | null };
  v = new FormValidacion<'gNombre' | 'gEspecialidad' | 'gTelefono' | 'tPlaca' | 'tMarca' | 'tCapacidad'>(() => this.tab() === 'guias'
    ? {
        gNombre: V.nombrePersona(this.guia.nombreCompleto),
        gEspecialidad: V.texto(this.guia.especialidad, 'La especialidad', 100),
        gTelefono: V.telefono(this.guia.telefono)
      }
    : {
        tPlaca: V.placa(this.transp.placa),
        tMarca: V.texto(this.transp.marcaModelo, 'La marca/modelo', 100),
        tCapacidad: V.entero(this.transp.capacidad, 'La capacidad', 1, 999)
      });

  nuevo() {
    this.editId = null;
    this.guia = { nombreCompleto: '', especialidad: '', telefono: '' };
    this.transp = { placa: '', marcaModelo: '', capacidad: 10 };
    this.v.reiniciar();
    this.abierto.set(true);
  }

  editarGuia(id: number) {
    const { guiaId, ...resto } = this.store.getGuia(id)!;
    this.editId = guiaId; this.guia = { ...resto }; this.v.reiniciar(); this.abierto.set(true);
  }

  editarTransporte(id: number) {
    const { transporteId, ...resto } = this.store.getTransporte(id)!;
    this.editId = transporteId; this.transp = { ...resto }; this.v.reiniciar(); this.abierto.set(true);
  }

  async guardar() {
    if (this.store.ocupado()) return;
    if (!this.v.valido()) { this.alerts.toast('Revisa los campos marcados en rojo', 'error'); return; }
    if (this.tab() === 'guias') {
      const g = this.guia;
      const res = await this.store.guardarGuia({ nombreCompleto: g.nombreCompleto.trim(), especialidad: g.especialidad.trim(), telefono: g.telefono.trim() }, this.editId ?? undefined);
      if (!res.ok) { this.alerts.error(res.error!); return; }
    } else {
      const t = this.transp;
      const res = await this.store.guardarTransporte({ placa: t.placa.trim(), marcaModelo: t.marcaModelo.trim(), capacidad: t.capacidad! }, this.editId ?? undefined);
      if (!res.ok) { this.alerts.error(res.error!); return; }
    }
    this.abierto.set(false);
    this.alerts.toast('Guardado');
  }

  async eliminarGuia(id: number) {
    if (!(await this.alerts.confirm('Esta acción no se puede deshacer.', 'Eliminar guía'))) return;
    const res = await this.store.eliminarGuia(id);
    if (!res.ok) this.alerts.error(res.error!); else this.alerts.toast('Guía eliminado');
  }

  async eliminarTransporte(id: number) {
    if (!(await this.alerts.confirm('Esta acción no se puede deshacer.', 'Eliminar transporte'))) return;
    const res = await this.store.eliminarTransporte(id);
    if (!res.ok) this.alerts.error(res.error!); else this.alerts.toast('Transporte eliminado');
  }
}
