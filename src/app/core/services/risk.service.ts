import { Injectable } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { LiveDataService } from './live-data.service';
import { EventService } from './event.service';
import { DigitalIntelService } from './digital-intel.service';
import { PatternAnalysisService } from './pattern-analysis.service';
import { MovementEntry } from '../../models/movement.model';
import { InvestigationEvent } from '../../models/event.model';
import { CallLog, BrowsingEntry, InterceptedMessage } from '../../models/digital-intel.model';
import { SuspiciousPatternsSummary } from './pattern-analysis.service';

export interface RiskBreakdown {
  encryptedCommScore: number;
  cityJumpScore: number;
  browsingScore: number;
  crimeZoneScore: number;
  eventScore: number;
}

export interface RiskSummary {
  score: number;
  level: 'low' | 'medium' | 'high';
  breakdown: RiskBreakdown;
}

@Injectable({ providedIn: 'root' })
export class RiskService {
  private readonly crimeZones = new Set<string>([
    'Delhi',
    'Mumbai',
    'Kolkata',
    'Hyderabad',
    'Bangalore',
  ]);

  constructor(
    private readonly liveData: LiveDataService,
    private readonly eventService: EventService,
    private readonly digitalIntel: DigitalIntelService,
    private readonly patternService: PatternAnalysisService,
  ) {}

  getRiskForSuspect(suspectId: string): Observable<RiskSummary> {
    const movements$ = this.liveData.getLiveMovements();
    const events$ = this.eventService.getEvents();
    const calls$ = this.digitalIntel.getCallLogs(suspectId);
    const messages$ = this.digitalIntel.getMessages(suspectId);
    const browsing$ = this.digitalIntel.getBrowsingHistory(suspectId);
    const patterns$ = this.patternService.getPatternsForSuspect(suspectId);

    return combineLatest([movements$, events$, calls$, messages$, browsing$, patterns$]).pipe(
      map(([movements, events, calls, messages, browsing, patterns]) =>
        this.computeRisk(
          movements.filter((m) => m.suspectId === suspectId),
          events.filter((e) => e.suspectId === suspectId),
          calls,
          messages,
          browsing,
          patterns,
        ),
      ),
    );
  }

  private computeRisk(
    movements: MovementEntry[],
    events: InvestigationEvent[],
    calls: CallLog[],
    messages: InterceptedMessage[],
    browsing: BrowsingEntry[],
    patterns: SuspiciousPatternsSummary,
  ): RiskSummary {
    const encryptedCommScore = this.scoreEncryptedComm(calls, messages);
    const cityJumpScore = this.scoreCityJumps(patterns);
    const browsingScore = this.scoreBrowsing(browsing);
    const crimeZoneScore = this.scoreCrimeZones(movements);
    const eventScore = this.scoreEvents(events);

    const raw =
      encryptedCommScore +
      cityJumpScore +
      browsingScore +
      crimeZoneScore +
      eventScore;

    const score = Math.max(0, Math.min(100, Math.round(raw)));
    const level: 'low' | 'medium' | 'high' =
      score >= 75 ? 'high' : score >= 45 ? 'medium' : 'low';

    return {
      score,
      level,
      breakdown: {
        encryptedCommScore,
        cityJumpScore,
        browsingScore,
        crimeZoneScore,
        eventScore,
      },
    };
  }

  private scoreEncryptedComm(calls: CallLog[], messages: InterceptedMessage[]): number {
    const encryptedCalls = calls.filter(
      (c) =>
        c.phone.toLowerCase().includes('encrypted') ||
        c.contact.toLowerCase().includes('encrypted'),
    ).length;

    const encryptedMessages = messages.filter((m) => m.encrypted).length;

    const total = encryptedCalls + encryptedMessages;
    if (total === 0) return 0;
    return Math.min(30, total * 6);
  }

  private scoreCityJumps(patterns: SuspiciousPatternsSummary): number {
    const fastHops = patterns.fastHops.length;
    if (fastHops === 0) return 0;
    return Math.min(25, fastHops * 5);
  }

  private scoreBrowsing(browsing: BrowsingEntry[]): number {
    const suspicious = browsing.filter(
      (b) =>
        b.category === 'Suspicious' ||
        /darknet|hawala|cryptowallet|vpn-secure/i.test(b.url),
    ).length;
    if (suspicious === 0) return 0;
    return Math.min(20, suspicious * 4);
  }

  private scoreCrimeZones(movements: MovementEntry[]): number {
    if (!movements.length) return 0;
    const inZones = movements.filter((m) => this.crimeZones.has(m.city)).length;
    const ratio = inZones / movements.length;
    return Math.min(15, Math.round(ratio * 15 * 1.5));
  }

  private scoreEvents(events: InvestigationEvent[]): number {
    const risky = events.filter((e) =>
      /(hotel|stay|bank|atm|transaction)/i.test(e.title),
    ).length;
    if (risky === 0) return 0;
    return Math.min(10, risky * 3);
  }
}

