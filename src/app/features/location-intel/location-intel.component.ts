import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { GlassCardComponent } from '../../shared/components/glass-card/glass-card.component';
import { LocationIntel, LocationIntelService } from '../../core/services/location-intel.service';

@Component({
  selector: 'app-location-intel',
  standalone: true,
  imports: [AsyncPipe, DatePipe, GlassCardComponent],
  templateUrl: './location-intel.component.html',
  styleUrl: './location-intel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationIntelComponent implements OnChanges {
  @Input() selectedSuspectId: string | null = null;
  @Input() selectedMovementId: string | null = null;

  intel$?: Observable<LocationIntel | null>;

  constructor(private readonly locationIntel: LocationIntelService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('selectedSuspectId' in changes || 'selectedMovementId' in changes) {
      this.load();
    }
  }

  private load(): void {
    if (!this.selectedSuspectId || !this.selectedMovementId) {
      this.intel$ = undefined;
      return;
    }
    this.intel$ = this.locationIntel.getLocationIntel(
      this.selectedSuspectId,
      this.selectedMovementId,
    );
  }
}

