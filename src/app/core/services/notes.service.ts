import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InvestigationNote } from '../../models/note.model';

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  constructor(private readonly http: HttpClient) {}

  getNotes(): Observable<InvestigationNote[]> {
    return this.http.get<InvestigationNote[]>('/mock-data/notes.json');
  }
}

