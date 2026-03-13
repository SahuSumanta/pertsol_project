import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { MapService } from '../../core/services/map.service';
import { LiveDataService } from '../../core/services/live-data.service';
import { SuspectService } from '../../core/services/suspect.service';
import { CellTowerService } from '../../core/services/cell-tower.service';
import { PoliceService } from '../../core/services/police.service';
import { DigitalIntelService } from '../../core/services/digital-intel.service';
import { PredictionService } from '../../core/services/prediction.service';
import { MovementEntry } from '../../models/movement.model';
import { CellTower } from '../../models/cell-tower.model';
import { PoliceStation } from '../../models/police.model';
import { IconButtonComponent } from '../../shared/components/icon-button/icon-button.component';
import { InvestigationDay } from '../day-selector/day-selector.component';
import { ThreatForecastService } from '../../core/services/threat-forecast.service';

@Component({
  selector: 'app-map-workspace',
  standalone: true,
  templateUrl: './map-workspace.component.html',
  styleUrl: './map-workspace.component.scss',
  imports: [IconButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapWorkspaceComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;
  @Input() selectedSuspectId: string | null = null;
  @Input() selectedDay: InvestigationDay | null = null;
  @Input() selectedMovementId: string | null = null;
  @Output() markerClicked = new EventEmitter<string>();

  activeSuspectName: string | null = null;
  cellTowersVisible = false;
  policeStationsVisible = false;
  forecastMode = false;

  private movements: MovementEntry[] = [];
  private cellTowers: CellTower[] = [];
  private policeStations: PoliceStation[] = [];
  private markerClickSub?: Subscription;
  private suspectSub?: Subscription;

  constructor(
    private readonly mapService: MapService,
    private readonly liveData: LiveDataService,
    private readonly suspectService: SuspectService,
    private readonly cellTowerService: CellTowerService,
    private readonly policeService: PoliceService,
    private readonly digitalIntel: DigitalIntelService,
    private readonly predictionService: PredictionService,
    private readonly threatForecast: ThreatForecastService,
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    this.mapService.initMap(this.mapContainer.nativeElement);

    requestAnimationFrame(() => {
      this.mapService.invalidateSize();
    });
    setTimeout(() => {
      this.mapService.invalidateSize();
    }, 300);

    this.loadMovements();
    this.loadInfrastructure();

    this.markerClickSub = this.mapService.markerClick$.subscribe((id) => {
      this.ngZone.run(() => {
        this.markerClicked.emit(id);
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('selectedSuspectId' in changes || 'selectedDay' in changes) {
      this.renderForSelectedSuspect();
      this.updateSuspectName();
      this.updateLastConnectedTower();
      this.updatePredictionAndStation();
      this.updateConversationLocations();
    }
    if ('selectedMovementId' in changes && this.selectedMovementId) {
      this.mapService.focusMovement(this.selectedMovementId);
    }
  }

  ngOnDestroy(): void {
    this.markerClickSub?.unsubscribe();
    this.suspectSub?.unsubscribe();
  }

  zoomIn(): void {
    this.mapService.getMap()?.zoomIn();
  }

  zoomOut(): void {
    this.mapService.getMap()?.zoomOut();
  }

  resetView(): void {
    this.mapService.getMap()?.flyTo([20.5937, 78.9629], 5, { duration: 0.8 });
  }

  toggleCellTowers(): void {
    this.cellTowersVisible = !this.cellTowersVisible;
    if (this.cellTowersVisible) {
      this.mapService.showCellTowerLayer();
      this.updateLastConnectedTower();
    } else {
      this.mapService.hideCellTowerLayer();
      this.mapService.highlightLastConnectedTower(null);
    }
  }

  togglePoliceStations(): void {
    this.policeStationsVisible = !this.policeStationsVisible;
    if (this.policeStationsVisible) {
      this.mapService.showPoliceStationLayer();
    } else {
      this.mapService.hidePoliceStationLayer();
    }
  }

  toggleForecast(): void {
    this.forecastMode = !this.forecastMode;
    if (!this.forecastMode) {
      this.mapService.clearThreatForecast();
      return;
    }
    this.updateForecast();
  }

  private loadInfrastructure(): void {
    this.cellTowerService.getCellTowers().subscribe((towers) => {
      this.cellTowers = towers;
      this.mapService.renderCellTowers(towers);
    });

    this.policeService.getPoliceStations().subscribe((stations) => {
      this.policeStations = stations;
      this.mapService.renderPoliceStations(stations);
    });
  }

  private updateLastConnectedTower(): void {
    if (!this.cellTowersVisible || !this.selectedSuspectId) {
      this.mapService.highlightLastConnectedTower(null);
      return;
    }

    const suspectMovements = this.movements
      .filter((m) => m.suspectId === this.selectedSuspectId)
      .sort((a, b) => b.travelOrder - a.travelOrder);

    const lastMovement = suspectMovements[0];
    this.mapService.highlightLastConnectedTower(lastMovement?.connectedTowerId ?? null);
  }

  private updatePredictionAndStation(): void {
    if (!this.selectedSuspectId) return;

    const suspectMovements = this.movements
      .filter((m) => m.suspectId === this.selectedSuspectId)
      .sort((a, b) => a.travelOrder - b.travelOrder);

    if (suspectMovements.length < 2) return;

    const last = suspectMovements[suspectMovements.length - 1];

    this.mapService.clearPrediction();

    const prediction = this.predictionService.predictNextLocation(suspectMovements);
    if (prediction) {
      this.mapService.renderPredictionLine(
        last.latitude, last.longitude,
        prediction.lat, prediction.lng,
        prediction.city, prediction.confidence,
      );
    }

    if (this.cellTowers.length >= 2) {
      const nearestTowers = [...this.cellTowers]
        .map((t) => ({
          tower: t,
          dist: this.distanceKm(last.latitude, last.longitude, t.latitude, t.longitude),
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3)
        .map((entry) => entry.tower);

      this.mapService.renderSignalTriangulation(
        last.latitude,
        last.longitude,
        nearestTowers,
      );
    }

    if (this.forecastMode) {
      this.updateForecast();
    }

    if (this.policeStations.length > 0) {
      const nearest = this.predictionService.findNearestStation(
        last.latitude, last.longitude, this.policeStations,
      );
      if (nearest) {
        this.mapService.renderNearestStationLine(
          last.latitude, last.longitude,
          nearest.station.latitude, nearest.station.longitude,
          nearest.station.name, nearest.distanceKm,
        );
      }
    }
  }

  private updateConversationLocations(): void {
    if (!this.selectedSuspectId) return;

    this.digitalIntel.extractLocationsFromMessages(this.selectedSuspectId).subscribe((locations) => {
      if (locations.length > 0) {
        this.mapService.renderConversationLocations(locations);
      }
    });
  }

  private updateForecast(): void {
    if (!this.selectedSuspectId) {
      this.mapService.clearThreatForecast();
      return;
    }
    const suspectMovements = this.movements
      .filter((m) => m.suspectId === this.selectedSuspectId)
      .sort((a, b) => a.travelOrder - b.travelOrder);
    if (!suspectMovements.length) {
      this.mapService.clearThreatForecast();
      return;
    }
    const last = suspectMovements[suspectMovements.length - 1];
    this.threatForecast
      .getForecastForSuspect(this.selectedSuspectId)
      .subscribe((cities) => {
        const top = cities.slice(0, 3).map((c, idx) => ({
          lat: c.lat,
          lng: c.lng,
          city: c.city,
          threatScore: c.threatScore,
          priority: idx + 1,
        }));
        if (!top.length) {
          this.mapService.clearThreatForecast();
        } else {
          this.mapService.renderThreatForecast(
            { lat: last.latitude, lng: last.longitude },
            top,
          );
        }
      });
  }

  private updateSuspectName(): void {
    if (!this.selectedSuspectId) {
      this.activeSuspectName = null;
      this.cdr.markForCheck();
      return;
    }
    this.suspectSub?.unsubscribe();
    this.suspectSub = this.suspectService.getSuspects().subscribe((suspects) => {
      const match = suspects.find((s) => s.id === this.selectedSuspectId);
      this.activeSuspectName = match?.displayName ?? null;
      this.cdr.markForCheck();
    });
  }

  private loadMovements(): void {
    this.liveData.getLiveMovements().subscribe((data) => {
      this.movements = data;
      this.renderForSelectedSuspect();
    });
  }

  private renderForSelectedSuspect(): void {
    if (!this.selectedSuspectId) {
      this.mapService.renderSuspectMovements([]);
      return;
    }

    let filtered = this.movements.filter(
      (m) => m.suspectId === this.selectedSuspectId,
    );

    if (this.selectedDay) {
      filtered = filtered.filter(
        (m) => this.getDayOfWeek(m.timestamp) === this.selectedDay,
      );
    }

    const movementsForSuspect = filtered.sort(
      (a, b) => a.travelOrder - b.travelOrder,
    );

    this.mapService.renderSuspectMovements(movementsForSuspect);
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

  showRoute(): void {
    this.renderForSelectedSuspect();
  }

  showClusters(): void {
    if (!this.selectedSuspectId) return;
    const movementsForSuspect = this.movements.filter(
      (m) => m.suspectId === this.selectedSuspectId,
    );
    this.mapService.renderClustersForMovements(movementsForSuspect);
  }

  showHeatmap(): void {
    if (!this.selectedSuspectId) return;
    const movementsForSuspect = this.movements.filter(
      (m) => m.suspectId === this.selectedSuspectId,
    );
    this.mapService.renderHeatmapForMovements(movementsForSuspect);
  }

  private distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
