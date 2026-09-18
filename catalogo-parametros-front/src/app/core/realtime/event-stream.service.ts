import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventStreamService {
  connect<T>(url: string, eventName: string): Observable<T> {
    return new Observable<T>(observer => {
      const source = new EventSource(url);
      source.addEventListener(eventName, event => {
        try {
          observer.next(JSON.parse((event as MessageEvent<string>).data) as T);
        } catch (error) {
          observer.error(error);
        }
      });
      source.onerror = () => observer.error(new Error('SSE connection error'));
      return () => source.close();
    });
  }
}
