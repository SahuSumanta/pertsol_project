import { Injectable } from '@angular/core';
import { MovementEntry } from '../../models/movement.model';
import { PoliceStation } from '../../models/police.model';

export interface PredictedLocation {
  city: string;
  lat: number;
  lng: number;
  confidence: number;
  reason: string;
}

export interface NearestStation {
  station: PoliceStation;
  distanceKm: number;
}

@Injectable({ providedIn: 'root' })
export class PredictionService {
  predictNextLocation(movements: MovementEntry[]): PredictedLocation | null {
    if (movements.length < 2) return null;

    const sorted = [...movements].sort((a, b) => a.travelOrder - b.travelOrder);
    const lastCity = sorted[sorted.length - 1].city;

    const cityTransitions = new Map<string, Map<string, number>>();
    for (let i = 0; i < sorted.length - 1; i++) {
      const from = sorted[i].city;
      const to = sorted[i + 1].city;
      if (!cityTransitions.has(from)) cityTransitions.set(from, new Map());
      const transitions = cityTransitions.get(from)!;
      transitions.set(to, (transitions.get(to) ?? 0) + 1);
    }

    const candidates = cityTransitions.get(lastCity);
    if (!candidates || candidates.size === 0) {
      return this.fallbackPrediction(sorted, lastCity);
    }

    let bestCity = '';
    let bestCount = 0;
    candidates.forEach((count, city) => {
      if (count > bestCount) {
        bestCount = count;
        bestCity = city;
      }
    });

    if (!bestCity) return this.fallbackPrediction(sorted, lastCity);

    const total = Array.from(candidates.values()).reduce((s, v) => s + v, 0);
    const confidence = Math.round((bestCount / total) * 100);
    const coords = this.getCityCoords(bestCity, sorted);

    return {
      city: bestCity,
      lat: coords.lat,
      lng: coords.lng,
      confidence,
      reason: `Based on ${bestCount} previous transition(s) from ${lastCity}`,
    };
  }

  findNearestStation(
    lat: number,
    lng: number,
    stations: PoliceStation[],
  ): NearestStation | null {
    if (!stations.length) return null;

    let nearest: PoliceStation | null = null;
    let minDist = Infinity;

    stations.forEach((s) => {
      const d = this.haversine(lat, lng, s.latitude, s.longitude);
      if (d < minDist) {
        minDist = d;
        nearest = s;
      }
    });

    return nearest ? { station: nearest, distanceKm: Math.round(minDist * 10) / 10 } : null;
  }

  private fallbackPrediction(sorted: MovementEntry[], lastCity: string): PredictedLocation | null {
    const freq = new Map<string, number>();
    sorted.forEach((m) => {
      if (m.city !== lastCity) {
        freq.set(m.city, (freq.get(m.city) ?? 0) + 1);
      }
    });

    let bestCity = '';
    let bestCount = 0;
    freq.forEach((count, city) => {
      if (count > bestCount) {
        bestCount = count;
        bestCity = city;
      }
    });

    if (!bestCity) return null;

    const coords = this.getCityCoords(bestCity, sorted);
    return {
      city: bestCity,
      lat: coords.lat,
      lng: coords.lng,
      confidence: Math.min(Math.round((bestCount / sorted.length) * 100), 75),
      reason: `Most frequently visited city (${bestCount} visits)`,
    };
  }

  private getCityCoords(city: string, movements: MovementEntry[]): { lat: number; lng: number } {
    const match = movements.find((m) => m.city === city);
    return match ? { lat: match.latitude, lng: match.longitude } : { lat: 20.5937, lng: 78.9629 };
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
