import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { combineLatest, Observable, BehaviorSubject, map } from 'rxjs';
import { Suspect } from '../../models/suspect.model';
import { SuspectService } from '../../core/services/suspect.service';
import { MovementService } from '../../core/services/movement.service';
import { GlassCardComponent } from '../../shared/components/glass-card/glass-card.component';

export interface SuspectWithCount extends Suspect {
  movementCount: number;
}

@Component({
  selector: 'app-suspect-list',
  standalone: true,
  imports: [AsyncPipe, GlassCardComponent],
  templateUrl: './suspect-list.component.html',
  styleUrl: './suspect-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuspectListComponent implements OnInit {
  @Output() suspectSelected = new EventEmitter<string>();
  @Output() viewProfile = new EventEmitter<string>();

  suspects$!: Observable<SuspectWithCount[]>;

  private readonly selectedIdSubject = new BehaviorSubject<string | null>(null);
  readonly selectedId$ = this.selectedIdSubject.asObservable();

  constructor(
    private readonly suspectService: SuspectService,
    private readonly movementService: MovementService,
  ) {}

  ngOnInit(): void {
    this.suspects$ = combineLatest([
      this.suspectService.getSuspects(),
      this.movementService.getMovements(),
    ]).pipe(
      map(([suspects, movements]) =>
        suspects.map((s) => ({
          ...s,
          movementCount: movements.filter((m) => m.suspectId === s.id).length,
        })),
      ),
    );
  }

  onSelect(suspect: Suspect): void {
    this.selectedIdSubject.next(suspect.id);
    this.suspectSelected.emit(suspect.id);
  }

  onViewProfile(id: string): void {
    this.viewProfile.emit(id);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
