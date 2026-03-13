import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, map, take, withLatestFrom } from 'rxjs';
import { MovementService } from './movement.service';
import { SuspectService } from './suspect.service';
import { MovementEntry } from '../../models/movement.model';
import { Suspect } from '../../models/suspect.model';

interface CityCoord {
  city: string;
  latitude: number;
  longitude: number;
}

@Injectable({ providedIn: 'root' })
export class LiveDataService {
  private readonly movementsSubject = new BehaviorSubject<MovementEntry[]>([]);
  readonly movements$ = this.movementsSubject.asObservable();

  private cities: CityCoord[] = [];

  constructor(
    private readonly movementService: MovementService,
    private readonly suspectService: SuspectService,
  ) {
    // Seed from static JSON once
    this.movementService.getMovements().pipe(take(1)).subscribe((base) => {
      this.movementsSubject.next(base);
      this.cities = this.buildCityIndex(base);
    });

    // Start simulation
    interval(7000)
      .pipe(withLatestFrom(this.suspectService.getSuspects()))
      .subscribe(([tick, suspects]) => {
        if (!suspects.length || !this.cities.length) return;
        this.generateMovementTick(suspects, tick);
      });
  }

  getLiveMovements() {
    return this.movements$;
  }

  private buildCityIndex(movements: MovementEntry[]): CityCoord[] {
    const mapCity = new Map<string, CityCoord>();
    movements.forEach((m) => {
      if (!mapCity.has(m.city)) {
        mapCity.set(m.city, {
          city: m.city,
          latitude: m.latitude,
          longitude: m.longitude,
        });
      }
    });
    return Array.from(mapCity.values());
  }

  private generateMovementTick(suspects: Suspect[], tick: number): void {
    const current = this.movementsSubject.value;
    if (!current.length) return;

    // Choose a suspect weighted towards higher risk
    const pool: Suspect[] = [];
    suspects.forEach((s) => {
      const weight = s.riskLevel === 'high' ? 3 : s.riskLevel === 'medium' ? 2 : 1;
      for (let i = 0; i < weight; i++) pool.push(s);
    });
    const suspect = pool[Math.floor(Math.random() * pool.length)];
    if (!suspect) return;

    const byThis = current.filter((m) => m.suspectId === suspect.id);
    const lastForSuspect =
      byThis.length > 0
        ? byThis.reduce((a, b) => (a.travelOrder > b.travelOrder ? a : b))
        : null;

    // Choose next city: either repeat or move to another node from city index
    const baseCity = lastForSuspect?.city ?? this.cities[0].city;
    const candidates = this.cities.filter((c) => c.city !== baseCity);
    const nextCity =
      candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : this.cities[0];

    const newOrder = (lastForSuspect?.travelOrder ?? 0) + 1;
    const now = new Date();
    const newMovement: MovementEntry = {
      id: `live-${suspect.id}-${now.getTime()}`,
      suspectId: suspect.id,
      timestamp: now.toISOString(),
      latitude: nextCity.latitude,
      longitude: nextCity.longitude,
      city: nextCity.city,
      travelOrder: newOrder,
      // connectedTowerId left undefined; MapService still renders fine
    };

    this.movementsSubject.next([...current, newMovement]);
  }
}

