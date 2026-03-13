export interface CellTower {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  type: 'macro' | 'micro' | 'relay';
}
