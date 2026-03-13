import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import * as L from 'leaflet';
import { MovementEntry } from '../../models/movement.model';
import { CellTower } from '../../models/cell-tower.model';
import { PoliceStation } from '../../models/police.model';

@Injectable({
  providedIn: 'root',
})
export class MapService implements OnDestroy {
  private map?: L.Map;

  private movementLayer?: L.LayerGroup;
  private cityClusterLayer?: L.LayerGroup;
  private heatmapLayer?: L.LayerGroup;
  private cellTowerLayer?: L.LayerGroup;
  private policeStationLayer?: L.LayerGroup;

  private baseLayers?: { [key: string]: L.TileLayer };

  private movementMarkersById = new Map<string, L.Marker>();
  private markerOrderById = new Map<string, number>();
  private movementRouteLine?: L.Polyline;
  private routeGlowLine?: L.Polyline;
  private highlightedMarkerId?: string;

  private cellTowerMarkersById = new Map<string, L.Marker>();
  private highlightedTowerId?: string;
  private highlightedTowerMarker?: L.Marker;
  private signalRadiusCircle?: L.Circle;
  private predictionLayer?: L.LayerGroup;
  private nearestStationLine?: L.Polyline;
  private forecastLayer?: L.LayerGroup;

  private resizeObserver?: ResizeObserver;

  private readonly markerClickSubject = new Subject<string>();
  readonly markerClick$ = this.markerClickSubject.asObservable();

  initMap(container: HTMLElement, options?: L.MapOptions): L.Map {
    if (this.map) {
      return this.map;
    }

    this.map = L.map(container, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
      ...options,
    });

    const tileOptions: L.TileLayerOptions = {
      detectRetina: true,
      updateWhenIdle: false,
      updateWhenZooming: false,
      keepBuffer: 4,
    };

    const cartoDark = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        ...tileOptions,
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      },
    );

    const osmStandard = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        ...tileOptions,
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      },
    );

    const cartoLight = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      {
        ...tileOptions,
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      },
    );

    this.baseLayers = {
      'Dark (Tactical)': cartoDark,
      'OpenStreetMap': osmStandard,
      'Light': cartoLight,
    };

    cartoDark.addTo(this.map);

    this.movementLayer = L.layerGroup().addTo(this.map);
    this.cityClusterLayer = L.layerGroup().addTo(this.map);
    this.heatmapLayer = L.layerGroup().addTo(this.map);
    this.cellTowerLayer = L.layerGroup();
    this.policeStationLayer = L.layerGroup();
    this.predictionLayer = L.layerGroup().addTo(this.map);
    this.forecastLayer = L.layerGroup().addTo(this.map);

    if (this.baseLayers) {
      L.control
        .layers(this.baseLayers, undefined, { position: 'bottomright' })
        .addTo(this.map);
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.map?.invalidateSize({ animate: false });
    });
    this.resizeObserver.observe(container);

    return this.map;
  }

  invalidateSize(): void {
    this.map?.invalidateSize({ animate: false });
  }

  getMap(): L.Map | undefined {
    return this.map;
  }

  private static readonly INDIA_CENTER: L.LatLngExpression = [20.5937, 78.9629];
  private static readonly DEFAULT_ZOOM = 5;

  // ─── Movement Layer ──────────────────────────────────────

  renderSuspectMovements(movements: MovementEntry[]): void {
    if (!this.map || !this.movementLayer) {
      return;
    }

    this.clearMovementOverlays();

    if (!movements.length) {
      this.map.flyTo(MapService.INDIA_CENTER, MapService.DEFAULT_ZOOM, { duration: 0.6 });
      return;
    }

    const latLngs: L.LatLngExpression[] = [];

    movements.forEach((movement) => {
      const position: L.LatLngExpression = [
        movement.latitude,
        movement.longitude,
      ];
      latLngs.push(position);

      const marker = L.marker(position, {
        icon: this.createNumberedIcon(movement.travelOrder, false),
      });

      const towerInfo = movement.connectedTowerId
        ? `<tr><td style="padding: 3px 12px 3px 0; color: #525252; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">Tower</td>
               <td style="font-weight: 500; color: #f59e0b;">${movement.connectedTowerId}</td></tr>`
        : '';

      const popupHtml = `
        <div style="font-family: 'Inter', -apple-system, system-ui, sans-serif; font-size: 13px; line-height: 1.5; min-width: 190px; padding: 10px;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 10px; color: #fafafa; display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 6px; background: rgba(19,127,236,0.15); color: #137fec; font-size: 11px; font-weight: 800;">${movement.travelOrder}</span>
            ${movement.city}
          </div>
          <table style="border-collapse: collapse; font-size: 12px; color: #a3a3a3; width: 100%;">
            <tr><td style="padding: 3px 12px 3px 0; color: #525252; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">Time</td>
                <td style="font-weight: 500; color: #e5e5e5;">${new Date(movement.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td></tr>
            <tr><td style="padding: 3px 12px 3px 0; color: #525252; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">Lat</td>
                <td style="font-variant-numeric: tabular-nums; color: #e5e5e5;">${movement.latitude.toFixed(4)}°N</td></tr>
            <tr><td style="padding: 3px 12px 3px 0; color: #525252; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">Lng</td>
                <td style="font-variant-numeric: tabular-nums; color: #e5e5e5;">${movement.longitude.toFixed(4)}°E</td></tr>
            ${towerInfo}
          </table>
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        this.markerClickSubject.next(movement.id);
      });

      marker.addTo(this.movementLayer!);
      this.movementMarkersById.set(movement.id, marker);
      this.markerOrderById.set(movement.id, movement.travelOrder);
    });

    if (latLngs.length > 1) {
      this.routeGlowLine = L.polyline(latLngs, {
        color: '#137fec',
        weight: 10,
        opacity: 0.12,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(this.movementLayer);

      this.movementRouteLine = L.polyline(latLngs, {
        color: '#137fec',
        weight: 3,
        opacity: 0.85,
        dashArray: '10, 6',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(this.movementLayer);

      this.map.flyToBounds(this.movementRouteLine.getBounds(), {
        padding: [60, 60],
        duration: 0.8,
        maxZoom: 12,
      });
    } else {
      this.map.flyTo(latLngs[0], 8, { duration: 0.6 });
    }
  }

  focusMovement(id: string): void {
    if (!this.map) {
      return;
    }
    this.highlightMarker(id);
    const marker = this.movementMarkersById.get(id);
    if (!marker) {
      return;
    }
    const latLng = marker.getLatLng();
    const targetZoom = Math.min(Math.max(this.map.getZoom() ?? 7, 7), 10);
    this.map.flyTo(latLng, targetZoom, { duration: 0.5 });
    setTimeout(() => marker.openPopup(), 550);
  }

  private clearMovementOverlays(): void {
    this.movementLayer?.clearLayers();
    this.movementMarkersById.clear();
    this.markerOrderById.clear();
    this.movementRouteLine = undefined;
    this.routeGlowLine = undefined;
    this.highlightedMarkerId = undefined;
    this.cityClusterLayer?.clearLayers();
    this.heatmapLayer?.clearLayers();
  }

  private highlightMarker(activeId: string): void {
    if (this.highlightedMarkerId && this.highlightedMarkerId !== activeId) {
      this.resetMarkerIcon(this.highlightedMarkerId);
    }

    const marker = this.movementMarkersById.get(activeId);
    if (marker) {
      const order = this.getOrderFromMarkerId(activeId);
      marker.setIcon(this.createNumberedIcon(order, true));
    }
    this.highlightedMarkerId = activeId;
  }

  private resetMarkerIcon(id: string): void {
    const marker = this.movementMarkersById.get(id);
    if (marker) {
      const order = this.getOrderFromMarkerId(id);
      marker.setIcon(this.createNumberedIcon(order, false));
    }
  }

  private getOrderFromMarkerId(id: string): number {
    return this.markerOrderById.get(id) ?? 0;
  }

  private createNumberedIcon(order: number, active: boolean): L.DivIcon {
    const size = active ? 34 : 28;

    const styles = active
      ? `background: #137fec; color: #ffffff;
         border: 2px solid #ffffff;
         box-shadow: 0 0 20px rgba(19,127,236,0.6), 0 0 6px rgba(19,127,236,0.3);`
      : `background: #1a1a1a; color: #fafafa;
         border: 2px solid rgba(255,255,255,0.4);
         box-shadow: 0 2px 10px rgba(0,0,0,0.5);`;

    return L.divIcon({
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2 + 4)],
      html: `<div style="
        width: ${size}px; height: ${size}px;
        ${styles}
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: ${active ? 13 : 11}px; font-weight: 700;
        font-family: 'Inter', -apple-system, system-ui, sans-serif;
        transition: all 0.2s ease;
      ">${order}</div>`,
    });
  }

  // ─── Cell Tower Layer ────────────────────────────────────

  renderCellTowers(towers: CellTower[]): void {
    if (!this.map || !this.cellTowerLayer) return;
    this.cellTowerLayer.clearLayers();
    this.cellTowerMarkersById.clear();

    towers.forEach((tower) => {
      const marker = L.marker([tower.latitude, tower.longitude], {
        icon: this.createCellTowerIcon(false),
      });

      const typeLabel = tower.type.charAt(0).toUpperCase() + tower.type.slice(1);

      marker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; font-size: 13px; padding: 10px; min-width: 170px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 6px; background: rgba(245,158,11,0.15); color: #f59e0b; font-size: 14px;">&#x1F4F6;</span>
            <span style="font-weight: 700; color: #fafafa;">${tower.name}</span>
          </div>
          <table style="border-collapse: collapse; font-size: 12px; width: 100%;">
            <tr><td style="padding: 2px 10px 2px 0; color: #525252; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">ID</td>
                <td style="color: #e5e5e5; font-weight: 500;">${tower.id}</td></tr>
            <tr><td style="padding: 2px 10px 2px 0; color: #525252; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">City</td>
                <td style="color: #e5e5e5; font-weight: 500;">${tower.city}</td></tr>
            <tr><td style="padding: 2px 10px 2px 0; color: #525252; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">Type</td>
                <td style="color: #f59e0b; font-weight: 600;">${typeLabel}</td></tr>
            <tr><td style="padding: 2px 10px 2px 0; color: #525252; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">Coords</td>
                <td style="color: #e5e5e5; font-variant-numeric: tabular-nums;">${tower.latitude.toFixed(4)}°N, ${tower.longitude.toFixed(4)}°E</td></tr>
          </table>
        </div>
      `);

      marker.addTo(this.cellTowerLayer!);
      this.cellTowerMarkersById.set(tower.id, marker);
    });
  }

  showCellTowerLayer(): void {
    if (this.map && this.cellTowerLayer) {
      this.cellTowerLayer.addTo(this.map);
    }
  }

  hideCellTowerLayer(): void {
    if (this.map && this.cellTowerLayer) {
      this.map.removeLayer(this.cellTowerLayer);
    }
  }

  highlightLastConnectedTower(towerId: string | null | undefined): void {
    if (this.signalRadiusCircle && this.map) {
      this.map.removeLayer(this.signalRadiusCircle);
      this.signalRadiusCircle = undefined;
    }

    if (this.highlightedTowerId) {
      const prev = this.cellTowerMarkersById.get(this.highlightedTowerId);
      if (prev) {
        prev.setIcon(this.createCellTowerIcon(false));
      }
      this.highlightedTowerId = undefined;
    }

    if (!towerId) return;

    const marker = this.cellTowerMarkersById.get(towerId);
    if (marker && this.map) {
      marker.setIcon(this.createCellTowerIcon(true));
      this.highlightedTowerId = towerId;

      const pos = marker.getLatLng();
      this.signalRadiusCircle = L.circle([pos.lat, pos.lng], {
        radius: 15000,
        color: '#ef4444',
        weight: 1.5,
        opacity: 0.4,
        fillColor: '#ef4444',
        fillOpacity: 0.06,
        dashArray: '6, 4',
        className: 'signal-radius',
      }).addTo(this.map);
    }
  }

  private createCellTowerIcon(highlighted: boolean): L.DivIcon {
    const size = highlighted ? 36 : 26;
    const bg = highlighted
      ? 'background: #ef4444; border: 2px solid #ffffff; box-shadow: 0 0 20px rgba(239,68,68,0.6), 0 0 8px rgba(239,68,68,0.3); animation: tower-pulse 2s infinite;'
      : 'background: #292524; border: 2px solid rgba(245,158,11,0.5); box-shadow: 0 2px 8px rgba(0,0,0,0.5);';
    const color = highlighted ? '#ffffff' : '#f59e0b';

    return L.divIcon({
      className: highlighted ? 'tower-highlight' : '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2 + 4)],
      html: `<div style="
        width: ${size}px; height: ${size}px; ${bg}
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: ${highlighted ? 16 : 12}px;
        color: ${color};
        transition: all 0.2s ease;
      "><span class="material-icons-outlined" style="font-size: ${highlighted ? 18 : 14}px;">cell_tower</span></div>`,
    });
  }

  // ─── Police Station Layer ────────────────────────────────

  renderPoliceStations(stations: PoliceStation[]): void {
    if (!this.map || !this.policeStationLayer) return;
    this.policeStationLayer.clearLayers();

    stations.forEach((station) => {
      const marker = L.marker([station.latitude, station.longitude], {
        icon: this.createPoliceStationIcon(),
      });

      marker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; font-size: 13px; padding: 10px; min-width: 170px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 6px; background: rgba(59,130,246,0.15); color: #3b82f6; font-size: 14px;">&#x1F6E1;</span>
            <span style="font-weight: 700; color: #fafafa;">${station.name}</span>
          </div>
          <table style="border-collapse: collapse; font-size: 12px; width: 100%;">
            <tr><td style="padding: 2px 10px 2px 0; color: #525252; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">Coords</td>
                <td style="color: #e5e5e5; font-variant-numeric: tabular-nums;">${station.latitude.toFixed(4)}°N, ${station.longitude.toFixed(4)}°E</td></tr>
          </table>
        </div>
      `);

      marker.addTo(this.policeStationLayer!);
    });
  }

  showPoliceStationLayer(): void {
    if (this.map && this.policeStationLayer) {
      this.policeStationLayer.addTo(this.map);
    }
  }

  hidePoliceStationLayer(): void {
    if (this.map && this.policeStationLayer) {
      this.map.removeLayer(this.policeStationLayer);
    }
  }

  private createPoliceStationIcon(): L.DivIcon {
    const size = 26;
    return L.divIcon({
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2 + 4)],
      html: `<div style="
        width: ${size}px; height: ${size}px;
        background: #1e3a5f; border: 2px solid rgba(59,130,246,0.5);
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        color: #60a5fa; transition: all 0.2s ease;
      "><span class="material-icons-outlined" style="font-size: 14px;">local_police</span></div>`,
    });
  }

  // ─── Cluster / Heatmap Layers ────────────────────────────

  renderClustersForMovements(movements: MovementEntry[]): void {
    if (!this.map || !this.cityClusterLayer) return;

    const locations = movements.map((m) => ({
      latitude: m.latitude,
      longitude: m.longitude,
      city: m.city,
    }));

    this.renderCityClusters(locations);
  }

  renderHeatmapForMovements(movements: MovementEntry[]): void {
    if (!this.map || !this.heatmapLayer) return;

    const points = movements.map((m) => ({
      latitude: m.latitude,
      longitude: m.longitude,
      intensity: 1,
    }));

    this.renderHeatmap(points);
  }

  renderCityClusters(locations: { latitude: number; longitude: number; city: string }[]): void {
    if (!this.map || !this.cityClusterLayer) return;
    this.cityClusterLayer.clearLayers();

    const byCity = new Map<string, { latSum: number; lngSum: number; count: number }>();

    locations.forEach((loc) => {
      const existing = byCity.get(loc.city);
      if (existing) {
        existing.latSum += loc.latitude;
        existing.lngSum += loc.longitude;
        existing.count += 1;
      } else {
        byCity.set(loc.city, { latSum: loc.latitude, lngSum: loc.longitude, count: 1 });
      }
    });

    const clusterLatLngs: L.LatLngExpression[] = [];

    byCity.forEach((agg, city) => {
      const lat = agg.latSum / agg.count;
      const lng = agg.lngSum / agg.count;

      const marker = L.circleMarker([lat, lng], {
        radius: 14 + agg.count * 3,
        color: 'rgba(245,158,11,0.9)',
        fillColor: 'rgba(245,158,11,0.18)',
        fillOpacity: 0.9,
        weight: 2.5,
      }).bindPopup(
        `<div style="font-family: 'Inter', sans-serif; padding: 4px;">
          <strong style="color: #fafafa;">${city}</strong><br>
          <span style="color: #a3a3a3; font-size: 12px;">${agg.count} movements</span>
        </div>`,
      );

      marker.addTo(this.cityClusterLayer!);
      clusterLatLngs.push([lat, lng]);
    });

    if (clusterLatLngs.length && this.map) {
      const bounds = L.latLngBounds(clusterLatLngs);
      this.map.fitBounds(bounds, { padding: [60, 60], maxZoom: 8 });
    }
  }

  clearCityClusters(): void {
    this.cityClusterLayer?.clearLayers();
  }

  renderHeatmap(points: { latitude: number; longitude: number; intensity?: number }[]): void {
    if (!this.map || !this.heatmapLayer) return;
    this.heatmapLayer.clearLayers();

    const heatLatLngs: L.LatLngExpression[] = [];

    points.forEach((p) => {
      const intensity = p.intensity ?? 1;
      const radius = 20000 + intensity * 10000; // meters
      const circle = L.circle([p.latitude, p.longitude], {
        radius,
        color: 'rgba(56,189,248,0.9)',
        weight: 1,
        fillColor: 'rgba(56,189,248,0.3)',
        fillOpacity: 0.35 + Math.min(intensity * 0.1, 0.3),
      });
      circle.addTo(this.heatmapLayer!);
      heatLatLngs.push([p.latitude, p.longitude]);
    });

    if (heatLatLngs.length && this.map) {
      const bounds = L.latLngBounds(heatLatLngs);
      this.map.fitBounds(bounds, { padding: [60, 60], maxZoom: 7 });
    }
  }

  clearHeatmap(): void {
    this.heatmapLayer?.clearLayers();
  }

  renderThreatForecast(
    origin: { lat: number; lng: number },
    cities: { lat: number; lng: number; city: string; threatScore: number; priority: number }[],
  ): void {
    if (!this.map || !this.forecastLayer || !cities.length) return;
    this.forecastLayer.clearLayers();

    const latLngs: L.LatLngExpression[] = [];

    cities.forEach((c) => {
      const weight = 2 + c.threatScore / 40;
      const color =
        c.priority === 1 ? '#ef4444' : c.priority === 2 ? '#f97316' : '#22c55e';

      const arc = L.polyline(
        [
          [origin.lat, origin.lng],
          [c.lat, c.lng],
        ],
        {
          color,
          weight,
          opacity: 0.8,
          dashArray: '8,6',
          lineCap: 'round',
        },
      ).addTo(this.forecastLayer!);

      const arcLatLngs = arc.getLatLngs() as L.LatLng[];
      arcLatLngs.forEach((ll) => latLngs.push([ll.lat, ll.lng]));

      const label = L.divIcon({
        className: '',
        iconSize: [140, 26],
        iconAnchor: [70, 13],
        html: `<div style="
          display:flex;align-items:center;justify-content:space-between;
          padding:4px 8px;border-radius:999px;
          background:rgba(15,23,42,0.9);border:1px solid ${color}66;
          color:#e5e7eb;font-size:11px;font-weight:600;
          font-family:'Inter',sans-serif;
        ">
          <span>P${c.priority} · ${c.city}</span>
          <span style="color:${color};">${c.threatScore}</span>
        </div>`,
      });

      L.marker([c.lat, c.lng], { icon: label }).addTo(this.forecastLayer!);
    });

    if (latLngs.length) {
      const bounds = L.latLngBounds(latLngs);
      this.map.fitBounds(bounds, { padding: [80, 80] });
    }
  }

  clearThreatForecast(): void {
    this.forecastLayer?.clearLayers();
  }

  renderSignalTriangulation(
    anchorLat: number,
    anchorLng: number,
    towers: Pick<CellTower, 'id' | 'name' | 'latitude' | 'longitude'>[],
  ): void {
    if (!this.map || !this.predictionLayer || towers.length < 2) return;

    // Clear only triangulation visuals, keep prediction/nearest lines
    this.predictionLayer.clearLayers();

    const radiusMeters = 20000;
    const circleStyle: L.CircleMarkerOptions = {
      color: 'rgba(245,158,11,0.7)',
      weight: 1.5,
      opacity: 0.7,
      fillColor: 'rgba(245,158,11,0.12)',
      fillOpacity: 0.4,
    };

    towers.forEach((tower) => {
      const circle = L.circle([tower.latitude, tower.longitude], {
        ...circleStyle,
        radius: radiusMeters,
      });
      circle.addTo(this.predictionLayer!);
    });

    if (towers.length >= 3) {
      const pts = towers.slice(0, 3).map((t) => [t.latitude, t.longitude] as [number, number]);

      // Triangle connecting tower centers
      L.polygon(pts, {
        color: '#f59e0b',
        weight: 1,
        opacity: 0.8,
        dashArray: '4,4',
        fillColor: 'rgba(245,158,11,0.18)',
        fillOpacity: 0.25,
      }).addTo(this.predictionLayer!);

      const centroidLat =
        (pts[0][0] + pts[1][0] + pts[2][0]) / 3;
      const centroidLng =
        (pts[0][1] + pts[1][1] + pts[2][1]) / 3;

      const estimateIcon = L.divIcon({
        className: '',
        iconSize: [90, 26],
        iconAnchor: [45, 13],
        html: `<div style="
          display:flex;align-items:center;justify-content:center;gap:4px;
          padding:3px 8px;border-radius:999px;
          background:rgba(245,158,11,0.18);border:1px solid rgba(245,158,11,0.4);
          color:#fed7aa;font-size:10px;font-weight:700;
          font-family:'Inter',sans-serif;white-space:nowrap;
        "><span class="material-icons-outlined" style="font-size:12px;">my_location</span>
          Estimated zone</div>`,
      });

      L.marker([centroidLat, centroidLng], { icon: estimateIcon }).addTo(
        this.predictionLayer!,
      );
    }

    // Focus view around anchor point and towers
    const allLatLngs = [
      [anchorLat, anchorLng],
      ...towers.map((t) => [t.latitude, t.longitude]),
    ] as L.LatLngExpression[];
    const bounds = L.latLngBounds(allLatLngs);
    this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
  }

  // ─── Prediction & Nearest Station ─────────────────────────

  renderPredictionLine(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
    cityName: string,
    confidence: number,
  ): void {
    this.clearPrediction();
    if (!this.map || !this.predictionLayer) return;

    const dashedLine = L.polyline(
      [[fromLat, fromLng], [toLat, toLng]],
      {
        color: '#06b6d4',
        weight: 2.5,
        opacity: 0.7,
        dashArray: '8, 8',
        lineCap: 'round',
      },
    ).addTo(this.predictionLayer);

    const predIcon = L.divIcon({
      className: '',
      iconSize: [120, 32],
      iconAnchor: [60, 16],
      html: `<div style="
        display: flex; align-items: center; justify-content: center; gap: 4px;
        padding: 4px 10px; border-radius: 999px;
        background: rgba(6,182,212,0.15); border: 1px solid rgba(6,182,212,0.3);
        color: #06b6d4; font-size: 11px; font-weight: 700;
        font-family: 'Inter', sans-serif; white-space: nowrap;
      "><span class="material-icons-outlined" style="font-size: 13px;">location_searching</span>
        ${cityName} (${confidence}%)</div>`,
    });

    L.marker([toLat, toLng], { icon: predIcon }).addTo(this.predictionLayer);
  }

  clearPrediction(): void {
    this.predictionLayer?.clearLayers();
  }

  renderNearestStationLine(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
    stationName: string,
    distanceKm: number,
  ): void {
    this.clearNearestStationLine();
    if (!this.map || !this.predictionLayer) return;

    this.nearestStationLine = L.polyline(
      [[fromLat, fromLng], [toLat, toLng]],
      {
        color: '#3b82f6',
        weight: 2,
        opacity: 0.5,
        dashArray: '6, 6',
        lineCap: 'round',
      },
    ).addTo(this.predictionLayer);

    const midLat = (fromLat + toLat) / 2;
    const midLng = (fromLng + toLng) / 2;

    const distIcon = L.divIcon({
      className: '',
      iconSize: [100, 24],
      iconAnchor: [50, 12],
      html: `<div style="
        display: flex; align-items: center; justify-content: center; gap: 3px;
        padding: 3px 8px; border-radius: 999px;
        background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.25);
        color: #60a5fa; font-size: 10px; font-weight: 700;
        font-family: 'Inter', sans-serif; white-space: nowrap;
      "><span class="material-icons-outlined" style="font-size: 11px;">local_police</span>
        ${distanceKm} km</div>`,
    });

    L.marker([midLat, midLng], { icon: distIcon }).addTo(this.predictionLayer);
  }

  clearNearestStationLine(): void {
    if (this.nearestStationLine && this.map) {
      this.map.removeLayer(this.nearestStationLine);
      this.nearestStationLine = undefined;
    }
  }

  renderConversationLocations(
    locations: { city: string; lat: number; lng: number; context: string }[],
  ): void {
    if (!this.map || !this.predictionLayer) return;

    locations.forEach((loc) => {
      const icon = L.divIcon({
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -18],
        html: `<div style="
          width: 28px; height: 28px;
          background: rgba(168,85,247,0.2); border: 2px solid #a855f7;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 12px rgba(168,85,247,0.4);
        "><span class="material-icons-outlined" style="font-size: 14px; color: #a855f7;">chat</span></div>`,
      });

      L.marker([loc.lat, loc.lng], { icon })
        .bindPopup(`
          <div style="font-family: 'Inter', sans-serif; font-size: 13px; padding: 10px; min-width: 180px;">
            <div style="font-weight: 700; color: #a855f7; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
              <span style="font-size: 12px;">&#128172;</span> ${loc.city}
            </div>
            <div style="font-size: 12px; color: #e5e5e5; font-style: italic; line-height: 1.4;">"${loc.context}"</div>
            <div style="font-size: 10px; color: #525252; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.06em;">From intercepted communications</div>
          </div>
        `)
        .addTo(this.predictionLayer!);
    });
  }

  // ─── Cleanup ─────────────────────────────────────────────

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    if (this.map) {
      this.map.remove();
      this.map = undefined;
      this.movementLayer = undefined;
      this.cityClusterLayer = undefined;
      this.heatmapLayer = undefined;
      this.cellTowerLayer = undefined;
      this.policeStationLayer = undefined;
      this.predictionLayer = undefined;
      this.movementMarkersById.clear();
      this.markerOrderById.clear();
      this.cellTowerMarkersById.clear();
      this.movementRouteLine = undefined;
      this.signalRadiusCircle = undefined;
      this.nearestStationLine = undefined;
    }
    this.markerClickSubject.complete();
  }
}
