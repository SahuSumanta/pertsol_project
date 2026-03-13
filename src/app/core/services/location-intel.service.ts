import { Injectable } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { LiveDataService } from './live-data.service';
import { DigitalIntelService } from './digital-intel.service';
import { EventService } from './event.service';
import { CellTowerService } from './cell-tower.service';
import { PoliceService } from './police.service';
import { PredictionService, NearestStation } from './prediction.service';
import { MovementEntry } from '../../models/movement.model';
import { CallLog, InterceptedMessage, BrowsingEntry } from '../../models/digital-intel.model';
import { InvestigationEvent } from '../../models/event.model';
import { CellTower } from '../../models/cell-tower.model';
import { PoliceStation } from '../../models/police.model';

export interface LocationIntel {
  movement: MovementEntry;
  stayDurationMinutes?: number;
  calls: CallLog[];
  messages: InterceptedMessage[];
  browsing: BrowsingEntry[];
  events: InvestigationEvent[];
  tower?: CellTower;
  nearestStation?: NearestStation;
}

@Injectable({ providedIn: 'root' })
export class LocationIntelService {
  constructor(
    private readonly liveData: LiveDataService,
    private readonly digitalIntel: DigitalIntelService,
    private readonly eventService: EventService,
    private readonly cellTowerService: CellTowerService,
    private readonly policeService: PoliceService,
    private readonly predictionService: PredictionService,
  ) {}

  getLocationIntel(
    suspectId: string,
    movementId: string,
  ): Observable<LocationIntel | null> {
    const movements$ = this.liveData.getLiveMovements();
    const calls$ = this.digitalIntel.getCallLogs(suspectId);
    const msgs$ = this.digitalIntel.getMessages(suspectId);
    const browse$ = this.digitalIntel.getBrowsingHistory(suspectId);
    const events$ = this.eventService.getEvents();
    const towers$ = this.cellTowerService.getCellTowers();
    const stations$ = this.policeService.getPoliceStations();

    return combineLatest([
      movements$,
      calls$,
      msgs$,
      browse$,
      events$,
      towers$,
      stations$,
    ]).pipe(
      map(
        ([
          movements,
          calls,
          messages,
          browsing,
          events,
          towers,
          stations,
        ]) => {
          const allForSuspect = movements
            .filter((m) => m.suspectId === suspectId)
            .sort((a, b) => a.travelOrder - b.travelOrder);

          const movement = allForSuspect.find((m) => m.id === movementId);
          if (!movement) return null;

          const stayDurationMinutes = this.computeStayDurationMinutes(
            allForSuspect,
            movement,
          );

          const ts = new Date(movement.timestamp).getTime();
          const windowMs = 2 * 60 * 60 * 1000; // ±2h

          const inWindow = (timeStr: string) => {
            const time = new Date(timeStr).getTime();
            return Math.abs(time - ts) <= windowMs;
          };

          const callsAtLocation = calls.filter((c) => inWindow(c.timestamp));
          const msgsAtLocation = messages.filter((m) => inWindow(m.timestamp));
          const browsingAtLocation = browsing.filter((b) => inWindow(b.timestamp));
          const eventsAtLocation = events.filter(
            (e) =>
              e.suspectId === suspectId &&
              (e.movementId === movement.id || inWindow(e.timestamp)),
          );

          const tower = this.pickTowerForMovement(movement, towers);
          const nearestStation = this.predictionService.findNearestStation(
            movement.latitude,
            movement.longitude,
            stations,
          );

          return {
            movement,
            stayDurationMinutes,
            calls: callsAtLocation,
            messages: msgsAtLocation,
            browsing: browsingAtLocation,
            events: eventsAtLocation,
            tower: tower ?? undefined,
            nearestStation: nearestStation ?? undefined,
          };
        },
      ),
    );
  }

  private computeStayDurationMinutes(
    movements: MovementEntry[],
    current: MovementEntry,
  ): number | undefined {
    const idx = movements.findIndex((m) => m.id === current.id);
    if (idx === -1 || idx === movements.length - 1) return undefined;
    const currTime = new Date(current.timestamp).getTime();
    const nextTime = new Date(movements[idx + 1].timestamp).getTime();
    if (nextTime <= currTime) return undefined;
    return Math.round((nextTime - currTime) / (1000 * 60));
  }

  private pickTowerForMovement(
    movement: MovementEntry,
    towers: CellTower[],
  ): CellTower | null {
    if (!towers.length) return null;
    if (movement.connectedTowerId) {
      const match = towers.find((t) => t.id === movement.connectedTowerId);
      if (match) return match;
    }

    let best: CellTower | null = null;
    let minDist = Infinity;
    towers.forEach((t) => {
      const d = this.haversineKm(
        movement.latitude,
        movement.longitude,
        t.latitude,
        t.longitude,
      );
      if (d < minDist) {
        minDist = d;
        best = t;
      }
    });
    return best;
  }

  private haversineKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371;
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

