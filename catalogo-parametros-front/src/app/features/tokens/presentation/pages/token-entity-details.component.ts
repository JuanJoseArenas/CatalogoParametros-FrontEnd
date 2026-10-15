import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { JsonPipe, KeyValuePipe } from '@angular/common';
@Component({
  selector: 'app-token-entity-details',
  imports: [JsonPipe, KeyValuePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<section><h4>{{ title }}</h4>
    @if (data) { <dl>@for (field of fields | keyvalue; track field.key) {
      <dt>{{ labels[field.key] || field.key }}</dt><dd>@if (field.value === null || field.value === undefined) { Sin información } @else if (isObject(field.value)) { <pre>{{ field.value | json }}</pre> } @else { {{ format(field.value) }} }</dd>
    }</dl> } @else { <p>Sin información disponible.</p> }
  </section>`,
  styles: [`section { border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin:12px 0; } dl { display:grid; grid-template-columns:minmax(100px, 1fr) minmax(0, 3fr); gap:8px 16px; } dt { font-weight:600; } dd { margin:0; overflow-wrap:anywhere; white-space:pre-wrap; } pre { white-space:pre-wrap; overflow-wrap:anywhere; margin:0; } @media(max-width:600px) { dl { grid-template-columns:1fr; } }`]
})
export class TokenEntityDetailsComponent {
  @Input() title = '';
  @Input() data: object | null = null;
  get fields(): Record<string, unknown> { return Object.fromEntries(Object.entries(this.data ?? {}).filter(([key]) => !/^id(?:$|[A-Z_])/.test(key))); }
  readonly labels: Record<string,string> = { parametro:'Parámetro', ambiente:'Ambiente', estado:'Estado', nombre:'Nombre', idOrganizacion:'ID de organización', activa:'Activa', activo:'Activo', fechaInicio:'Fecha de inicio', fechaFinal:'Fecha final', idFuncionalidad:'ID de funcionalidad', idTipoParametro:'ID de tipo de parámetro', idModulo:'ID de módulo', idAplicacion:'ID de aplicación', idParametro:'ID de parámetro', idTipoMetadato:'ID de tipo de metadato', valor:'Valor', tipo:'Tipo', detalle:'Detalle', idAmbiente:'ID de ambiente', idEstadoMetadatoAmbiente:'ID de estado' };
  isObject(value: unknown) { return typeof value === 'object'; }
  format(value: unknown) { return typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value); }
}
