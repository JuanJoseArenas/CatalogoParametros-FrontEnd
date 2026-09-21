import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

export interface SelectOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-related-entity-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ editing() ? 'Editar' : createLabel() }} {{ entityLabel() }}</h3>
          <button class="modal-close" (click)="cancel.emit()">&times;</button>
        </div>
        <div class="modal-body">
          <form [formGroup]="form()" (ngSubmit)="save.emit()">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input class="form-control" formControlName="nombre" [placeholder]="'Nombre de ' + entityLabel().toLowerCase()">
            </div>
            <div class="form-group">
              <label class="form-label">{{ relationLabel() }}</label>
              <select class="form-control" [formControlName]="relationControl()">
                <option value="">Seleccione {{ relationArticle() }} {{ relationLabel().toLowerCase() }}</option>
                @for (option of options(); track option.id) {
                  <option [value]="option.id">{{ option.name }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Fecha Inicio</label>
              <input type="date" class="form-control" formControlName="fechaInicio">
            </div>
            <div class="form-group">
              <label class="form-label">Fecha Fin</label>
              <input type="date" class="form-control" formControlName="fechaFinal">
            </div>
            <div class="form-group">
              <label class="form-label">Estado</label>
              <select class="form-control" [formControlName]="activeControl()">
                <option [value]="true">{{ activeLabel() }}</option>
                <option [value]="false">{{ inactiveLabel() }}</option>
              </select>
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
export class RelatedEntityFormComponent {
  readonly form = input.required<FormGroup>();
  readonly options = input.required<SelectOption[]>();
  readonly entityLabel = input.required<string>();
  readonly relationLabel = input.required<string>();
  readonly relationControl = input.required<string>();
  readonly activeControl = input.required<string>();
  readonly editing = input(false);
  readonly saving = input(false);
  readonly createLabel = input('Nueva');
  readonly relationArticle = input('una');
  readonly activeLabel = input('Activa');
  readonly inactiveLabel = input('Inactiva');
  readonly save = output<void>();
  readonly cancel = output<void>();

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) this.cancel.emit();
  }
}
