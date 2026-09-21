import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Funcionalidad } from '../../../funcionalidades/domain/funcionalidad';
import { TipoParametro } from '../../domain/parametro';

@Component({
  selector: 'app-parametro-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal">
        <div class="modal-header"><h3 class="modal-title">{{ editing() ? 'Editar' : 'Nuevo' }} Parametro</h3><button class="modal-close" (click)="cancel.emit()">&times;</button></div>
        <div class="modal-body">
          <form [formGroup]="form()" (ngSubmit)="save.emit()">
            <div class="form-group"><label class="form-label">Nombre</label><input class="form-control" formControlName="nombre" placeholder="Nombre del parametro"></div>
            <div class="form-group"><label class="form-label">Funcionalidad</label><select class="form-control" formControlName="idFuncionalidad"><option value="">Seleccione una funcionalidad</option>@for (item of funcionalidades(); track item.id) { <option [value]="item.id">{{ item.nombre }}</option> }</select></div>
            <div class="form-group"><label class="form-label">Tipo Parametro</label><select class="form-control" formControlName="idTipoParametro"><option value="">Seleccione un tipo</option>@for (item of tipos(); track item.id) { <option [value]="item.id">{{ item.nombre }}</option> }</select></div>
            <div class="form-group"><label class="form-label">Estado</label><select class="form-control" formControlName="activo"><option [value]="true">Activo</option><option [value]="false">Inactivo</option></select></div>
          </form>
        </div>
        <div class="modal-footer"><button class="btn btn-secondary" (click)="cancel.emit()">Cancelar</button><button class="btn btn-primary" (click)="save.emit()" [disabled]="form().invalid || saving()">{{ saving() ? 'Guardando...' : (editing() ? 'Actualizar' : 'Crear') }}</button></div>
      </div>
    </div>
  `
})
export class ParametroFormComponent {
  readonly form = input.required<FormGroup>();
  readonly funcionalidades = input.required<Funcionalidad[]>();
  readonly tipos = input.required<TipoParametro[]>();
  readonly editing = input(false);
  readonly saving = input(false);
  readonly save = output<void>();
  readonly cancel = output<void>();
  onOverlayClick(event: Event): void { if (event.target === event.currentTarget) this.cancel.emit(); }
}
