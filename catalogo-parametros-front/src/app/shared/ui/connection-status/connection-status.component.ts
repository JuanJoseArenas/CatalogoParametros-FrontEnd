import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-connection-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="connection-status" [class.connected]="connected()" [class.disconnected]="!connected()">
      <span class="status-dot" [class.connected]="connected()" [class.disconnected]="!connected()"></span>
      {{ connected() ? 'En vivo' : 'Desconectado' }}
    </div>
  `
})
export class ConnectionStatusComponent {
  readonly connected = input(false);
}
