export type NenType = 
  | 'Renforcement'    // Enhancer (Gon)
  | 'Émission'        // Emitter (Leorio, Franklin)
  | 'Transmutation'   // Transmuter (Killua, Hisoka)
  | 'Manipulation'    // Manipulator (Illumi, Shalnark)
  | 'Matérialisation' // Conjurer (Kurapika, Kite)
  | 'Spécialisation'; // Specialist (Chrollo, Pitou, Kurapika)

export type HunterRank = 
  | 'Aspirant Hunter'
  | 'Pro Hunter'
  | 'Single Hunter'
  | 'Double Hunter'
  | 'Triple Hunter';

export interface PlayerProfile {
  id: string;
  nickname: string;
  nenType: NenType;
  avatarId: string;
  avatarUrl?: string;
  hunterNumber: string;
  score: number;
  scannedCodeIds: string[];
  solvedClueIds: string[];
  registeredAt: number;
  lastActiveAt: number;
}

export interface QRCodeCard {
  id: string;
  code: string;               // Unique string encoded in QR code (e.g. HXH-MARAIS-01)
  title: string;              // e.g. "Étape 1 : Le Marais de Numere"
  stageNumber: number;
  points: number;             // e.g. 50
  hint: string;               // HxH riddle/clue
  locationDesc?: string;      // Admin note on where it's hidden in real life
  isSingleUseGlobal: boolean; // Single use in total across game, or once per player
  isScannedGlobally?: boolean;
  cardRank?: 'SSR' | 'SR' | 'R' | 'N'; // Greed Island style card rarity
  createdAt: number;
}

export interface ScanRecord {
  id: string;
  playerId: string;
  playerNickname: string;
  playerNenType: NenType;
  qrCodeId: string;
  qrCodeTitle: string;
  pointsAwarded: number;
  timestamp: number;
}

export interface GameStats {
  totalPoints: number;
  totalScans: number;
  activePlayers: number;
  totalCards: number;
}

export interface NenAffinityInfo {
  type: NenType;
  nameFr: string;
  nameJp: string;
  color: string;
  bgGlow: string;
  borderGlow: string;
  description: string;
  icon: string;
  representative: string;
}
