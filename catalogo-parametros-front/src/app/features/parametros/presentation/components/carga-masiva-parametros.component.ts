import { Component, EventEmitter, Output } from '@angular/core';
import { CargaMasivaParametrosService } from '../../infrastructure/carga-masiva-parametros.service';
import { CargaMasivaResultado } from '../../domain/carga-masiva-parametros';

@Component({
  selector: 'app-carga-masiva-parametros',
  template: `
    <div class="bulk-backdrop" (click)="closeOnBackdrop($event)">
      <section class="bulk-modal" role="dialog" aria-modal="true" aria-labelledby="bulk-title">
        <header class="bulk-header">
          <div><small>IMPORTAR EXCEL</small><h2 id="bulk-title">Carga masiva de parámetros</h2><p>Valida referencias, estados, fechas y asociaciones antes de guardar.</p></div>
          <button type="button" class="close" aria-label="Cerrar" (click)="closed.emit()">×</button>
        </header>
        <div class="bulk-steps"><span class="active">01 Plantilla</span><span [class.active]="file">02 Archivo</span><span [class.active]="resultado">03 Validación</span></div>
        <section class="bulk-card">
          <h3>1. Descarga la plantilla</h3>
          <p>La aplicación y el módulo deben existir. La funcionalidad puede reutilizarse o crearse; los demás catálogos también deben existir.</p>
          <button type="button" class="btn btn-secondary" [disabled]="busy" (click)="descargarPlantilla()">Descargar plantilla .xlsx</button>
        </section>
        <section class="bulk-card">
          <h3>2. Sube el archivo diligenciado</h3>
          <p>Máximo 5 MB y 1.000 filas. Conserva los encabezados y no uses fórmulas.</p>
          <input #fileInput type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" (change)="seleccionar($event)" [disabled]="busy">
          @if (file) { <div class="selected-file">✓ {{ file.name }} <button type="button" (click)="fileInput.value=''; file=null; resultado=null">Cambiar</button></div> }
          @if (fileError) { <div class="field-error">{{ fileError }}</div> }
          <button type="button" class="btn btn-primary" [disabled]="busy || !file || !!fileError" (click)="validar()">Validar archivo</button>
        </section>
        @if (resultado) {
          <section class="bulk-card" [class.valid]="resultado.ready" [class.invalid]="!resultado.ready">
            <div class="result-heading"><div><h3>{{ resultado.ready ? 'Archivo listo para cargar' : 'El archivo tiene errores' }}</h3><p>{{ resultado.ready ? 'No se detectaron referencias, fechas, estados ni duplicados inválidos.' : 'Corrige todos los errores antes de confirmar la carga.' }}</p></div><strong>{{ resultado.ready ? 'LISTO' : 'REVISAR' }}</strong></div>
            <div class="summary"><span><b>{{ resultado.totalFilas }}</b>Filas</span><span><b>{{ resultado.filasValidas }}</b>Válidas</span><span><b>{{ resultado.filasInvalidas }}</b>Con errores</span></div>
            @if (resultado.errores.length > 0) {
              <button type="button" class="link-button" [disabled]="busy" (click)="descargarReporte()">Descargar reporte de errores</button>
              <div class="error-table"><table><thead><tr><th>Fila</th><th>Campo</th><th>Código</th><th>Descripción</th></tr></thead><tbody>@for (error of resultado.errores; track error.fila + error.campo + error.codigo) {<tr><td>{{ error.fila || '—' }}</td><td>{{ error.campo }}</td><td>{{ error.codigo }}</td><td>{{ error.descripcion }}</td></tr>}</tbody></table></div>
            }
          </section>
        }
        @if (errorMessage) { <div class="field-error">{{ errorMessage }}</div> }
        <footer class="bulk-footer"><button type="button" class="btn btn-secondary" [disabled]="busy" (click)="closed.emit()">Cancelar</button><button type="button" class="btn btn-primary" [disabled]="busy || !puedeCargar" (click)="confirmar()">{{ busy ? 'Procesando...' : 'Confirmar carga' }}</button></footer>
      </section>
    </div>
  `,
  styles: [`
    .bulk-backdrop{position:fixed;inset:0;background:#0008;display:grid;place-items:center;padding:20px;z-index:1000}.bulk-modal{width:min(900px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:14px;padding:24px}.bulk-header,.result-heading{display:flex;justify-content:space-between;gap:16px}.bulk-header h2{margin:5px 0;font-size:22px}.bulk-header p,.bulk-card p{margin:4px 0;color:#64748b;font-size:12px}.close{border:0;background:0;font-size:26px;cursor:pointer}.bulk-steps{display:flex;padding:16px 0;color:#94a3b8;font-size:12px;font-weight:700}.bulk-steps .active{color:#2563eb}.bulk-card{border:1px solid #ddd;border-radius:10px;padding:16px;margin-bottom:12px}.bulk-card h3{margin:0;font-size:15px}.selected-file{display:flex;justify-content:space-between;background:#eff6ff;padding:9px;margin-bottom:12px;color:#1d4ed8;font-size:13px}.selected-file button,.link-button{border:0;background:0;color:#2563eb;text-decoration:underline;cursor:pointer}.btn{border:0;border-radius:6px;padding:9px 14px;font-weight:700;cursor:pointer;margin-top:12px}.btn:disabled{opacity:.5}.btn-primary{background:#2563eb;color:#fff}.btn-secondary{background:#e2e8f0;color:#334155}.valid{border-color:#86efac;background:#f0fdf4}.invalid{border-color:#fecaca;background:#fff7f7}.summary{display:flex;border:1px solid #ddd;margin-top:14px}.summary span{flex:1;padding:10px;border-right:1px solid #ddd;color:#64748b;font-size:12px}.link-button{margin-top:12px;padding:0}.error-table{overflow:auto;max-height:210px;margin-top:10px;border:1px solid #fecaca}table{border-collapse:collapse;width:100%;font-size:11px}th,td{text-align:left;padding:8px;border-bottom:1px solid #ddd;vertical-align:top}th{background:#f8fafc}.field-error{color:#b91c1c;background:#fef2f2;padding:10px;margin:10px 0;font-size:12px}.bulk-footer{display:flex;justify-content:flex-end;gap:10px}
  `]
})
export class CargaMasivaParametrosComponent {
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly completed = new EventEmitter<void>();
  file: File | null = null;
  resultado: CargaMasivaResultado | null = null;
  busy = false;
  errorMessage = '';

  constructor(private readonly service: CargaMasivaParametrosService) {}

  get puedeCargar(): boolean {
    return this.file !== null
      && this.resultado?.ready === true
      && this.resultado.filasInvalidas === 0
      && this.resultado.errores.length === 0;
  }

  get fileError(): string {
    if (!this.file) return '';
    if (!this.file.name.toLowerCase().endsWith('.xlsx')) return 'Selecciona un archivo .xlsx.';
    if (this.file.size > 5 * 1024 * 1024) return 'El archivo no puede superar 5 MB.';
    return '';
  }

  seleccionar(event: Event): void {
    this.file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.resultado = null;
    this.errorMessage = '';
  }

  descargarPlantilla(): void {
    this.busy = true;
    this.service.descargarPlantilla().subscribe({ next: blob => this.descargar(blob, 'plantilla-parametros.xlsx'), error: error => this.mostrarError(error), complete: () => this.busy = false });
  }

  validar(): void {
    if (!this.file || this.fileError) return;
    this.busy = true; this.errorMessage = '';
    this.service.validar(this.file).subscribe({ next: result => this.asignarResultado(result), error: error => this.mostrarError(error), complete: () => this.busy = false });
  }

  descargarReporte(): void {
    if (!this.file) return;
    this.busy = true;
    this.service.descargarReporte(this.file).subscribe({ next: blob => this.descargar(blob, 'reporte-errores-parametros.xlsx'), error: error => this.mostrarError(error), complete: () => this.busy = false });
  }

  confirmar(): void {
    if (!this.file || !this.resultado?.ready) return;
    this.busy = true; this.errorMessage = '';
    this.service.cargar(this.file).subscribe({ next: result => { this.asignarResultado(result); if (result.ready) { this.completed.emit(); this.closed.emit(); } }, error: error => this.mostrarError(error), complete: () => this.busy = false });
  }

  closeOnBackdrop(event: MouseEvent): void { if (event.target === event.currentTarget) this.closed.emit(); }
  private descargar(blob: Blob, name: string): void { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url); }
  private asignarResultado(result: CargaMasivaResultado): void {
    this.resultado = {
      ...result,
      ready: result.ready === true,
      errores: Array.isArray(result.errores) ? result.errores : []
    };
  }
  private mostrarError(error: Error): void { this.errorMessage = error.message || 'No fue posible procesar el archivo.'; this.busy = false; }
}
