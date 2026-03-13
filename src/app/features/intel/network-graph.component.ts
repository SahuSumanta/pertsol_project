import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NetworkService, SuspectNode } from '../../core/services/network.service';
import { GlassCardComponent } from '../../shared/components/glass-card/glass-card.component';

@Component({
  selector: 'app-network-graph',
  standalone: true,
  imports: [AsyncPipe, GlassCardComponent],
  templateUrl: './network-graph.component.html',
  styleUrl: './network-graph.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkGraphComponent implements OnChanges {
  @Input() selectedSuspectId: string | null = null;

  nodes$?: Observable<SuspectNode[]>;

  constructor(private readonly networkService: NetworkService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('selectedSuspectId' in changes) {
      this.loadNetwork();
    }
  }

  private loadNetwork(): void {
    this.nodes$ = this.networkService.getNetwork(this.selectedSuspectId).pipe(
      map((nodes) =>
        nodes.map((n) => ({
          ...n,
        })),
      ),
    );
  }

  getDisplayName(nodes: SuspectNode[], id: string): string {
    const match = nodes.find((n) => n.id === id);
    return match?.displayName ?? id;
  }
}

