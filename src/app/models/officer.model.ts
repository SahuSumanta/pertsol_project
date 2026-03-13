export interface Officer {
  id: string;
  name: string;
  role: string;
  password: string;
  badge: string;
  avatar?: string;
}

export interface SharedCase {
  id: string;
  suspectId: string;
  sharedBy: string;
  sharedWith: string;
  timestamp: string;
  notes?: string;
}
