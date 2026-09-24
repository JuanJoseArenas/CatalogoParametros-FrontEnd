import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-organizacion-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ editing() ? 'Editar' : 'Nueva' }} Organizacion</h3>
          <button class="modal-close" (click)="cancel.emit()">&times;</button>
        </div>
        <div class="modal-body">
          <p class="field-help">Las fechas y horas se muestran en la zona horaria de su dispositivo.</p>
          <form [formGroup]="form()" (ngSubmit)="save.emit()">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input class="form-control" formControlName="nombre" placeholder="Nombre de la organizacion">
            </div>
            <div class="form-group">
              <label class="form-label">Fecha y hora de inicio</label>
              <input type="datetime-local" step="1" class="form-control" formControlName="fechaInicio">
            </div>
            <div class="form-group">
              <label class="form-label">Fecha y hora de fin</label>
              <input type="datetime-local" step="1" class="form-control" formControlName="fechaFinal">
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="cancel.emit()">Cancelar</button>
          <button class="btn btn-primary" (click)="save.emit()" [disabled]="form().invalid || saving()">
            {{ saving() ? 'Guardando...' : (editing() ? 'Actualizar' : 'Crear') }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class OrganizacionFormComponent {
  readonly form = input.required<FormGroup>();
  readonly editing = input(false);
  readonly saving = input(false);
  readonly save = output<void>();
  readonly cancel = output<void>();

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) this.cancel.emit();
  }
}
