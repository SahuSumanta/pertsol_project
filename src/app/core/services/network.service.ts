import { Injectable } from '@angular/core';
import { SuspectService } from './suspect.service';
import { Observable, combineLatest, map } from 'rxjs';
import { Suspect } from '../../models/suspect.model';

export interface SuspectNode extends Suspect {
  connections: string[]; // connected suspectIds
}

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  // Simple static relationship graph for visualization
  private readonly adjacency: Record<string, string[]> = {
    s1: ['s2', 's4'],
    s2: ['s1', 's3'],
    s3: ['s2', 's5'],
    s4: ['s1', 's6'],
    s5: ['s3', 's7'],
    s6: ['s4'],
    s7: ['s5'],
  };

  constructor(private readonly suspectService: SuspectService) {}

  getNetwork(selectedSuspectId: string | null): Observable<SuspectNode[]> {
    return this.suspectService.getSuspects().pipe(
      map((suspects) =>
        suspects.map((s) => ({
          ...s,
          connections: this.adjacency[s.id] ?? [],
        })),
      ),
    );
  }
}

