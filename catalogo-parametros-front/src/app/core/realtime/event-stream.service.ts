import { Injectable } from '@angular/core';
import { Observable, retry, timer } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventStreamService {
  connect<T>(url: string, eventName: string, onConnectionChange?: (connected: boolean) => void): Observable<T> {
    return new Observable<T>(observer => {
      const source = new EventSource(url, { withCredentials: true });
      source.onopen = () => onConnectionChange?.(true);
      source.addEventListener(eventName, event => {
        try {
          observer.next(JSON.parse((event as MessageEvent<string>).data) as T);
        } catch (error) {
          observer.error(error);
        }
      });
      source.onerror = () => { onConnectionChange?.(false); observer.error(new Error('SSE connection error')); };
      return () => source.close();
    }).pipe(retry({ resetOnSuccess: true, delay: (_error, intento) => timer(Math.min(1000 * 2 ** Math.min(intento, 5), 30000)) }));
  }
}
