import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Officer, SharedCase } from '../../models/officer.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentOfficerSubject = new BehaviorSubject<Officer | null>(null);
  readonly currentOfficer$ = this.currentOfficerSubject.asObservable();

  private officers: Officer[] = [];
  private sharedCases: SharedCase[] = [];

  constructor(private readonly http: HttpClient) {
    const stored = sessionStorage.getItem('currentOfficer');
    if (stored) {
      this.currentOfficerSubject.next(JSON.parse(stored));
    }
  }

  get isLoggedIn(): boolean {
    return this.currentOfficerSubject.value !== null;
  }

  get currentOfficer(): Officer | null {
    return this.currentOfficerSubject.value;
  }

  login(officerId: string, password: string): Observable<Officer | null> {
    return this.http.get<Officer[]>('/mock-data/officers.json').pipe(
      map((officers) => {
        this.officers = officers;
        return officers.find(
          (o) => o.id.toLowerCase() === officerId.toLowerCase() && o.password === password,
        ) ?? null;
      }),
      tap((officer) => {
        if (officer) {
          this.currentOfficerSubject.next(officer);
          sessionStorage.setItem('currentOfficer', JSON.stringify(officer));
        }
      }),
    );
  }

  logout(): void {
    this.currentOfficerSubject.next(null);
    sessionStorage.removeItem('currentOfficer');
  }

  getOfficers(): Observable<Officer[]> {
    return this.http.get<Officer[]>('/mock-data/officers.json');
  }

  shareCase(suspectId: string, targetOfficerId: string, notes?: string): void {
    const current = this.currentOfficer;
    if (!current) return;
    this.sharedCases.push({
      id: `sc-${Date.now()}`,
      suspectId,
      sharedBy: current.id,
      sharedWith: targetOfficerId,
      timestamp: new Date().toISOString(),
      notes,
    });
  }

  getSharedCases(): SharedCase[] {
    return [...this.sharedCases];
  }

  getSharedCasesForOfficer(officerId: string): SharedCase[] {
    return this.sharedCases.filter((sc) => sc.sharedWith === officerId);
  }
}
