import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-messages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (error()) {
      <div class="card">
        <div class="alert alert-error">{{ error() }}</div>
      </div>
    }

    @if (success()) {
      <div class="card">
        <div class="alert alert-success">{{ success() }}</div>
      </div>
    }
  `
})
export class PageMessagesComponent {
  readonly error = input<string | null>('');
  readonly success = input<string | null>('');
}
