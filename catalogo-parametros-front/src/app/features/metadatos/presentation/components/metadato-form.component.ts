import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Parametro } from '../../../parametros/domain/parametro';
import { TipoMetadato } from '../../domain/metadato';

@Component({
  selector: 'app-metadato-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)"><div class="modal">
      <div class="modal-header"><h3 class="modal-title">{{ editing() ? 'Editar' : 'Nuevo' }} Metadato</h3><button class="modal-close" (click)="cancel.emit()">&times;</button></div>
      <div class="modal-body"><form [formGroup]="form()" (ngSubmit)="save.emit()">
        <div class="form-group"><label class="form-label">Parámetro</label><select class="form-control" formControlName="idParametro"><option value="">Seleccione un parámetro</option>@for (item of parametros(); track item.id) { <option [value]="item.id">{{ item.nombre }}</option> }</select></div>
        <div class="form-group"><label class="form-label">Tipo de Metadato</label><select class="form-control" formControlName="idTipoMetadato" (change)="typeChange.emit()"><option value="">Seleccione un tipo</option>@for (item of tipos(); track item.id) { <option [value]="item.id">{{ item.tipo }}{{ item.detalle ? ' - ' + item.detalle : '' }}</option> }</select></div>
        <div class="form-group"><label class="form-label">Valor</label>
          @if (selectedType() === 'json') { <textarea class="form-control value-input" formControlName="valor" placeholder='Ejemplo: {"propiedad":"valor"} o ["valor1","valor2"]'></textarea> }
          @if (selectedType() === 'date') { <input type="date" class="form-control" formControlName="valor"> }
          @if (selectedType() !== 'json' && selectedType() !== 'date') { <input class="form-control" formControlName="valor" [placeholder]="selectedType() === 'alfanumerico' ? 'Ingrese un valor alfanumérico' : 'Seleccione primero un tipo de metadato'"> }
          @if (selectedType() === 'json') { <small class="field-help">Debe ser un objeto o un arreglo JSON válido.</small> }
          @if (selectedType() === 'date') { <small class="field-help">La fecha se enviará en formato yyyy-MM-dd.</small> }
          @if (selectedType() === 'alfanumerico') { <small class="field-help">El valor se enviará como una cadena de texto.</small> }
        </div>
      </form></div>
      <div class="modal-footer"><button class="btn btn-secondary" (click)="cancel.emit()">Cancelar</button><button class="btn btn-primary" (click)="save.emit()" [disabled]="form().invalid || saving()">{{ saving() ? 'Guardando...' : (editing() ? 'Actualizar' : 'Crear') }}</button></div>
    </div></div>
  `,
  styles: [`.value-input { min-height: 130px; resize: vertical; font-family: monospace; } .field-help { display: block; margin-top: 6px; color: #64748b; font-size: .8rem; }`]
})
export class MetadatoFormComponent {
  readonly form = input.required<FormGroup>();
  readonly parametros = input.required<Parametro[]>();
  readonly tipos = input.required<TipoMetadato[]>();
  readonly selectedType = input('');
  readonly editing = input(false);
  readonly saving = input(false);
  readonly save = output<void>();
  readonly cancel = output<void>();
  readonly typeChange = output<void>();
  onOverlayClick(event: Event): void { if (event.target === event.currentTarget) this.cancel.emit(); }
}
