import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CellTower } from '../../models/cell-tower.model';

@Injectable({
  providedIn: 'root',
})
export class CellTowerService {
  constructor(private readonly http: HttpClient) {}

  getCellTowers(): Observable<CellTower[]> {
    return this.http.get<CellTower[]>('/mock-data/cell-towers.json');
  }
}
