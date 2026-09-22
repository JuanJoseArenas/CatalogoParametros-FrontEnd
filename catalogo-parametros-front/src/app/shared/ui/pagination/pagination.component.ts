import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pagination">
      <button class="btn btn-secondary btn-sm" (click)="select(page() - 1)" [disabled]="page() <= 1">
        Anterior
      </button>
      <span style="font-size: 0.9rem; color: #334155; font-weight: 600;">Página {{ page() }}</span>
      <button class="btn btn-secondary btn-sm" (click)="select(page() + 1)" [disabled]="!hasNext()">
        Siguiente
      </button>
    </div>
  `,
  styles: [`
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px 0;
    }
  `]
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly hasNext = input(false);
  readonly pageChange = output<number>();

  select(page: number): void {
    if (page >= 1) this.pageChange.emit(page);
  }
}
