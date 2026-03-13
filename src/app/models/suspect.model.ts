export interface Suspect {
  id: string;
  displayName: string;
  riskLevel?: 'low' | 'medium' | 'high';
  riskScore?: number;
  alias?: string;
  phone?: string;
  lastKnownLocation?: string;
  notes?: string;
  surveillanceStatus?: 'active' | 'paused' | 'inactive';
  activityLevel?: 'high' | 'moderate' | 'low';
  signalStrength?: 'strong' | 'moderate' | 'weak' | 'lost';
}
