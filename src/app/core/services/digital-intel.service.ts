import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  DigitalIntel,
  CallLog,
  InterceptedMessage,
  BrowsingEntry,
  ActivitySpike,
} from '../../models/digital-intel.model';

@Injectable({ providedIn: 'root' })
export class DigitalIntelService {
  constructor(private readonly http: HttpClient) {}

  private getIntel(): Observable<DigitalIntel> {
    return this.http.get<DigitalIntel>('/mock-data/digital-intel.json');
  }

  getCallLogs(suspectId: string): Observable<CallLog[]> {
    return this.getIntel().pipe(
      map((data) => data.callLogs.filter((c) => c.suspectId === suspectId)),
    );
  }

  getMessages(suspectId: string): Observable<InterceptedMessage[]> {
    return this.getIntel().pipe(
      map((data) => data.messages.filter((m) => m.suspectId === suspectId)),
    );
  }

  getBrowsingHistory(suspectId: string): Observable<BrowsingEntry[]> {
    return this.getIntel().pipe(
      map((data) => data.browsingHistory.filter((b) => b.suspectId === suspectId)),
    );
  }

  getActivitySpikes(suspectId: string): Observable<ActivitySpike[]> {
    return this.getIntel().pipe(
      map((data) => data.activitySpikes.filter((a) => a.suspectId === suspectId)),
    );
  }

  extractLocationsFromMessages(suspectId: string): Observable<{ city: string; lat: number; lng: number; context: string }[]> {
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      'delhi': { lat: 28.6139, lng: 77.2090 },
      'mumbai': { lat: 19.0760, lng: 72.8777 },
      'mumbai central': { lat: 19.0760, lng: 72.8777 },
      'jaipur': { lat: 26.9124, lng: 75.7873 },
      'jaipur station': { lat: 26.9124, lng: 75.7873 },
      'ahmedabad': { lat: 23.0225, lng: 72.5714 },
      'pune': { lat: 18.5204, lng: 73.8567 },
      'hyderabad': { lat: 17.3850, lng: 78.4867 },
      'bangalore': { lat: 12.9716, lng: 77.5946 },
      'chennai': { lat: 13.0827, lng: 80.2707 },
      'chennai port': { lat: 13.0827, lng: 80.2707 },
      'kolkata': { lat: 22.5726, lng: 88.3639 },
      'lucknow': { lat: 26.8467, lng: 80.9462 },
      'bhopal': { lat: 23.2599, lng: 77.4126 },
      'nagpur': { lat: 21.1458, lng: 79.0882 },
      'indore': { lat: 22.7196, lng: 75.8577 },
    };

    return this.getMessages(suspectId).pipe(
      map((messages) => {
        const locations: { city: string; lat: number; lng: number; context: string }[] = [];
        const seen = new Set<string>();

        messages.forEach((msg) => {
          const lower = msg.content.toLowerCase();
          for (const [name, coords] of Object.entries(cityCoords)) {
            if (lower.includes(name) && !seen.has(name)) {
              seen.add(name);
              const display = name.charAt(0).toUpperCase() + name.slice(1);
              locations.push({
                city: display,
                lat: coords.lat,
                lng: coords.lng,
                context: msg.content.substring(0, 60) + (msg.content.length > 60 ? '...' : ''),
              });
            }
          }
        });

        return locations;
      }),
    );
  }
}
