import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AsyncPipe, DatePipe, UpperCasePipe, TitleCasePipe, SlicePipe, NgIf } from '@angular/common';
import { SuspectService } from '../../core/services/suspect.service';
import { Suspect } from '../../models/suspect.model';
import { DigitalIntelService } from '../../core/services/digital-intel.service';
import { NetworkService, SuspectNode } from '../../core/services/network.service';
import { LiveDataService } from '../../core/services/live-data.service';
import { MovementEntry } from '../../models/movement.model';
import { InvestigationEvent } from '../../models/event.model';
import { EventService } from '../../core/services/event.service';
import { ActivitySpike, BrowsingEntry, CallLog, InterceptedMessage } from '../../models/digital-intel.model';
import { RiskService, RiskSummary } from '../../core/services/risk.service';
import { ThreatForecastService, CityThreat } from '../../core/services/threat-forecast.service';
import { combineLatest, map, Observable } from 'rxjs';
import { GlassCardComponent } from '../../shared/components/glass-card/glass-card.component';
import { LocationIntelComponent } from '../location-intel/location-intel.component';

interface DeepIntelViewModel {
  suspect: Suspect | null;
  firstSeen?: string;
  primaryCorridor?: string;
  associates: SuspectNode[];
}

@Component({
  selector: 'app-suspect-deep-intel',
  standalone: true,
  imports: [
    AsyncPipe,
    NgIf,
    DatePipe,
    UpperCasePipe,
    TitleCasePipe,
    SlicePipe,
    GlassCardComponent,
    LocationIntelComponent,
  ],
  templateUrl: './suspect-deep-intel.component.html',
  styleUrl: './suspect-deep-intel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuspectDeepIntelComponent implements OnInit {
  vm$!: Observable<DeepIntelViewModel>;
  calls$!: Observable<CallLog[]>;
  messages$!: Observable<InterceptedMessage[]>;
  browsing$!: Observable<BrowsingEntry[]>;
  spikes$!: Observable<ActivitySpike[]>;
  events$!: Observable<InvestigationEvent[]>;
  movements$!: Observable<MovementEntry[]>;
  risk$!: Observable<RiskSummary>;
  forecast$!: Observable<CityThreat[]>;

  readonly tabs = ['7d', '30d', 'all'] as const;
  activeTab: '7d' | '30d' | 'all' = '7d';

  selectedMovementId: string | null = null;

  private suspectId!: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly suspectService: SuspectService,
    private readonly digitalIntel: DigitalIntelService,
    private readonly networkService: NetworkService,
    private readonly liveData: LiveDataService,
    private readonly eventService: EventService,
    private readonly riskService: RiskService,
    private readonly forecastService: ThreatForecastService,
  ) {}

  ngOnInit(): void {
    this.suspectId = this.route.snapshot.paramMap.get('id') ?? '';

    const allMovements$ = this.liveData.getLiveMovements().pipe(
      map((all) =>
        all
          .filter((m) => m.suspectId === this.suspectId)
          .sort((a, b) => a.travelOrder - b.travelOrder),
      ),
    );

    this.movements$ = allMovements$;

    this.vm$ = combineLatest([
      this.suspectService.getSuspects(),
      allMovements$,
      this.networkService.getNetwork(this.suspectId),
    ]).pipe(
      map(([suspects, movements, network]) => {
        const suspect = suspects.find((s) => s.id === this.suspectId) ?? null;
        const firstSeen = movements[0]?.timestamp;

        let primaryCorridor: string | undefined;
        if (movements.length > 1) {
          const transitions = new Map<string, number>();
          for (let i = 1; i < movements.length; i++) {
            const from = movements[i - 1].city;
            const to = movements[i].city;
            const key = `${from} → ${to}`;
            transitions.set(key, (transitions.get(key) ?? 0) + 1);
          }
          const best = [...transitions.entries()].sort((a, b) => b[1] - a[1])[0];
          if (best) primaryCorridor = best[0];
        }

        const node = network.find((n) => n.id === this.suspectId);
        const associates =
          node?.connections
            .map((cid) => network.find((n) => n.id === cid))
            .filter((n): n is SuspectNode => !!n)
            .slice(0, 3) ?? [];

        return { suspect, firstSeen, primaryCorridor, associates };
      }),
    );

    this.calls$ = this.digitalIntel.getCallLogs(this.suspectId);
    this.messages$ = this.digitalIntel.getMessages(this.suspectId);
    this.browsing$ = this.digitalIntel.getBrowsingHistory(this.suspectId);
    this.spikes$ = this.digitalIntel.getActivitySpikes(this.suspectId);
    this.events$ = this.eventService.getEvents().pipe(
      map((all) => all.filter((e) => e.suspectId === this.suspectId)),
    );
    this.risk$ = this.riskService.getRiskForSuspect(this.suspectId);
    this.forecast$ = this.forecastService.getForecastForSuspect(this.suspectId);
  }

  setTab(tab: '7d' | '30d' | 'all'): void {
    this.activeTab = tab;
  }

  selectMovement(id: string): void {
    this.selectedMovementId = id;
  }

  trackById = (_: number, item: { id: string }) => item.id;

  goBack(): void {
    this.router.navigate(['/']);
  }
}

