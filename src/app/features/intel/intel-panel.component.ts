import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { GlassCardComponent } from '../../shared/components/glass-card/glass-card.component';
import { IntelService, SuspectIntelStats } from '../../core/services/intel.service';
import { RiskService, RiskSummary } from '../../core/services/risk.service';

@Component({
  selector: 'app-intel-panel',
  standalone: true,
  imports: [AsyncPipe, GlassCardComponent],
  templateUrl: './intel-panel.component.html',
  styleUrl: './intel-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntelPanelComponent implements OnChanges {
  @Input() selectedSuspectId: string | null = null;

  stats$?: Observable<SuspectIntelStats>;
  risk$?: Observable<RiskSummary>;

  constructor(
    private readonly intelService: IntelService,
    private readonly riskService: RiskService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('selectedSuspectId' in changes) {
      this.loadStats();
    }
  }

  private loadStats(): void {
    if (!this.selectedSuspectId) {
      this.stats$ = undefined;
      this.risk$ = undefined;
      return;
    }
    this.stats$ = this.intelService.getStatsForSuspect(this.selectedSuspectId);
    this.risk$ = this.riskService.getRiskForSuspect(this.selectedSuspectId);
  }
}


