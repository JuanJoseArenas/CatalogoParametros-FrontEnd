import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SseService {
  connect(url: string, eventName: string): Observable<any> {
    return new Observable(observer => {
      const eventSource = new EventSource(url);
      let connected = false;

      eventSource.addEventListener(eventName, (event: MessageEvent) => {
        connected = true;
        try {
          const data = JSON.parse(event.data);
          observer.next(data);
        } catch (e) {
          console.error('Error parsing SSE data:', e);
        }
      });

      eventSource.onopen = () => {
        connected = true;
      };

      eventSource.onerror = () => {
        connected = false;
        observer.error(new Error('SSE connection error'));
      };

      return () => {
        eventSource.close();
      };
    });
  }
}
