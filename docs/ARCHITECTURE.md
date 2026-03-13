## 1. Project Overview

Suspect Intelligence Map is a **map‑based investigation dashboard** that helps investigators analyze suspect movements, events, and intelligence insights using an OpenStreetMap‑centric interface.

The application:

- Visualizes **suspect movement routes** on a Leaflet map.
- Links movements to a **timeline** and **intelligence statistics**.
- Provides a **suspect sidebar** with risk indicators.
- Uses **mock JSON** data to simulate a backend.

**Technology stack**

- **Angular** (standalone components, Angular 17+ style)
- **Leaflet** for map rendering
- **OpenStreetMap** as the tile provider
- **TypeScript** for strict typing
- **SCSS** for styling
- **RxJS** for reactive data flows

At a high level, the UI is a **3‑column dashboard**:

- Left: Suspects + filters.
- Center: Map workspace (primary investigation surface).
- Right: Timeline + intelligence statistics (and future events/notes).


## 2. High Level Architecture

The system follows a **layered architecture**:

- **Presentation Layer (UI / Components)**
  - Angular standalone components in `src/app/features` and `src/app/app.*`.
  - Responsible only for UI and simple interaction logic.

- **Feature Components**
  - Grouped by feature under `src/app/features`:
    - `map-workspace`
    - `suspects`
    - `timeline`
    - `intel`
    - (future: `events`, `notes`)
  - Each feature encapsulates its own view and delegates to services.

- **Services**
  - Under `src/app/core/services`.
  - Own:
    - Data loading from mock JSON.
    - Map configuration and layer management.
    - Basic derivations for statistics and clustering.
  - Follow “smart services, dumb components”.

- **Data Models**
  - Under `src/app/models`.
  - Provide TypeScript interfaces for all domain entities (suspects, movements, events, police stations, notes).

- **Mock Data**
  - Under `src/app/mock-data`.
  - JSON files for suspects, movements, events, police stations, and notes.

**Top‑level UI composition**

```text
App (src/app/app.ts + app.html)
│
├── Left Sidebar (Suspects)
│     └─ SuspectListComponent
│
├── Map Workspace (Center)
│     └─ MapWorkspaceComponent
│           └─ MapService (Leaflet)
│
└── Right Panel (Intelligence)
      ├─ TimelineComponent
      └─ IntelPanelComponent
```

`App` acts as a **thin coordinator**:

- Receives suspect selection from the left sidebar.
- Passes `selectedSuspectId` and `selectedMovementId` down to map + timeline.
- Maintains no domain logic; only orchestrates component communication.


## 3. Folder Structure

All project code lives under `src/app`:

```text
src/app
  app.ts / app.html / app.scss / app.config.ts

  core/
    services/
      map.service.ts
      movement.service.ts
      suspect.service.ts
      event.service.ts
      police.service.ts
      notes.service.ts

  features/
    map-workspace/
      map-workspace.component.ts|html|scss

    suspects/
      suspect-list.component.ts|html|scss

    timeline/
      timeline.component.ts|html|scss

    intel/
      intel-panel.component.ts|html|scss

    events/           (placeholder for event-focused UIs)
    notes/            (placeholder for notes UIs)

  shared/
    components/
      glass-card/
        glass-card.component.ts|html|scss
      icon-button/
        icon-button.component.ts|html|scss

  models/
    suspect.model.ts
    movement.model.ts
    event.model.ts
    police.model.ts
    note.model.ts

  mock-data/
    suspects.json
    movements.json
    events.json
    police-stations.json
    notes.json
```

**Folder responsibilities**

- `core/services`  
  Cross‑cutting application logic:
  - Loading and transforming data.
  - Managing map configuration and intelligence layers.
  - Encapsulating all non‑trivial logic so components remain UI‑focused.

- `features/map-workspace`  
  **Primary map workspace**. Hosts the Leaflet map and integrates movement visualization.

- `features/suspects`  
  Left sidebar UI for suspect list, risk levels, and selection.

- `features/timeline`  
  Right panel timeline UI, synchronized with map movements.

- `features/intel`  
  Intelligence panel with statistics and future analytic widgets.

- `features/events` / `features/notes`  
  Reserved for future event list and notes UI (currently minimal or empty).

- `shared/components`  
  Reusable UI primitives (`glass-card`, `icon-button`) implementing the **glassmorphism** design language.

- `models`  
  All domain interfaces, shared across services and components for strict typing.

- `mock-data`  
  Local JSON data files simulating backend APIs. All services read from here.


## 4. Map System

The **map system** is responsible for:

- Initializing the Leaflet map with OpenStreetMap tiles.
- Rendering markers and movement routes.
- Providing overlays for clusters and heatmaps (intelligence features).

### Components & Services

- `features/map-workspace/map-workspace.component.ts`
- `core/services/map.service.ts`

### Initialization flow

1. `App` embeds `MapWorkspaceComponent` in the center:

   - `src/app/app.html`

2. `MapWorkspaceComponent`:

   ```ts
   // src/app/features/map-workspace/map-workspace.component.ts
   @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

   ngAfterViewInit(): void {
     this.mapService.initMap(this.mapContainer.nativeElement);
     this.loadMovements();
   }
   ```

3. `MapService.initMap` creates the Leaflet map and base layers:

   ```ts
   // src/app/core/services/map.service.ts
   this.map = L.map(container, {
     center: [20.5937, 78.9629],
     zoom: 5,
     ...options,
   });

   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
     maxZoom: 19,
     attribution: '&copy; OpenStreetMap contributors',
   }).addTo(this.map);
   ```

4. `MapService` also creates dedicated `LayerGroup`s:

   - `movementLayer` – for polylines and movement markers.
   - `cityClusterLayer` – for city cluster circles.
   - `heatmapLayer` – for heatmap‑like visualizations.

### Markers and polylines

Currently, `MapWorkspaceComponent`:

- Loads all movements via `MovementService`.
- Filters by `selectedSuspectId`.
- Creates markers and polylines directly with Leaflet.

Key methods:

```ts
// src/app/features/map-workspace/map-workspace.component.ts
private renderForSelectedSuspect(): void {
  const map = this.mapService.getMap();
  ...
  const movementsForSuspect = this.movements
    .filter((m) => m.suspectId === this.selectedSuspectId)
    .sort((a, b) => a.travelOrder - b.travelOrder);

  const latLngs: L.LatLngExpression[] = [];
  movementsForSuspect.forEach((movement) => {
    const position: L.LatLngExpression = [movement.latitude, movement.longitude];
    latLngs.push(position);

    const marker = L.marker(position);
    marker.bindPopup(
      `<strong>${movement.city}</strong><br>${movement.timestamp}`,
    );
    marker.addTo(map);
    this.markersById.set(movement.id, marker);
  });

  if (latLngs.length > 1) {
    this.routeLine = L.polyline(latLngs).addTo(map);
    map.fitBounds(this.routeLine.getBounds(), { padding: [24, 24] });
  } else {
    map.setView(latLngs[0], 8);
  }
}
```

**Popups** are bound per marker with city + timestamp:

- The `movement.order` is represented implicitly by the **polyline order** and the timeline.

### Intelligence layers in `MapService`

For more advanced visuals, `MapService` offers helpers:

- `renderMovementPolyline(points: L.LatLngExpression[])`
- `renderCityClusters(locations: { latitude; longitude; city }[])`
- `renderHeatmap(points: { latitude; longitude; intensity? }[])`

Future enhancements (e.g., switching from direct `L.polyline` to `MapService.renderMovementPolyline`) should be done in `MapWorkspaceComponent`.

### Modifying map behavior

- **Change base map / tile provider**:  
  Edit the tile layer URL and options in `map.service.ts`.

- **Change marker appearance or popup content**:  
  Update marker creation logic in `MapWorkspaceComponent` (or move it into `MapService` if you want more reuse).

- **Add new overlays (e.g., additional layers, circles)**:  
  Add new `LayerGroup`s and helper methods inside `MapService`.


## 5. Suspect System

Responsible for:

- Loading suspects.
- Displaying them in the left sidebar.
- Highlighting selection and risk.
- Emitting the selected suspect to drive map + timeline.

### Files

- `core/services/suspect.service.ts`
- `features/suspects/suspect-list.component.ts|html|scss`
- `models/suspect.model.ts`
- `mock-data/suspects.json`

### Data loading

`SuspectService` reads `suspects.json`:

```ts
// src/app/core/services/suspect.service.ts
getSuspects(): Observable<Suspect[]> {
  return this.http.get<Suspect[]>('/app/mock-data/suspects.json');
}
```

The suspect model:

```ts
// src/app/models/suspect.model.ts
export interface Suspect {
  id: string;
  displayName: string;
  riskLevel?: 'low' | 'medium' | 'high';
}
```

### Sidebar UI

`SuspectListComponent`:

- Subscribes to `SuspectService.getSuspects()`.
- Tracks `selectedId$`.
- Emits `suspectSelected` to the parent (`App`).

Template highlights:

- Glass card wrapper.
- Name + risk level pill.
- Selected/hover/focus styling.

Adding a new suspect:

1. Edit `src/app/mock-data/suspects.json`.
2. Ensure each suspect has a unique `id`.
3. Optionally specify a `riskLevel` of `'low' | 'medium' | 'high'`.


## 6. Movement Tracking System

Responsible for:

- Representing movement entries.
- Loading movements from JSON.
- Rendering movement routes on the map.

### Files

- `core/services/movement.service.ts`
- `models/movement.model.ts`
- `mock-data/movements.json`
- `features/map-workspace/map-workspace.component.ts`
- `features/timeline/timeline.component.ts`

Model:

```ts
// src/app/models/movement.model.ts
export interface MovementEntry {
  id: string;
  suspectId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  city: string;
  travelOrder: number;
}
```

Service:

```ts
// src/app/core/services/movement.service.ts
getMovements(): Observable<MovementEntry[]> {
  return this.http.get<MovementEntry[]>('/app/mock-data/movements.json');
}
```

Route generation:

- Filter movements by `suspectId`.
- Sort by `travelOrder`.
- Convert to Leaflet lat/lng array.
- Draw polyline and set map view.


## 7. Timeline System

Responsible for:

- Displaying movements chronologically.
- Linking timeline clicks to map focus.

### Files

- `features/timeline/timeline.component.ts|html|scss`

`TimelineComponent`:

- Inputs:
  - `selectedSuspectId`
  - `selectedMovementId`
- Output:
  - `movementSelected` (movement id)

On input changes:

- Loads all movements from `MovementService`.
- Filters by `selectedSuspectId`.
- Sorts by `travelOrder`.

When a user clicks a timeline item:

- Emits `movementSelected`.
- `App` sets `selectedMovementId`.
- `MapWorkspaceComponent` receives `selectedMovementId` and calls `focusSelectedMovement` to center and open the popup for that marker.


## 8. Intelligence Panel

Responsible for:

- Displaying top‑level statistics.
- Future intelligence widgets (suspicious patterns, clustering, comparisons).

### Files

- `core/services/event.service.ts`
- `core/services/notes.service.ts`
- `features/intel/intel-panel.component.ts|html|scss`
- `mock-data/events.json`
- `mock-data/notes.json`

`IntelPanelComponent`:

- Loads movements and events.
- Computes:
  - Total movement count.
  - Distinct city count.
  - Total event count.

```ts
// src/app/features/intel/intel-panel.component.ts
this.stats$ = combineLatest([movements$, events$]).pipe(
  map(([movements, events]) => {
    const citySet = new Set(movements.map((m) => m.city));
    return {
      totalMovements: movements.length,
      citiesVisited: citySet.size,
      eventsRecorded: events.length,
    };
  }),
);
```

Displayed as cards inside a glass panel on the right.


## 9. Data Models

Located in `src/app/models`:

### `Suspect`

```ts
export interface Suspect {
  id: string;                  // unique identifier
  displayName: string;         // human‑readable name
  riskLevel?: 'low' | 'medium' | 'high';  // optional risk assessment
}
```

### `MovementEntry`

```ts
export interface MovementEntry {
  id: string;                  // unique movement id
  suspectId: string;           // foreign key to Suspect.id
  timestamp: string;           // ISO datetime string
  latitude: number;            // GPS latitude
  longitude: number;           // GPS longitude
  city: string;                // city label
  travelOrder: number;         // ordering within suspect’s route
}
```

### `InvestigationEvent`

```ts
export interface InvestigationEvent {
  id: string;                  // unique event id
  suspectId: string;           // suspect associated with the event
  movementId?: string;         // optional link to a MovementEntry
  title: string;               // short event title
  description?: string;        // detailed description
  timestamp: string;           // when event occurred
  latitude: number;
  longitude: number;
}
```

### `PoliceStation`

```ts
export interface PoliceStation {
  id: string;      // unique station id
  name: string;    // station name
  latitude: number;
  longitude: number;
}
```

### `InvestigationNote`

```ts
export interface InvestigationNote {
  id: string;          // unique note id
  suspectId: string;   // suspect associated to this note
  content: string;     // free‑text note
  timestamp: string;   // note creation time
}
```


## 10. How to Modify Features

### Example 1: Add a new map marker type

Goal: Display an additional marker for a special event type.

1. Add a field or event type to `InvestigationEvent` if needed.
2. In `MapWorkspaceComponent` (or a new helper in `MapService`), create markers based on the events:

   ```ts
   const map = this.mapService.getMap();
   this.eventService.getEvents().subscribe(events => {
     events.forEach(event => {
       const marker = L.marker([event.latitude, event.longitude], {
         // custom icon or options
       }).bindPopup(`<strong>${event.title}</strong><br>${event.timestamp}`);
       marker.addTo(map!);
     });
   });
   ```

3. Optionally, move this into `MapService` (e.g., `renderEventMarkers`) if used from multiple places.


### Example 2: Add a new suspect property

Goal: Track suspect nationality.

1. Update `Suspect` model (`suspect.model.ts`):

   ```ts
   export interface Suspect {
     ...
     nationality?: string;
   }
   ```

2. Update mock data (`mock-data/suspects.json`), e.g.:

   ```json
   { "id": "s1", "displayName": "Ravi Kumar", "riskLevel": "high", "nationality": "IN" }
   ```

3. Update `SuspectListComponent` template to render the new field.


### Example 3: Add a new intelligence panel widget

Goal: Show “average hops per suspect”.

1. In `IntelPanelComponent`, extend the `IntelligenceStats` interface and computed stats:

   ```ts
   interface IntelligenceStats {
     totalMovements: number;
     citiesVisited: number;
     eventsRecorded: number;
     avgMovementsPerSuspect: number;
   }
   ```

2. In the `combineLatest` map, compute `avgMovementsPerSuspect`:

   ```ts
   const suspectCount = new Set(movements.map(m => m.suspectId)).size || 1;
   avgMovementsPerSuspect: movements.length / suspectCount
   ```

3. Add a new card in `intel-panel.component.html` to display the metric.


### Example 4: Change the map tile provider

Goal: Switch from OpenStreetMap to another provider (e.g., Mapbox / custom tiles).

1. Open `core/services/map.service.ts`.
2. Replace the `L.tileLayer` URL and options:

   ```ts
   L.tileLayer('https://{s}.your-tiles.com/{z}/{x}/{y}.png', {
     maxZoom: 19,
     attribution: '&copy; Your Provider',
   }).addTo(this.map);
   ```

3. Ensure you comply with tile provider terms of use (keys, attributions, etc.).


## 11. UI Design System

The UI follows a **glassmorphism + dark intelligence dashboard** style:

- Background: dark gradient (`app.scss`).
- Panels: `app-glass-card` with blur, subtle borders, and soft shadows.
- Layout:
  - `display: grid` with columns `280px 1fr 320px`.
  - Full height: `height: 100vh`.
- Typography:
  - System UI fonts; uppercase headers with tracking for section titles.

**Shared components**

- `GlassCardComponent`  
  Wraps any content in a glass card.

  ```scss
  .glass-card {
    background: rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(12px);
  }
  ```

- `IconButtonComponent`  
  Rounded glass pill button with icon slot and label.

Spacing / alignment:

- Panels use internal padding of around `1rem`.
- List items use `0.5rem` vertical padding and `0.25rem` gaps.

Interactive states:

- List and timeline entries have:
  - Hover background lightening.
  - Selected state with more solid background.
  - Keyboard `focus-visible` with a subtle outline.


## 12. Development Guidelines

The project adheres to the following principles:

- **Services handle logic**
  - All data fetching and complex calculations live in `core/services`.
  - Map interactions and overlays are encapsulated in `MapService`.

- **Components handle UI**
  - Components in `features/*` should:
    - Render data provided by services.
    - Expose inputs/outputs for communication.
    - Avoid business logic in templates.

- **Models define types**
  - All domain objects have TypeScript interfaces in `models/*`.
  - Services and components rely on these for compile‑time safety.

- **Mock data simulates backend**
  - JSON files in `mock-data/*` act as the single source of truth.
  - HTTP clients (`HttpClient`) are wired with relative URLs (`/app/mock-data/*.json`), making it easier to later swap to a real API.

- **Angular best practices**
  - Standalone components.
  - Reactive streams with RxJS.
  - “Smart services, dumb components”.


## 13. Future Improvements

Some potential evolution points:

- **Real API integration**
  - Replace `mock-data` with real REST endpoints.
  - Add error handling, retry, and authentication layers in services.

- **WebSocket live tracking**
  - Subscribe to live movement updates via WebSocket/SSE.
  - Stream new `MovementEntry` items to the map in real time.

- **Map clustering**
  - Introduce proper clustering (e.g., `leaflet.markercluster` or `supercluster`) for dense areas.
  - Replace basic city clustering with zoom‑aware clusters.

- **Timeline playback**
  - Add playback controls (using `IconButtonComponent`) to animate movement over time.
  - Sync map center and timeline highlight with playback position.

- **Per‑suspect intelligence**
  - Filter statistics and clusters per selected suspect (currently global).
  - Add comparison views between suspects.

- **Events and notes UI**
  - Implement `features/events` and `features/notes` to surface investigation events and notes in the right panel and on the map.

This architecture and documentation are intended to make it easy for future developers to extend the dashboard while preserving a clean, investigation‑grade UX and a maintainable Angular codebase.

