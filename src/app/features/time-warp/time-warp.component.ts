import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LiveDataService } from '../../core/services/live-data.service';
import { MapService } from '../../core/services/map.service';
import { MovementEntry } from '../../models/movement.model';

@Component({
  selector: 'app-time-warp',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './time-warp.component.html',
  styleUrl: './time-warp.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeWarpComponent implements OnInit, OnDestroy {
  @Input() selectedSuspectId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() movementSelected = new EventEmitter<string>();

  movements: MovementEntry[] = [];
  currentIndex = 0;
  isPlaying = false;
  speed = 1500;

  private playInterval?: ReturnType<typeof setInterval>;

  constructor(
    private readonly liveData: LiveDataService,
    private readonly mapService: MapService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.liveData.getLiveMovements().subscribe((all) => {
      this.movements = all
        .filter((m) => m.suspectId === this.selectedSuspectId)
        .sort((a, b) => a.travelOrder - b.travelOrder);

      if (this.movements.length > 0) {
        this.mapService.renderSuspectMovements(this.movements);
        this.focusCurrent();
      }
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.stopPlayback();
  }

  get progress(): number {
    return this.movements.length > 1
      ? (this.currentIndex / (this.movements.length - 1)) * 100
      : 0;
  }

  get currentMovement(): MovementEntry | null {
    return this.movements[this.currentIndex] ?? null;
  }

  onSliderInput(event: Event): void {
    const value = +(event.target as HTMLInputElement).value;
    this.currentIndex = value;
    this.focusCurrent();
    this.cdr.markForCheck();
  }

  play(): void {
    if (this.isPlaying) return;
    if (this.currentIndex >= this.movements.length - 1) {
      this.currentIndex = 0;
    }
    this.isPlaying = true;
    this.playInterval = setInterval(() => {
      if (this.currentIndex < this.movements.length - 1) {
        this.currentIndex++;
        this.focusCurrent();
        this.cdr.markForCheck();
      } else {
        this.stopPlayback();
        this.cdr.markForCheck();
      }
    }, this.speed);
  }

  pause(): void {
    this.stopPlayback();
    this.cdr.markForCheck();
  }

  reset(): void {
    this.stopPlayback();
    this.currentIndex = 0;
    this.focusCurrent();
    this.cdr.markForCheck();
  }

  stepForward(): void {
    if (this.currentIndex < this.movements.length - 1) {
      this.currentIndex++;
      this.focusCurrent();
      this.cdr.markForCheck();
    }
  }

  stepBack(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.focusCurrent();
      this.cdr.markForCheck();
    }
  }

  setSpeed(ms: number): void {
    this.speed = ms;
    if (this.isPlaying) {
      this.stopPlayback();
      this.play();
    }
  }

  private focusCurrent(): void {
    const m = this.movements[this.currentIndex];
    if (m) {
      this.mapService.focusMovement(m.id);
      this.mapService.highlightLastConnectedTower(m.connectedTowerId ?? null);
      this.movementSelected.emit(m.id);
    }
  }

  private stopPlayback(): void {
    this.isPlaying = false;
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = undefined;
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('timewarp-overlay')) {
      this.close.emit();
    }
  }
}
