import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PoliceStation } from '../../models/police.model';

@Injectable({
  providedIn: 'root',
})
export class PoliceService {
  constructor(private readonly http: HttpClient) {}

  getPoliceStations(): Observable<PoliceStation[]> {
    return this.http.get<PoliceStation[]>('/mock-data/police-stations.json');
  }
}

