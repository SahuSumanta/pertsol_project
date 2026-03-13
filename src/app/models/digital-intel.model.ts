export interface CallLog {
  id: string;
  suspectId: string;
  contact: string;
  phone: string;
  duration: string;
  timestamp: string;
  type: 'incoming' | 'outgoing' | 'missed';
}

export interface InterceptedMessage {
  id: string;
  suspectId: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  direction: 'incoming' | 'outgoing';
  encrypted?: boolean;
}

export interface BrowsingEntry {
  id: string;
  suspectId: string;
  url: string;
  category: 'Development' | 'Email' | 'Suspicious' | 'Social' | 'Communication' | 'Finance';
  timestamp: string;
}

export interface ActivitySpike {
  suspectId: string;
  day: string;
  calls: number;
  messages: number;
  browsing: number;
}

export interface DigitalIntel {
  callLogs: CallLog[];
  messages: InterceptedMessage[];
  browsingHistory: BrowsingEntry[];
  activitySpikes: ActivitySpike[];
}
