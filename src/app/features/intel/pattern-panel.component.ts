import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { PatternAnalysisService, SuspiciousPatternsSummary } from '../../core/services/pattern-analysis.service';
import { GlassCardComponent } from '../../shared/components/glass-card/glass-card.component';

@Component({
  selector: 'app-pattern-panel',
  standalone: true,
  imports: [AsyncPipe, DatePipe, GlassCardComponent],
  templateUrl: './pattern-panel.component.html',
  styleUrl: './pattern-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatternPanelComponent implements OnChanges {
  @Input() selectedSuspectId: string | null = null;

  patterns$?: Observable<SuspiciousPatternsSummary>;

  constructor(private readonly patternService: PatternAnalysisService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('selectedSuspectId' in changes) {
      this.loadPatterns();
    }
  }

  private loadPatterns(): void {
    if (!this.selectedSuspectId) {
      this.patterns$ = undefined;
      return;
    }
    this.patterns$ = this.patternService.getPatternsForSuspect(
      this.selectedSuspectId,
    );
  }
}

