import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MovementEntry } from '../../models/movement.model';

@Injectable({
  providedIn: 'root',
})
export class MovementService {
  constructor(private readonly http: HttpClient) {}

  getMovements(): Observable<MovementEntry[]> {
    return this.http.get<MovementEntry[]>('/mock-data/movements.json');
  }
}

