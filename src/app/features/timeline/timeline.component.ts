import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { MovementEntry } from '../../models/movement.model';
import { LiveDataService } from '../../core/services/live-data.service';
import { map, Observable, Subscription, interval } from 'rxjs';
import { GlassCardComponent } from '../../shared/components/glass-card/glass-card.component';
import { InvestigationDay } from '../day-selector/day-selector.component';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [AsyncPipe, DatePipe, GlassCardComponent],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent implements OnChanges, OnDestroy, AfterViewChecked {
  @Input() selectedSuspectId: string | null = null;
  @Input() selectedDay: InvestigationDay | null = null;
  @Input() selectedMovementId: string | null = null;
  @Output() movementSelected = new EventEmitter<string>();

  movements$?: Observable<MovementEntry[]>;
  private playbackSub?: Subscription;
  private pendingScrollId: string | null = null;

  constructor(
    private readonly liveData: LiveDataService,
    private readonly elRef: ElementRef<HTMLElement>,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('selectedSuspectId' in changes || 'selectedDay' in changes) {
      this.loadMovements();
    }
    if ('selectedMovementId' in changes && this.selectedMovementId) {
      this.pendingScrollId = this.selectedMovementId;
    }
  }

  ngAfterViewChecked(): void {
    if (this.pendingScrollId) {
      this.scrollToMovement(this.pendingScrollId);
      this.pendingScrollId = null;
    }
  }

  private scrollToMovement(id: string): void {
    const el = this.elRef.nativeElement.querySelector(`[data-movement-id="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  private loadMovements(): void {
    if (!this.selectedSuspectId) {
      this.movements$ = undefined;
      return;
    }

    this.movements$ = this.liveData.getLiveMovements().pipe(
      map((all) =>
        all
          .filter((m) => m.suspectId === this.selectedSuspectId)
          .filter((m) =>
            this.selectedDay
              ? this.getDayOfWeek(m.timestamp) === this.selectedDay
              : true,
          )
          .sort((a, b) => a.travelOrder - b.travelOrder),
      ),
    );
  }

  onSelect(movement: MovementEntry): void {
    this.movementSelected.emit(movement.id);
  }

  startPlayback(movements: MovementEntry[]): void {
    if (!movements.length) return;
    if (this.playbackSub) {
      this.playbackSub.unsubscribe();
    }
    const sorted = [...movements].sort((a, b) => a.travelOrder - b.travelOrder);
    let index = 0;
    this.playbackSub = interval(1500).subscribe(() => {
      if (index >= sorted.length) {
        this.playbackSub?.unsubscribe();
        this.playbackSub = undefined;
        return;
      }
      this.movementSelected.emit(sorted[index].id);
      index += 1;
    });
  }

  ngOnDestroy(): void {
    this.playbackSub?.unsubscribe();
  }

  private getDayOfWeek(timestamp: string): InvestigationDay {
    const date = new Date(timestamp);
    const dayIndex = date.getDay();
    const dayMap: Record<number, InvestigationDay> = {
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
    };
    return dayMap[dayIndex] ?? 'Monday';
  }
}
