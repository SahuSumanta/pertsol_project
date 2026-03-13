import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Suspect } from '../../models/suspect.model';

@Injectable({ providedIn: 'root' })
export class SuspectService {
  private readonly suspectsSubject = new BehaviorSubject<Suspect[]>([]);
  private loaded = false;

  constructor(private readonly http: HttpClient) {}

  getSuspects(): Observable<Suspect[]> {
    if (!this.loaded) {
      this.http.get<Suspect[]>('/mock-data/suspects.json').pipe(
        tap((suspects) => {
          const enriched = suspects.map((s) => ({
            ...s,
            surveillanceStatus: s.surveillanceStatus ?? 'active' as const,
            activityLevel: s.riskLevel === 'high' ? 'high' as const : s.riskLevel === 'medium' ? 'moderate' as const : 'low' as const,
            signalStrength: 'strong' as const,
          }));
          this.suspectsSubject.next(enriched);
          this.loaded = true;
        }),
      ).subscribe();
    }
    return this.suspectsSubject.asObservable();
  }

  addSuspect(suspect: Omit<Suspect, 'id'>): void {
    const current = this.suspectsSubject.value;
    const maxId = current.reduce((max, s) => {
      const num = parseInt(s.id.replace('s', ''), 10);
      return num > max ? num : max;
    }, 0);

    const newSuspect: Suspect = {
      ...suspect,
      id: `s${maxId + 1}`,
      surveillanceStatus: 'active',
      activityLevel: 'low',
      signalStrength: 'moderate',
    };

    this.suspectsSubject.next([...current, newSuspect]);
  }

  getSuspectById(id: string): Suspect | undefined {
    return this.suspectsSubject.value.find((s) => s.id === id);
  }
}
