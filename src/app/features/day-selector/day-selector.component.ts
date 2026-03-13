import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { GlassCardComponent } from '../../shared/components/glass-card/glass-card.component';

export type InvestigationDay =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday';

@Component({
  selector: 'app-day-selector',
  standalone: true,
  imports: [GlassCardComponent],
  templateUrl: './day-selector.component.html',
  styleUrl: './day-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DaySelectorComponent {
  @Input() selectedDay: InvestigationDay | null = null;
  @Output() daySelected = new EventEmitter<InvestigationDay | null>();

  readonly days: InvestigationDay[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  onSelect(day: InvestigationDay): void {
    if (this.selectedDay === day) {
      this.daySelected.emit(null);
      return;
    }
    this.daySelected.emit(day);
  }
}

