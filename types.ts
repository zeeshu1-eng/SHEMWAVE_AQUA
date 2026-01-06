
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Appliance {
  id: string;
  name: string;
  status: boolean;
  type: 'Light' | 'Motor';
  working?: boolean; // For Motors only
}

export interface Schedule {
  id: string;
  applianceId: string;
  applianceType: 'Light' | 'Motor';
  applianceName: string;
  action: 'ON' | 'OFF';
  time: string; // ISO string or simple time
  date: string; // YYYY-MM-DD
  executed: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  type: 'success' | 'warning' | 'info';
}
