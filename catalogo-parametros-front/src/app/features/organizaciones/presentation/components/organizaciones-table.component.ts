import { mostrarFechaLocal } from '../../../../shared/utils/date.utils';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Organizacion } from '../../domain/organizacion';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';

@Component({
  selector: 'app-organizaciones-table',
  imports: [PaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Lista de Organizaciones</h2>
        <span style="font-size: 0.85rem; color: #64748b; font-weight: 500;">
          {{ organizaciones().length }} registro(s) en pagina {{ page() }}
        </span>
      </div>

      @if (organizaciones().length > 0) {
        <div class="table-container">
          <table>
            <thead>
              <tr><th>Nombre</th><th>Fecha Inicio</th><th>Fecha Fin</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              @for (organizacion of organizaciones(); track organizacion.id) {
                <tr>
                  <td>{{ organizacion.nombre }}</td>
                  <td>{{ mostrarFechaLocal(organizacion.fechaInicio) }}</td>
                  <td>{{ mostrarFechaLocal(organizacion.fechaFinal) }}</td>
                  <td>
                    <button class="btn btn-warning btn-sm" (click)="edit.emit(organizacion)">Editar</button>
                    <button class="btn btn-danger btn-sm" (click)="remove.emit(organizacion.id)">Eliminar</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (!loading()) {
        <div class="empty-state">
          <div class="empty-state-icon">🏢</div>
          <h3>No hay organizaciones</h3>
          <p>Comienza creando una nueva organizacion</p>
        </div>
      }

      @if (loading()) {
        <div class="loading"><div class="spinner"></div></div>
      }

      @if (!loading() && totalOnPage() > 0) {
        <app-pagination
          [page]="page()"
          [hasNext]="totalOnPage() >= pageSize()"
          (pageChange)="pageChange.emit($event)"
        />
      }
    </div>
  `
})
export class OrganizacionesTableComponent {
  readonly mostrarFechaLocal = mostrarFechaLocal;
  readonly organizaciones = input.required<Organizacion[]>();
  readonly loading = input(false);
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalOnPage = input.required<number>();
  readonly edit = output<Organizacion>();
  readonly remove = output<string>();
  readonly pageChange = output<number>();
}
