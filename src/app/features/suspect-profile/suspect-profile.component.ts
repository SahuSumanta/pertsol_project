import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuspectService } from '../../core/services/suspect.service';
import { DigitalIntelService } from '../../core/services/digital-intel.service';
import { MovementService } from '../../core/services/movement.service';
import { PredictionService, PredictedLocation, NearestStation } from '../../core/services/prediction.service';
import { PoliceService } from '../../core/services/police.service';
import { Suspect } from '../../models/suspect.model';
import { CallLog, InterceptedMessage, BrowsingEntry, ActivitySpike } from '../../models/digital-intel.model';
import { MovementEntry } from '../../models/movement.model';
import { GlassCardComponent } from '../../shared/components/glass-card/glass-card.component';

@Component({
  selector: 'app-suspect-profile',
  standalone: true,
  imports: [CommonModule, GlassCardComponent],
  templateUrl: './suspect-profile.component.html',
  styleUrl: './suspect-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuspectProfileComponent implements OnChanges {
  @Input() suspectId!: string;
  @Output() close = new EventEmitter<void>();

  suspect: Suspect | null = null;
  callLogs: CallLog[] = [];
  messages: InterceptedMessage[] = [];
  browsingHistory: BrowsingEntry[] = [];
  activitySpikes: ActivitySpike[] = [];
  movements: MovementEntry[] = [];
  prediction: PredictedLocation | null = null;
  nearestStation: NearestStation | null = null;
  maxActivity = 1;

  constructor(
    private readonly suspectService: SuspectService,
    private readonly digitalIntel: DigitalIntelService,
    private readonly movementService: MovementService,
    private readonly predictionService: PredictionService,
    private readonly policeService: PoliceService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.suspect = this.suspectService.getSuspectById(this.suspectId) ?? null;

    this.digitalIntel.getCallLogs(this.suspectId).subscribe((data) => {
      this.callLogs = data;
      this.cdr.markForCheck();
    });

    this.digitalIntel.getMessages(this.suspectId).subscribe((data) => {
      this.messages = data;
      this.cdr.markForCheck();
    });

    this.digitalIntel.getBrowsingHistory(this.suspectId).subscribe((data) => {
      this.browsingHistory = data;
      this.cdr.markForCheck();
    });

    this.digitalIntel.getActivitySpikes(this.suspectId).subscribe((data) => {
      this.activitySpikes = data;
      this.maxActivity = Math.max(...data.map((s) => s.calls + s.messages + s.browsing), 1);
      this.cdr.markForCheck();
    });

    this.movementService.getMovements().subscribe((all) => {
      this.movements = all
        .filter((m) => m.suspectId === this.suspectId)
        .sort((a, b) => a.travelOrder - b.travelOrder);

      this.prediction = this.predictionService.predictNextLocation(this.movements);

      if (this.movements.length > 0) {
        const last = this.movements[this.movements.length - 1];
        this.policeService.getPoliceStations().subscribe((stations) => {
          this.nearestStation = this.predictionService.findNearestStation(
            last.latitude,
            last.longitude,
            stations,
          );
          this.cdr.markForCheck();
        });
      }

      this.cdr.markForCheck();
    });
  }

  getBarHeight(spike: ActivitySpike): number {
    const total = spike.calls + spike.messages + spike.browsing;
    return Math.round((total / this.maxActivity) * 100);
  }

  getCallIcon(type: string): string {
    if (type === 'incoming') return 'call_received';
    if (type === 'outgoing') return 'call_made';
    return 'phone_missed';
  }

  getCallColor(type: string): string {
    if (type === 'incoming') return '#22c55e';
    if (type === 'outgoing') return '#137fec';
    return '#ef4444';
  }

  getCategoryColor(cat: string): string {
    const map: Record<string, string> = {
      'Development': '#a78bfa',
      'Email': '#60a5fa',
      'Suspicious': '#ef4444',
      'Social': '#34d399',
      'Communication': '#fbbf24',
      'Finance': '#f97316',
    };
    return map[cat] ?? '#737373';
  }

  getStatusColor(status?: string): string {
    if (status === 'active') return '#22c55e';
    if (status === 'paused') return '#f59e0b';
    return '#525252';
  }

  getSignalBars(strength?: string): number {
    if (strength === 'strong') return 4;
    if (strength === 'moderate') return 3;
    if (strength === 'weak') return 2;
    return 0;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('profile-overlay')) {
      this.close.emit();
    }
  }
}
