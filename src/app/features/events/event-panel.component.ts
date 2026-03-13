import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { InvestigationEvent } from '../../models/event.model';
import { EventService } from '../../core/services/event.service';
import { GlassCardComponent } from '../../shared/components/glass-card/glass-card.component';

@Component({
  selector: 'app-event-panel',
  standalone: true,
  imports: [AsyncPipe, DatePipe, GlassCardComponent],
  templateUrl: './event-panel.component.html',
  styleUrl: './event-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventPanelComponent implements OnChanges {
  @Input() selectedSuspectId: string | null = null;

  events$?: Observable<InvestigationEvent[]>;

  constructor(private readonly eventService: EventService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('selectedSuspectId' in changes) {
      this.loadEvents();
    }
  }

  getEventIcon(title: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('hotel') || lower.includes('stay')) return 'hotel';
    if (lower.includes('bank') || lower.includes('atm') || lower.includes('transaction')) return 'account_balance';
    if (lower.includes('meeting') || lower.includes('contact')) return 'person_add';
    if (lower.includes('vehicle') || lower.includes('rental')) return 'directions_car';
    if (lower.includes('mobile') || lower.includes('tower') || lower.includes('ping')) return 'wifi_tethering';
    if (lower.includes('flight') || lower.includes('airport')) return 'flight';
    return 'report';
  }

  private loadEvents(): void {
    if (!this.selectedSuspectId) {
      this.events$ = undefined;
      return;
    }

    this.events$ = this.eventService.getEvents().pipe(
      map((all) =>
        all
          .filter((e) => e.suspectId === this.selectedSuspectId)
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          ),
      ),
    );
  }
}
