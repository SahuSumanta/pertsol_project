import { Injectable } from '@angular/core';
import { LiveDataService } from './live-data.service';
import { Observable, map } from 'rxjs';
import { MovementEntry } from '../../models/movement.model';

export interface RepeatedCityPattern {
  city: string;
  visits: number;
}

export interface FastHopPattern {
  fromCity: string;
  toCity: string;
  fromTime: string;
  toTime: string;
}

export interface SuspiciousPatternsSummary {
  repeatedCities: RepeatedCityPattern[];
  fastHops: FastHopPattern[];
}

@Injectable({
  providedIn: 'root',
})
export class PatternAnalysisService {
  constructor(private readonly liveData: LiveDataService) {}

  getPatternsForSuspect(suspectId: string): Observable<SuspiciousPatternsSummary> {
    return this.liveData.getLiveMovements().pipe(
      map((all) =>
        all
          .filter((m) => m.suspectId === suspectId)
          .sort((a, b) => a.travelOrder - b.travelOrder),
      ),
      map((movements) => {
        const repeatedCities = this.computeRepeatedCities(movements);
        const fastHops = this.computeFastHops(movements);
        return { repeatedCities, fastHops };
      }),
    );
  }

  private computeRepeatedCities(movements: MovementEntry[]): RepeatedCityPattern[] {
    const counts = new Map<string, number>();
    movements.forEach((m) => {
      counts.set(m.city, (counts.get(m.city) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .filter(([, visits]) => visits > 1)
      .map(([city, visits]) => ({ city, visits }));
  }

  private computeFastHops(movements: MovementEntry[]): FastHopPattern[] {
    const fast: FastHopPattern[] = [];
    for (let i = 1; i < movements.length; i++) {
      const prev = movements[i - 1];
      const curr = movements[i];
      const dtHours =
        (new Date(curr.timestamp).getTime() -
          new Date(prev.timestamp).getTime()) /
        (1000 * 60 * 60);
      if (prev.city !== curr.city && dtHours > 0 && dtHours <= 4) {
        fast.push({
          fromCity: prev.city,
          toCity: curr.city,
          fromTime: prev.timestamp,
          toTime: curr.timestamp,
        });
      }
    }
    return fast;
  }
}

