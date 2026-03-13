import { Injectable } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { LiveDataService } from './live-data.service';
import { EventService } from './event.service';
import { MovementEntry } from '../../models/movement.model';

export interface SuspectIntelStats {
  totalMovements: number;
  citiesVisited: number;
  eventsRecorded: number;
  totalDistanceKm: number;
  topCity?: string;
  topCityVisits?: number;
}

@Injectable({
  providedIn: 'root',
})
export class IntelService {
  constructor(
    private readonly liveData: LiveDataService,
    private readonly eventService: EventService,
  ) {}

  getStatsForSuspect(suspectId: string): Observable<SuspectIntelStats> {
    const movements$ = this.liveData.getLiveMovements();
    const events$ = this.eventService.getEvents();

    return combineLatest([movements$, events$]).pipe(
      map(([movements, events]) => {
        const forSuspect = movements
          .filter((m) => m.suspectId === suspectId)
          .sort((a, b) => a.travelOrder - b.travelOrder);

        const totalMovements = forSuspect.length;
        const citySet = new Set(forSuspect.map((m) => m.city));
        const eventsForSuspect = events.filter(
          (e) => e.suspectId === suspectId,
        );

        const totalDistanceKm = this.computeTotalDistanceKm(forSuspect);
        const { topCity, topCityVisits } = this.computeTopCity(forSuspect);

        return {
          totalMovements,
          citiesVisited: citySet.size,
          eventsRecorded: eventsForSuspect.length,
          totalDistanceKm,
          topCity,
          topCityVisits,
        };
      }),
    );
  }

  private computeTotalDistanceKm(movements: MovementEntry[]): number {
    if (movements.length < 2) {
      return 0;
    }
    let total = 0;
    for (let i = 1; i < movements.length; i++) {
      const a = movements[i - 1];
      const b = movements[i];
      total += this.haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
    }
    return Math.round(total);
  }

  private computeTopCity(
    movements: MovementEntry[],
  ): { topCity?: string; topCityVisits?: number } {
    const counts = new Map<string, number>();
    movements.forEach((m) => {
      counts.set(m.city, (counts.get(m.city) ?? 0) + 1);
    });
    let topCity: string | undefined;
    let topVisits = 0;
    counts.forEach((visits, city) => {
      if (visits > topVisits) {
        topVisits = visits;
        topCity = city;
      }
    });
    return topCity ? { topCity, topCityVisits: topVisits } : {};
  }

  private haversineKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

