import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InvestigationEvent } from '../../models/event.model';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  constructor(private readonly http: HttpClient) {}

  getEvents(): Observable<InvestigationEvent[]> {
    return this.http.get<InvestigationEvent[]>('/mock-data/events.json');
  }
}

