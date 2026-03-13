import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { MapWorkspaceComponent } from '../map-workspace/map-workspace.component';
import { SuspectListComponent } from '../suspects/suspect-list.component';
import { DaySelectorComponent, InvestigationDay } from '../day-selector/day-selector.component';
import { IntelPanelComponent } from '../intel/intel-panel.component';
import { TimelineComponent } from '../timeline/timeline.component';
import { EventPanelComponent } from '../events/event-panel.component';
import { NotesPanelComponent } from '../notes/notes-panel.component';
import { PatternPanelComponent } from '../intel/pattern-panel.component';
import { NetworkGraphComponent } from '../intel/network-graph.component';
import { DashboardHeaderComponent } from '../dashboard-header/dashboard-header.component';
import { AddSuspectComponent } from '../add-suspect/add-suspect.component';
import { SuspectProfileComponent } from '../suspect-profile/suspect-profile.component';
import { TimeWarpComponent } from '../time-warp/time-warp.component';
import { CaseShareComponent } from '../case-share/case-share.component';
import { LocationIntelComponent } from '../location-intel/location-intel.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MapWorkspaceComponent,
    SuspectListComponent,
    DaySelectorComponent,
    IntelPanelComponent,
    TimelineComponent,
    EventPanelComponent,
    NotesPanelComponent,
    PatternPanelComponent,
    NetworkGraphComponent,
    DashboardHeaderComponent,
    AddSuspectComponent,
    SuspectProfileComponent,
    TimeWarpComponent,
    CaseShareComponent,
    LocationIntelComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  selectedSuspectId: string | null = null;
  selectedMovementId: string | null = null;
  selectedDay: InvestigationDay | null = null;

  showAddSuspect = false;
  showSuspectProfile = false;
  showTimeWarp = false;
  showCaseShare = false;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
  ) {}

  onSuspectSelected(id: string): void {
    this.selectedSuspectId = id;
    this.selectedMovementId = null;
  }

  onViewProfile(id: string): void {
    this.router.navigate(['/suspect', id]);
  }

  onDaySelected(day: InvestigationDay | null): void {
    this.selectedDay = day;
  }

  onMovementSelected(id: string): void {
    this.selectedMovementId = id;
  }

  openAddSuspect(): void {
    this.showAddSuspect = true;
    this.cdr.markForCheck();
  }

  closeAddSuspect(): void {
    this.showAddSuspect = false;
    this.cdr.markForCheck();
  }

  openSuspectProfile(): void {
    if (this.selectedSuspectId) {
      this.showSuspectProfile = true;
      this.cdr.markForCheck();
    }
  }

  closeSuspectProfile(): void {
    this.showSuspectProfile = false;
    this.cdr.markForCheck();
  }

  openTimeWarp(): void {
    this.showTimeWarp = true;
    this.cdr.markForCheck();
  }

  closeTimeWarp(): void {
    this.showTimeWarp = false;
    this.cdr.markForCheck();
  }

  openCaseShare(): void {
    if (this.selectedSuspectId) {
      this.showCaseShare = true;
      this.cdr.markForCheck();
    }
  }

  closeCaseShare(): void {
    this.showCaseShare = false;
    this.cdr.markForCheck();
  }
}
