export type Rarity = 'SSR' | 'SR' | 'R' | 'N';

export interface Card {
  id: string;
  code: string;
  title: string;
  cardRank: Rarity;
  points: number;
  maxScans: number;
  scannedBy: string[];
  hint: string;
  locationDesc?: string;
}

export interface Player {
  id: string;
  email: string;
  nickname: string; // derived directly from email (cannot be modified)
  hunterNumber: string;
  score: number;
  scannedCodeIds: string[];
  solvedClueIds: string[];
  nenType?: string;
  registeredAt?: number;
  sessionToken?: string;
}

export interface ScanLog {
  id: string;
  time: string;
  hunterName: string;
  hunterId: string;
  cardTitle: string;
  points: number;
}

export type ActiveTab = 'landing' | 'scan' | 'hints' | 'classmen' | 'settings' | 'admin';
