import { Injectable } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { LiveDataService } from './live-data.service';
import { DigitalIntelService } from './digital-intel.service';
import { NetworkService, SuspectNode } from './network.service';
import { MovementEntry } from '../../models/movement.model';
import { CallLog, InterceptedMessage } from '../../models/digital-intel.model';

export interface CityThreat {
  city: string;
  lat: number;
  lng: number;
  threatScore: number;
  reasons: string[];
}

@Injectable({ providedIn: 'root' })
export class ThreatForecastService {
  private readonly crimeZones = new Set<string>([
    'Delhi',
    'Mumbai',
    'Kolkata',
    'Hyderabad',
    'Bangalore',
  ]);

  constructor(
    private readonly liveData: LiveDataService,
    private readonly digitalIntel: DigitalIntelService,
    private readonly networkService: NetworkService,
  ) {}

  getForecastForSuspect(suspectId: string): Observable<CityThreat[]> {
    const movements$ = this.liveData.getLiveMovements();
    const calls$ = this.digitalIntel.getCallLogs(suspectId);
    const messages$ = this.digitalIntel.getMessages(suspectId);
    const network$ = this.networkService.getNetwork(suspectId);

    return combineLatest([movements$, calls$, messages$, network$]).pipe(
      map(([movements, calls, messages, network]) =>
        this.computeCityThreats(
          suspectId,
          movements.filter((m) => m.suspectId === suspectId),
          calls,
          messages,
          network,
        ),
      ),
    );
  }

  private computeCityThreats(
    suspectId: string,
    movements: MovementEntry[],
    calls: CallLog[],
    messages: InterceptedMessage[],
    network: SuspectNode[],
  ): CityThreat[] {
    if (!movements.length) return [];

    const last = [...movements].sort((a, b) => a.travelOrder - b.travelOrder).at(-1)!;

    const byCity = new Map<
      string,
      { lat: number; lng: number; visits: number; recentWeight: number }
    >();

    movements.forEach((m, idx) => {
      const prev = byCity.get(m.city) ?? {
        lat: m.latitude,
        lng: m.longitude,
        visits: 0,
        recentWeight: 0,
      };
      prev.visits += 1;
      const recencyFactor = (idx + 1) / movements.length;
      prev.recentWeight += recencyFactor;
      byCity.set(m.city, prev);
    });

    const encryptedCities = new Set<string>();
    messages.forEach((msg) => {
      if (msg.encrypted) {
        const lower = msg.content.toLowerCase();
        for (const city of byCity.keys()) {
          if (lower.includes(city.toLowerCase())) {
            encryptedCities.add(city);
          }
        }
      }
    });

    const associateCities = new Set<string>();
    const currentNode = network.find((n) => n.id === suspectId);
    if (currentNode?.connections?.length) {
      const associates = network.filter((n) =>
        currentNode.connections.includes(n.id),
      );
      associates.forEach((a) => {
        movements
          .filter((m) => m.suspectId === a.id)
          .forEach((m) => associateCities.add(m.city));
      });
    }

    const result: CityThreat[] = [];

    byCity.forEach((agg, city) => {
      let score = 0;
      const reasons: string[] = [];

      const visitScore = Math.min(30, agg.visits * 5);
      if (visitScore > 0) {
        score += visitScore;
        reasons.push(`Frequent visits (${agg.visits})`);
      }

      const recentScore = Math.round(agg.recentWeight * 10);
      if (recentScore > 0) {
        score += recentScore;
        reasons.push('Recent activity');
      }

      if (encryptedCities.has(city)) {
        score += 20;
        reasons.push('Encrypted messages referencing city');
      }

      if (this.crimeZones.has(city)) {
        score += 15;
        reasons.push('Known crime zone');
      }

      if (associateCities.has(city)) {
        score += 20;
        reasons.push('Associate presence');
      }

      if (city === last.city) {
        score += 10;
        reasons.push('Current location corridor');
      }

      if (score > 0) {
        result.push({
          city,
          lat: agg.lat,
          lng: agg.lng,
          threatScore: Math.max(0, Math.min(100, score)),
          reasons,
        });
      }
    });

    return result.sort((a, b) => b.threatScore - a.threatScore);
  }
}

