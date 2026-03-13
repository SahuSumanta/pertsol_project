export interface MovementEntry {
  id: string;
  suspectId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  city: string;
  travelOrder: number;
  connectedTowerId?: string;
}
