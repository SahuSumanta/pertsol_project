export interface InvestigationEvent {
  id: string;
  suspectId: string;
  movementId?: string;
  title: string;
  description?: string;
  timestamp: string;
  latitude: number;
  longitude: number;
}
