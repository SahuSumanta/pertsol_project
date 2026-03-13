# Suspect Movement Intelligence Dashboard

**Professional documentation for recruiters, reviewers, and judges**

---

## 1. Project Overview

The **Suspect Movement Intelligence Dashboard** is a geospatial investigation platform that helps law enforcement analyze suspect movement and intelligence data in one unified workspace. The system transforms fragmented intelligence—call logs, browsing history, movement records, and investigation events—into a visual, map-centric investigation environment.

**Purpose:**  
Investigators receive raw movement logs, communication intercepts, and event data from multiple sources. Without a visual intelligence platform, it is difficult to reconstruct travel paths, correlate locations with communications, or identify suspicious patterns. This dashboard solves that by:

- **Visualizing suspect routes** on an interactive map with markers, polylines, and timeline sync
- **Correlating digital intelligence** (calls, messages, browsing) with geographic locations
- **Supporting predictive and replay tools** such as next-location prediction, Time Warp playback, and threat trajectory forecast

**Key capabilities:**

- **Geospatial tracking** — Suspect routes, city markers, travel order, and day-based filtering
- **Timeline replay** — Time Warp Investigation Mode to scrub and replay movement chronologically
- **Communication intelligence** — Call logs, intercepted messages, and browsing history tied to suspects
- **Tower analysis** — Cell tower layer, last-connected tower highlight with signal radius, and signal triangulation
- **Predictive investigation tools** — Next-location prediction, nearest police station, risk score engine, and threat trajectory forecast (top predicted cities with arcs on the map)

---

## 2. Problem Statement

**Real-world problem:**  
Investigators receive fragmented intelligence: call logs, intercepted messages, browsing history, movement pings, and investigation events. Data is scattered across systems and time. Without a visual intelligence platform, it is difficult to:

- Reconstruct where a suspect traveled and in what order
- Connect communications to specific locations or time windows
- Identify suspicious patterns (repeated cities, fast hops between cities)
- Assess risk or predict likely next movements
- Share case context with other officers efficiently

**How this system solves it:**  
The dashboard aggregates movement, events, and digital intelligence into a single interface. The **map is the primary workspace**: selecting a suspect loads their route; clicking the timeline focuses the map; clicking a marker highlights the timeline and opens a **Location Intelligence** panel with aggregated activity at that spot (calls, messages, browsing, connected tower, nearest station). Investigators can replay movement (Time Warp), see predicted next location and threat trajectory, and use risk scores and pattern detection to prioritize leads—all without switching tools.

---

## 3. Key Features

### Map Intelligence

- Suspect route visualization (markers + polyline)
- Movement timeline with map–timeline sync (click timeline → focus marker; click marker → highlight timeline)
- Base layer switching (Dark Tactical, OpenStreetMap, Light)
- Marker clustering and heatmap toggles
- Cell tower layer (antenna icons); last-connected tower highlight with pulsing marker and signal radius circle
- Police station layer (badge icons) with popups
- Signal triangulation (three nearest towers, coverage circles, estimated zone)
- Predicted next location (dashed line + label)
- Nearest police station line and distance
- Conversation locations from message text (e.g. “Meet at Jaipur”) as map markers
- **Threat Trajectory Forecast** — Arcs from current location to top 3 predicted cities with priority and threat score labels

### Digital Intelligence

- Call logs (contact, phone, duration, encrypted indicator)
- Intercepted messages (thread-style, encryption flags, location extraction to map)
- Browsing history (URL, category, timestamp; suspicious highlighted)
- Activity spikes (e.g. bar chart by day)

### Investigation Tools

- **Time Warp Investigation Mode** — Timeline slider to replay suspect movement; play/pause, speed control; map and tower highlight stay in sync
- Suspicious pattern detection (repeated cities, fast hops between cities)
- Predicted next location (Markov-style city transitions)
- Location Intelligence panel — Aggregated view per movement: calls, messages, browsing, events, connected tower, nearest police station
- Risk score engine — Composite score from encrypted comms, city jumps, browsing, crime zones, events; visual gauge in Intelligence panel
- Threat Trajectory Forecast — Top 3 city threats with scores and reasons; forecast arcs on map when Forecast mode is on

### Operational Tools

- Officer login (Officer ID + password; mock auth, route guard)
- Add new suspect (name, risk level, location, phone, notes)
- Case sharing — Share case with another officer (in-memory shared cases)
- Suspect Deep Intelligence screen — Full-screen workspace per suspect: profile, history, associates, call logs, messaging, browsing, activity spikes, key events, location intel, threat forecast summary; route `/suspect/:id` with back-to-dashboard navigation

---

## 4. Screen Walkthrough

### Login Screen

**Purpose:**  
Secure authentication for police officers before accessing the dashboard.

**Features:**

- Officer ID and password fields
- Validation and error message on failure
- Navigates to dashboard on success
- Dark glassmorphism styling

**Screenshot:**  
<img width="1470" height="802" alt="login" src="https://github.com/user-attachments/assets/a0b3887a-1ec5-42f3-b083-86d1e9a153a9" />

---

### Dashboard Overview

**Purpose:**  
Main 3-column workspace: left sidebar (suspects + day), center (map), right panel (timeline, intel, patterns, location intel, network, events, notes).

**Features:**

- Header with Add Suspect, Time Warp, Share, officer info, logout
- Suspect list and day selector in left sidebar
- Map fills center; floating toolbar (Route, Clusters, Heatmap, Cell Towers, Police Stations, Forecast)
- Right panel: timeline, intel metrics, pattern panel, location intel, network graph, events, notes

**Screenshot:**  
<img width="1470" height="799" alt="dashboard" src="https://github.com/user-attachments/assets/1e883a7c-dc69-4a7a-b3a1-1bef2767161c" />


---

### Suspect List Panel

**Purpose:**  
Select which suspect’s data to view on the map and panels.

**Features:**

- Vertical list of suspects with display name and risk level
- Selected suspect highlighted
- Movement count per suspect (from live data)
- “View profile” (open in new) navigates to Suspect Deep Intelligence screen

**Screenshot:**  
<img width="276" height="477" alt="succpectlist" src="https://github.com/user-attachments/assets/2f8f79a4-1b24-4c58-81cc-060e53187aec" />


---

### Map Intelligence Workspace

**Purpose:**  
Central map for route visualization and all map layers.

**Features:**

- Leaflet map with configurable base layers
- Route markers and polyline; popups (city, timestamp, coordinates, travel order)
- Toolbar: Route, Clusters, Heatmap, Cell Towers, Police Stations, Forecast
- Prediction line, nearest-station line, triangulation, threat forecast arcs
- Marker click → timeline highlight + Location Intelligence panel update

**Screenshot:**  
<img width="1466" height="794" alt="map" src="https://github.com/user-attachments/assets/d345131f-8a9c-4d7d-bd2b-8d7448fcec18" />


---

### Timeline Panel

**Purpose:**  
Chronological list of movements for the selected suspect/day.

**Features:**

- Time and city per movement
- Selected movement highlighted
- Click item → map focuses marker and opens popup
- Play-style controls when used with Time Warp

**Screenshot:**  
<img width="318" height="751" alt="Timeline Panel" src="https://github.com/user-attachments/assets/5fe5d4a5-d0a7-4b5f-9730-c109867af11b" />


---

### Intelligence Metrics Panel

**Purpose:**  
Show aggregate stats for the selected suspect.

**Features:**

- Total movements, cities visited, total distance (km), most visited city
- Risk score gauge (0–100) with level and breakdown legend

**Screenshot:**  
<img width="318" height="543" alt="Intelligence Metrics Panel" src="https://github.com/user-attachments/assets/1d308041-d9d4-4ca2-8846-d087ca4699d7" />


---

### Pattern Detection Panel

**Purpose:**  
Surface suspicious movement patterns.

**Features:**

- Repeated cities (city + visit count)
- Fast hops (from city → to city with times, e.g. < 4 hours between cities)

**Screenshot:**  


---

### Events Panel

**Purpose:**  
List investigation events for the selected suspect.

**Features:**

- Event title, description, timestamp
- Linked to movements where applicable

**Screenshot:**  


---

### Notes Panel

**Purpose:**  
Display investigation notes for the selected suspect.

**Features:**

- Note content and timestamp
- Simple list layout

**Screenshot:**  


---

### Network Graph Panel

**Purpose:**  
Show suspect relationships (associates network).

**Features:**

- Nodes for suspects; connections from network data
- Centered on selected suspect

**Screenshot:**  
<img width="756" height="667" alt="Network Graph Panel" src="https://github.com/user-attachments/assets/b661c62a-41dc-44da-86dc-855def7e0600" />


---

### Suspect Intelligence Profile Screen (Deep Intelligence)

**Purpose:**  
Full-screen investigative workspace for one suspect: past, present, and threat forecast.

**Features:**

- **Left column:** Profile card (avatar, name, alias, status, risk), last seen, first seen, primary corridor, activity/signal bars, known associates
- **Center column:** Tabs (Last 7 days, Last 30 days, All time); Call logs, Messaging, Browsing history
- **Right column:** Activity spikes, Key events (click → location intel + map focus), Location Intelligence panel, Threat Trajectory summary (top 3 cities + scores)
- **Top bar:** “Back to dashboard” button (fixes back routing to main dashboard)

**Route:** `/suspect/:id`

**Screenshot:**  
<img width="1469" height="801" alt="Suspect Intelligence Profile Screen" src="https://github.com/user-attachments/assets/de1ed028-e785-42f5-925f-0c77196c0f2f" />


---

### Add New Suspect Modal

**Purpose:**  
Allow officers to add a new suspect to the list.

**Features:**

- Form: Suspect name, risk level, last known location, phone, notes
- Save adds suspect via SuspectService and closes modal
- Glassmorphism overlay styling

**Screenshot:**  
<img width="745" height="781" alt="Add New Suspect Modal" src="https://github.com/user-attachments/assets/532c6828-88e8-47fc-9757-fd0cbd84301d" />


---

### Case Sharing Screen

**Purpose:**  
Share the current suspect case with another officer.

**Features:**

- Shows suspect being shared
- List of officers (excluding current user)
- Select officer, optional notes
- Share creates shared case record (in-memory)

**Screenshot:**  
<img width="508" height="549" alt="Case Sharing Screen" src="https://github.com/user-attachments/assets/29285db9-6d4b-4636-9b80-aebf564928f5" />


---

### Time Warp Investigation Mode

**Purpose:**  
Replay suspect movement over time with map and timeline in sync.

**Features:**

- Bottom bar with play/pause, speed, slider with movement markers
- Slider scrub updates current movement; map focuses marker and highlights last-connected tower
- Emits movement selection so dashboard timeline and location intel stay in sync

**Screenshot:**  


---

## 5. Map Intelligence System

The map is the core of the dashboard. It is implemented with **Leaflet** and **OpenStreetMap-compatible tiles**.

**Leaflet integration:**

- Single map instance per session (created once, reused)
- Map container is provided by the host component; `MapService` initializes on that container
- `ResizeObserver` calls `map.invalidateSize()` when the container resizes so the map fills the workspace

**Tiles:**

- **Dark (Tactical)** — CartoDB Dark (default)
- **OpenStreetMap** — Standard OSM
- **Light** — CartoDB Light  
Layers are switched via Leaflet’s `L.control.layers` (bottom-right).

**Rendering:**

- **Markers:** Numbered `L.DivIcon` markers per movement; click opens popup (city, timestamp, lat/lng, travel order, connected tower id when present)
- **Route:** Dual polyline (glow + dashed line) for the travel path
- **Clustering:** Optional city clusters (circles) via a dedicated layer group
- **Heatmap:** Optional heatmap layer (intensity by visit frequency)
- **Cell towers:** Antenna-style markers; last-connected tower has larger pulsing red marker and optional signal radius circle (e.g. 15 km)
- **Police stations:** Badge-style markers with popup (name, coordinates)
- **Prediction:** Dashed polyline to predicted city with label (city + confidence)
- **Nearest station:** Dashed line from last position to nearest police station with distance label
- **Signal triangulation:** Three nearest towers; coverage circles; polygon and “Estimated zone” at centroid
- **Conversation locations:** Markers from locations extracted from message text
- **Threat forecast:** Arcs from current location to top 3 predicted cities; thickness/color by priority; labels (e.g. P1 · City, score)

**Layer management:**  
All overlays use `L.LayerGroup`s (movements, clusters, heatmap, cell towers, police stations, prediction, forecast). Toggles add/remove groups or clear layers without recreating the map.

---

## 6. High-Level Architecture (HLD)

### Frontend Layer

- **Angular 21** with **standalone components** (no NgModules)
- **Lazy-loaded routes:** Login, Dashboard, Suspect Deep Intelligence (`/suspect/:id`)
- **Auth guard** protects dashboard and deep-intel routes; unauthenticated users redirect to `/login`
- **ChangeDetectionStrategy.OnPush** used for performance where applicable
- **Modern control flow** in templates (`@if`, `@for`) and typed reactive streams (RxJS)

### Data Layer

- **JSON mock data** served from `/mock-data/` (e.g. `suspects.json`, `movements.json`, `events.json`, `police-stations.json`, `cell-towers.json`, `digital-intel.json`, `officers.json`, `notes.json`)
- **LiveDataService** seeds from movement JSON and runs a periodic “tick” to simulate new movements; components subscribe to this stream for live-updating map, timeline, and intel
- No backend or database; all state is in-memory or derived from mock JSON and live simulation

### Map Engine

- **Leaflet** for map, tiles, layers, markers, polylines, circles, controls
- **OpenStreetMap**-compatible tile providers (CartoDB Dark/Light, OSM)
- **MapService** owns the single map instance and all layer logic; components only call service methods and pass inputs (e.g. suspect id, day, movement id)

### Services Layer

- **MapService** — Map init, base layers, movement layer, clusters, heatmap, cell towers, police stations, prediction line, nearest station line, triangulation, conversation locations, threat forecast arcs; marker click stream
- **MovementService** — Load movements from JSON
- **SuspectService** — Load suspects, add suspect, get by id; in-memory list
- **LiveDataService** — Stream of movements (initial + simulated ticks); single source for “current” movements
- **IntelService** — Total movements, cities visited, events count, total distance (Haversine), most visited city
- **EventService** — Load investigation events from JSON
- **DigitalIntelService** — Call logs, messages, browsing, activity spikes; location extraction from message text
- **PatternAnalysisService** — Repeated cities, fast hops
- **PredictionService** — Next location (city transition model), nearest police station (Haversine)
- **RiskService** — Composite risk score and breakdown (encrypted comms, city jumps, browsing, crime zones, events)
- **ThreatForecastService** — Top city threats (scores + reasons) for threat trajectory
- **LocationIntelService** — Aggregated intel for one movement (calls, messages, browsing, events, tower, nearest station)
- **CellTowerService** / **PoliceService** — Load towers and stations from JSON
- **AuthService** — Mock login, current officer, shared cases
- **NotesService** — Load notes from JSON
- **NetworkService** — Suspect network/associates for graph and deep intel

**Data flow:**  
User selects suspect (and optionally day) in the dashboard → Dashboard passes `selectedSuspectId` / `selectedDay` to map, timeline, intel, pattern, location intel, network, events, notes. Map and timeline also receive `selectedMovementId`; when user clicks a marker or timeline item, dashboard sets `selectedMovementId` and the Location Intelligence panel and map focus update. LiveDataService pushes movement updates; intel/pattern/risk/forecast services derive from movements and other JSON data and expose Observables that the UI subscribes to.

---

## 7. Low-Level Design (LLD)

### MapService

- **Responsibility:** Single place for all Leaflet logic. Initialize map once, manage base layers and layer groups, render/clear movements (markers + polyline), clusters, heatmap, cell towers (with last-connected highlight and signal radius), police stations, prediction line, nearest station line, signal triangulation, conversation locations, threat forecast arcs. Expose `markerClick$` for UI sync.
- **Key methods:** `initMap(container, options?)`, `renderSuspectMovements(...)`, `showCellTowerLayer` / `hideCellTowerLayer`, `highlightLastConnectedTower(id?)`, `renderPoliceStations`, `renderPredictionLine`, `renderNearestStationLine`, `renderSignalTriangulation`, `renderConversationLocations`, `renderThreatForecast`, and various `clear`* methods.

### IntelService

- **Responsibility:** Compute intelligence metrics for a suspect: total movements, cities visited, event count, total distance (Haversine along ordered movements), most visited city. Consumes LiveDataService and EventService.
- **Key method:** `getStatsForSuspect(suspectId)` → `Observable<SuspectIntelStats>`.

### PatternAnalysisService

- **Responsibility:** Detect suspicious movement patterns: repeated cities (visit count > 1), fast hops (same-day or short-interval city-to-city). Consumes LiveDataService.
- **Key method:** `getPatternsForSuspect(suspectId)` → `Observable<SuspiciousPatternsSummary>`.

### PredictionService

- **Responsibility:** Predict next location using city transition counts (Markov-style) from movement history; fallback to most frequent city. Also find nearest police station by Haversine. Pure functions over movement/station arrays.
- **Key methods:** `predictNextLocation(movements)`, `findNearestStation(lat, lng, stations)`.

### RiskService

- **Responsibility:** Compute composite risk score (0–100) and level (low/medium/high) from encrypted communications, city jumps (fast hops), suspicious browsing, crime-zone visits, and risky events. Consumes LiveDataService, EventService, DigitalIntelService, PatternAnalysisService.
- **Key method:** `getRiskForSuspect(suspectId)` → `Observable<RiskSummary>`.

### ThreatForecastService

- **Responsibility:** Produce threat scores per city (e.g. top 3) for a suspect using visit frequency, recency, encrypted message mentions, crime zones, and associate presence. Used by map (forecast arcs) and Suspect Deep Intelligence (threat summary). Consumes LiveDataService, DigitalIntelService, NetworkService.
- **Key method:** `getForecastForSuspect(suspectId)` → `Observable<CityThreat[]>`.

### LocationIntelService

- **Responsibility:** For a given suspect and movement id, aggregate movement details, stay duration, calls/messages/browsing in a time window, events, connected (or nearest) tower, nearest police station. Consumes LiveDataService, DigitalIntelService, EventService, CellTowerService, PoliceService, PredictionService.
- **Key method:** `getLocationIntel(suspectId, movementId)` → `Observable<LocationIntel | null>`.

### DigitalIntelService

- **Responsibility:** Load digital-intel JSON and filter by suspect for call logs, messages, browsing history, activity spikes; extract location strings from messages and return coordinates for map markers.
- **Key methods:** `getCallLogs(suspectId)`, `getMessages(suspectId)`, `getBrowsingHistory(suspectId)`, `getActivitySpikes(suspectId)`, `extractLocationsFromMessages(suspectId)`.

### LiveDataService

- **Responsibility:** Hold and emit the canonical list of movements (initial load from MovementService + periodic simulated new movements). Other services and components use this as the source of truth for “current” movements.
- **Key method:** `getLiveMovements()` → `Observable<MovementEntry[]>`.

---

## 8. Project Structure

```
suspect-intelligence-map/
├── public/
│   └── mock-data/           # JSON assets (served as /mock-data/...)
│       ├── suspects.json
│       ├── movements.json
│       ├── events.json
│       ├── police-stations.json
│       ├── cell-towers.json
│       ├── digital-intel.json
│       ├── officers.json
│       └── notes.json
├── src/
│   ├── index.html
│   ├── main.ts
│   ├── styles.scss          # Global styles (e.g. tower-pulse, typography)
│   └── app/
│       ├── app.ts           # Root component (router-outlet only)
│       ├── app.config.ts
│       ├── app.routes.ts    # login, '', suspect/:id, **
│       ├── core/
│       │   ├── guards/
│       │   │   └── auth.guard.ts
│       │   └── services/
│       │       ├── auth.service.ts
│       │       ├── cell-tower.service.ts
│       │       ├── digital-intel.service.ts
│       │       ├── event.service.ts
│       │       ├── intel.service.ts
│       │       ├── live-data.service.ts
│       │       ├── location-intel.service.ts
│       │       ├── map.service.ts
│       │       ├── movement.service.ts
│       │       ├── network.service.ts
│       │       ├── notes.service.ts
│       │       ├── pattern-analysis.service.ts
│       │       ├── police.service.ts
│       │       ├── prediction.service.ts
│       │       ├── risk.service.ts
│       │       ├── suspect.service.ts
│       │       └── threat-forecast.service.ts
│       ├── features/
│       │   ├── add-suspect/
│       │   ├── case-share/
│       │   ├── dashboard/
│       │   ├── dashboard-header/
│       │   ├── day-selector/
│       │   ├── events/
│       │   ├── intel/           # intel-panel, pattern-panel, network-graph
│       │   ├── location-intel/
│       │   ├── login/
│       │   ├── map-workspace/
│       │   ├── notes/
│       │   ├── suspect-deep-intel/
│       │   ├── suspect-profile/
│       │   ├── suspects/        # suspect-list
│       │   ├── timeline/
│       │   └── time-warp/
│       ├── models/              # TypeScript interfaces
│       │   ├── suspect.model.ts
│       │   ├── movement.model.ts
│       │   ├── event.model.ts
│       │   ├── police.model.ts
│       │   ├── cell-tower.model.ts
│       │   ├── note.model.ts
│       │   ├── officer.model.ts
│       │   └── digital-intel.model.ts
│       └── shared/
│           └── components/
│               ├── glass-card/
│               └── icon-button/
├── angular.json
├── package.json
└── projectreadme.md          # This file
```

**Directory summary:**

- `**core/`** — Auth guard and all services (data, map, intel, prediction, risk, etc.).
- `**features/`** — One folder per feature (dashboard, login, map-workspace, timeline, intel panels, suspect-deep-intel, modals, etc.); each contains component TS/HTML/SCSS.
- `**models/**` — Shared TypeScript interfaces for suspects, movements, events, police, towers, notes, officers, digital intel.
- `**shared/components/**` — Reusable UI (e.g. glass-card, icon-button).
- `**public/mock-data/**` — Static JSON consumed by services via HTTP or referenced at build time.

---

## 9. Data Model

Data drives the UI through typed interfaces and JSON files. Main entities:

### Suspect

```json
{
  "id": "S1",
  "displayName": "Amit Rohit Sharma",
  "riskLevel": "high",
  "alias": "optional",
  "phone": "...",
  "lastKnownLocation": "Mumbai",
  "surveillanceStatus": "active",
  "activityLevel": "high",
  "signalStrength": "strong"
}
```

Used in suspect list, profile, deep intel, and case sharing.

### Movement

```json
{
  "id": "M1",
  "suspectId": "S1",
  "timestamp": "2024-01-15T08:00:00Z",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "city": "Delhi",
  "travelOrder": 1,
  "connectedTowerId": "CT1"
}
```

Drives map markers, route polyline, timeline, day filtering, prediction, and location intel. `connectedTowerId` links to cell tower highlight.

### Investigation Event

```json
{
  "id": "E1",
  "suspectId": "S1",
  "movementId": "M1",
  "title": "Hotel stay",
  "description": "...",
  "timestamp": "...",
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

Shown in events panel and location intel.

### Call Log / Intercepted Message / Browsing Entry

Defined in `digital-intel.model.ts`; stored in `digital-intel.json`. Filtered by `suspectId` for panels and location intel. Messages can be parsed for location strings to show conversation markers on the map.

### Cell Tower / Police Station

Towers: id, name, city, lat, lng, type. Stations: id, name, lat, lng. Used for map layers and location intel (connected tower, nearest station).

### Officer / SharedCase

Officers: id, name, role, password, badge (for login and case share). SharedCase: suspect, shared by/with, timestamp, notes (in-memory after share).

---

## 10. Investigation Workflow

1. **Login** — Officer enters ID and password; on success, redirect to dashboard.
2. **Select suspect** — Choose suspect from left sidebar; map, timeline, and all right-panel metrics update.
3. **Select day (optional)** — Filter movements by day (Monday–Friday); map and timeline show only that day.
4. **View travel route** — Center panel shows markers and polyline; popups show city, time, coordinates.
5. **Analyze timeline** — Right panel shows chronological movements; click an entry to focus map and open marker popup.
6. **Click map marker** — Timeline entry highlights; Location Intelligence panel shows aggregated activity at that location.
7. **Review intelligence** — Intel panel (metrics + risk gauge), pattern panel (repeated cities, fast hops), events, notes, network graph.
8. **Use tools** — Toggle Cell Towers / Police Stations / Forecast; run Time Warp to replay movement; add suspect or share case as needed.
9. **Deep dive** — Click “View profile” on a suspect → Suspect Deep Intelligence screen (`/suspect/:id`) for full profile, communications, and threat forecast; “Back to dashboard” returns to main workspace.

---

## 11. Unique Features

- **Time Warp Investigation Mode** — Scrubbable timeline replay with play/pause and speed; map and last-connected tower stay in sync. Lets investigators “replay” a suspect’s day step-by-step.
- **Signal tower triangulation** — Three nearest towers, coverage circles, and estimated zone on map for rough position inference from tower data.
- **Location Intelligence panel** — One click on a movement marker surfaces everything at that location: movement details, calls, messages, browsing, events, connected tower, nearest police station. No switching screens.
- **Predicted next location** — Simple but clear “next city” from transition history, with dashed line and confidence on the map.
- **Threat Trajectory Forecast** — Arcs from current location to top 3 predicted cities with threat scores; same logic powers the Deep Intelligence threat summary. Differentiates the platform as a “predictive” investigation tool.
- **Risk score engine** — Single composite score from multiple signals (encrypted comms, city jumps, browsing, crime zones, events), with visual gauge so investigators can quickly triage suspects.
- **Map-based investigation playback** — Timeline and map are two-way synced; tower highlight and location intel update during Time Warp, so the whole workspace stays consistent during replay.

These features show how the system goes beyond a simple map viewer to support analysis, prediction, and collaboration.

---

## 12. Future Improvements

- **Real telecom integration** — Replace mock cell towers with real tower data and APIs for live triangulation.
- **AI/ML anomaly detection** — Flag unusual routes or communication patterns beyond rule-based fast hops and repeated cities.
- **Real-time GPS tracking** — WebSocket or polling feed for live position updates instead of simulated ticks.
- **Multi-officer collaboration** — Persistent shared cases, presence, and comments (backend + real-time).
- **Backend and database** — Persist suspects, movements, events, notes, and user sessions; REST or GraphQL API for all data.
- **Role-based access** — Different views/permissions by role (e.g. analyst vs supervisor).
- **Export and reporting** — PDF/Excel reports, export routes and intel for case files.
- **Mobile-responsive layout** — Optimize 3-column layout and map controls for tablets and phones.

---

## 13. Technology Stack


| Layer        | Technology                                                            |
| ------------ | --------------------------------------------------------------------- |
| Frontend     | Angular 21 (standalone components, modern control flow, OnPush)       |
| Language     | TypeScript 5.9                                                        |
| Mapping      | Leaflet 1.9, OpenStreetMap-compatible tiles (CartoDB Dark/Light, OSM) |
| State / Data | RxJS 7.8 (Observables, BehaviorSubject, combineLatest)                |
| Styling      | SCSS; global styles in `styles.scss`                                  |
| HTTP         | Angular HttpClient for mock JSON                                      |
| Routing      | Angular Router (lazy-loaded routes, auth guard)                       |
| Architecture | Standalone Angular; no NgModules; feature-based folders               |


No separate chart library is required; activity spikes use simple CSS-based bars. Icons can be Material Icons Outlined or similar.

---

## 14. How to Run the Project

**Prerequisites:** Node.js (e.g. 20 LTS), npm.

**Steps:**

1. Clone or unpack the project and open a terminal in the project root.
2. Install dependencies:
  ```bash
   npm install
  ```
3. Start the development server:
  ```bash
   npm start
  ```
   or:
4. Open in a browser:
  ```
   http://localhost:4200
  ```
5. Log in with mock credentials from `public/mock-data/officers.json` (e.g. Officer ID and password as defined there).
6. Select a suspect and optionally a day; use the map, timeline, and right panels. Use “View profile” to open the Suspect Deep Intelligence screen and “Back to dashboard” to return.

**Build for production:**

```bash
npm run build
```

Output is in `dist/` (or as configured in `angular.json`).

---

## 15. Screenshot Section

![Login](docs/images/login-screen.png)
![Dashboard](docs/images/dashboard.png)
![Map Intelligence](docs/images/map-workspace.png)
![Timeline](docs/images/timeline.png)
![Intel Panel](docs/images/intel-panel.png)
![Pattern Panel](docs/images/pattern-panel.png)
![Events](docs/images/events-panel.png)
![Notes](docs/images/notes-panel.png)
![Network Graph](docs/images/network-graph.png)
![Suspect Deep Intel](docs/images/suspect-deep-intel.png)
![Add Suspect](docs/images/add-suspect.png)
![Case Share](docs/images/case-share.png)
![Time Warp](docs/images/time-warp.png)

