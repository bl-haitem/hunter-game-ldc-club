import { PlayerProfile, QRCodeCard, ScanRecord, NenType } from '../types';
import { getRankFromScore } from '../types/nenData';

const STORAGE_KEYS = {
  CURRENT_PLAYER: 'hxh_current_player',
  PLAYERS: 'hxh_players_list',
  QR_CODES: 'hxh_qr_codes',
  SCANS: 'hxh_scans_history',
};

// Initial Hunter Exam Clues & QR Cards
export const INITIAL_QR_CODES: QRCodeCard[] = [
  {
    id: 'card-1',
    code: 'HXH-NUMERE-01',
    title: 'Étape 1 : Le Marais de Numere',
    stageNumber: 1,
    points: 50,
    hint: 'Méfie-toi du brouillard épais et des bêtes trompeuses. Cherche le symbole de l\'examinateur Satotz près de l\'arbre ou de l\'entrée principale.',
    locationDesc: 'Affiché près de la porte d\'entrée ou de la zone d\'accueil.',
    isSingleUseGlobal: false,
    cardRank: 'N',
    createdAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'card-2',
    code: 'HXH-GOURMET-02',
    title: 'Étape 2 : Le Festin de Menchi & Buhara',
    stageNumber: 2,
    points: 80,
    hint: 'Le Gourmet Hunter recherche la saveur absolue. La cible est dissimulée là où l\'eau et le feu se rencontrent (zone cuisine/café ou fontaine).',
    locationDesc: 'Caché près de l\'espace restauration, cafétéria ou fontaine d\'eau.',
    isSingleUseGlobal: false,
    cardRank: 'R',
    createdAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'card-3',
    code: 'HXH-TRICKTOWER-03',
    title: 'Étape 3 : La Tour aux Astuces (Trick Tower)',
    stageNumber: 3,
    points: 120,
    hint: 'Une dalle secrète ne s\'ouvre qu\'à la majorité des voix. Regarde sous les marches d\'un escalier ou derrière un pilier élevé.',
    locationDesc: 'Sous une marche d\'escalier ou derrière un poteau de soutien.',
    isSingleUseGlobal: false,
    cardRank: 'SR',
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    id: 'card-4',
    code: 'HXH-ZEVIL-04',
    title: 'Étape 4 : L\'Île de Zevil (Cible Secrète #44)',
    stageNumber: 4,
    points: 150,
    hint: 'L\'aura d\'Hisoka rôde dans l\'ombre. Suis la trace invisible du Zetsu vers un lieu de verdure ou de repos discret.',
    locationDesc: 'Dans une plante, un bosquet ou derrière un banc de repos.',
    isSingleUseGlobal: false,
    cardRank: 'SR',
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'card-5',
    code: 'HXH-NETERO-FINAL',
    title: 'Épreuve Finale : Le Défi du Président Netero',
    stageNumber: 5,
    points: 250,
    hint: 'Pour décrocher le titre de Triple Star Hunter, approche-toi de la salle du trône du Président. Le QR code suprême attend les plus téméraires !',
    locationDesc: 'Table d\'honneur de l\'organisateur ou bureau central.',
    isSingleUseGlobal: true,
    cardRank: 'SSR',
    createdAt: Date.now() - 3600000 * 1,
  },
];

// Seed rival candidates for live competitive Leaderboard
const INITIAL_RIVALS: PlayerProfile[] = [
  {
    id: 'rival-killua',
    nickname: 'Killua_Z',
    nenType: 'Transmutation',
    avatarId: 'killua',
    hunterNumber: 'HXH-099',
    score: 400,
    scannedCodeIds: ['HXH-NUMERE-01', 'HXH-GOURMET-02', 'HXH-TRICKTOWER-03', 'HXH-ZEVIL-04'],
    solvedClueIds: ['card-1', 'card-2', 'card-3', 'card-4'],
    registeredAt: Date.now() - 7200000,
    lastActiveAt: Date.now() - 300000,
  },
  {
    id: 'rival-kurapika',
    nickname: 'Kurapika_Chain',
    nenType: 'Matérialisation',
    avatarId: 'kurapika',
    hunterNumber: 'HXH-404',
    score: 350,
    scannedCodeIds: ['HXH-NUMERE-01', 'HXH-GOURMET-02', 'HXH-TRICKTOWER-03'],
    solvedClueIds: ['card-1', 'card-2', 'card-3'],
    registeredAt: Date.now() - 7000000,
    lastActiveAt: Date.now() - 900000,
  },
  {
    id: 'rival-hisoka',
    nickname: 'Hisoka_★',
    nenType: 'Transmutation',
    avatarId: 'hisoka',
    hunterNumber: 'HXH-044',
    score: 250,
    scannedCodeIds: ['HXH-NUMERE-01', 'HXH-GOURMET-02', 'HXH-ZEVIL-04'],
    solvedClueIds: ['card-1', 'card-2', 'card-4'],
    registeredAt: Date.now() - 6500000,
    lastActiveAt: Date.now() - 1200000,
  },
  {
    id: 'rival-leorio',
    nickname: 'Leorio_Doc',
    nenType: 'Émission',
    avatarId: 'leorio',
    hunterNumber: 'HXH-403',
    score: 130,
    scannedCodeIds: ['HXH-NUMERE-01', 'HXH-GOURMET-02'],
    solvedClueIds: ['card-1', 'card-2'],
    registeredAt: Date.now() - 6000000,
    lastActiveAt: Date.now() - 1800000,
  },
];

export const storageService = {
  // Current logged in / active local player
  getCurrentPlayer(): PlayerProfile | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_PLAYER);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  setCurrentPlayer(player: PlayerProfile): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PLAYER, JSON.stringify(player));
    // Also sync to global players list
    const all = this.getAllPlayers();
    const idx = all.findIndex((p) => p.id === player.id);
    if (idx >= 0) {
      all[idx] = player;
    } else {
      all.push(player);
    }
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(all));
  },

  getAllPlayers(): PlayerProfile[] {
    const data = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(INITIAL_RIVALS));
      return INITIAL_RIVALS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_RIVALS;
    }
  },

  registerNewPlayer(nickname: string, nenType: NenType, avatarId: string): PlayerProfile {
    const id = 'player_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const randomExamNum = Math.floor(100 + Math.random() * 899);
    const hunterNumber = `HXH-${randomExamNum}`;

    const newPlayer: PlayerProfile = {
      id,
      nickname: nickname.trim(),
      nenType,
      avatarId,
      hunterNumber,
      score: 0,
      scannedCodeIds: [],
      solvedClueIds: [],
      registeredAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    this.setCurrentPlayer(newPlayer);
    return newPlayer;
  },

  // QR Codes & Clues Management
  getQRCodes(): QRCodeCard[] {
    const data = localStorage.getItem(STORAGE_KEYS.QR_CODES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.QR_CODES, JSON.stringify(INITIAL_QR_CODES));
      return INITIAL_QR_CODES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_QR_CODES;
    }
  },

  saveQRCodes(cards: QRCodeCard[]): void {
    localStorage.setItem(STORAGE_KEYS.QR_CODES, JSON.stringify(cards));
  },

  addQRCode(newCard: Omit<QRCodeCard, 'id' | 'createdAt'>): QRCodeCard {
    const cards = this.getQRCodes();
    const created: QRCodeCard = {
      ...newCard,
      id: 'card-' + Date.now(),
      createdAt: Date.now(),
    };
    cards.push(created);
    this.saveQRCodes(cards);
    return created;
  },

  deleteQRCode(id: string): void {
    const cards = this.getQRCodes().filter((c) => c.id !== id);
    this.saveQRCodes(cards);
  },

  // Scan History
  getScans(): ScanRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.SCANS);
    if (!data) {
      // Seed initial scans for demo
      const initialScans: ScanRecord[] = [
        {
          id: 'scan-1',
          playerId: 'rival-killua',
          playerNickname: 'Killua_Z',
          playerNenType: 'Transmutation',
          qrCodeId: 'card-1',
          qrCodeTitle: 'Étape 1 : Le Marais de Numere',
          pointsAwarded: 50,
          timestamp: Date.now() - 3600000,
        },
        {
          id: 'scan-2',
          playerId: 'rival-kurapika',
          playerNickname: 'Kurapika_Chain',
          playerNenType: 'Matérialisation',
          qrCodeId: 'card-2',
          qrCodeTitle: 'Étape 2 : Le Festin de Menchi',
          pointsAwarded: 80,
          timestamp: Date.now() - 1800000,
        },
      ];
      localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(initialScans));
      return initialScans;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  // Process a Scan
  processScan(scannedCodeText: string, player: PlayerProfile): {
    success: boolean;
    points: number;
    message: string;
    card?: QRCodeCard;
    isNewRank?: boolean;
    newRankTitle?: string;
  } {
    const cleanCode = scannedCodeText.trim();
    const qrCards = this.getQRCodes();
    const targetCard = qrCards.find(
      (c) => c.code.toUpperCase() === cleanCode.toUpperCase() || c.id === cleanCode
    );

    if (!targetCard) {
      return {
        success: false,
        points: 0,
        message: 'Aura inconnue ! Ce QR Code ne fait pas partie de l\'Examen Hunter.',
      };
    }

    // Check if player has already scanned this card
    if (player.scannedCodeIds.includes(targetCard.code)) {
      return {
        success: false,
        points: 0,
        message: `Tu as déjà scanné cette carte ("${targetCard.title}") ! Une licence ne peut pas enregistrer deux fois le même indice.`,
        card: targetCard,
      };
    }

    // Check if card is globally single use
    if (targetCard.isSingleUseGlobal && targetCard.isScannedGlobally) {
      return {
        success: false,
        points: 0,
        message: 'Trop tard ! Un autre candidat Hunter s\'est déjà emparé de cette récompense unique.',
        card: targetCard,
      };
    }

    // Award points
    const previousRank = getRankFromScore(player.score).rank;
    const newScore = player.score + targetCard.points;
    const nextRank = getRankFromScore(newScore).rank;
    const isNewRank = previousRank !== nextRank;

    // Update Card if single-use global
    if (targetCard.isSingleUseGlobal) {
      targetCard.isScannedGlobally = true;
      this.saveQRCodes(qrCards);
    }

    // Update Player
    const updatedPlayer: PlayerProfile = {
      ...player,
      score: newScore,
      scannedCodeIds: [...player.scannedCodeIds, targetCard.code],
      solvedClueIds: [...player.solvedClueIds, targetCard.id],
      lastActiveAt: Date.now(),
    };
    this.setCurrentPlayer(updatedPlayer);

    // Record scan in live feed
    const scanLog: ScanRecord = {
      id: 'scan_' + Date.now(),
      playerId: player.id,
      playerNickname: player.nickname,
      playerNenType: player.nenType,
      qrCodeId: targetCard.id,
      qrCodeTitle: targetCard.title,
      pointsAwarded: targetCard.points,
      timestamp: Date.now(),
    };

    const scans = this.getScans();
    scans.unshift(scanLog);
    localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(scans.slice(0, 100)));

    return {
      success: true,
      points: targetCard.points,
      message: `Bravo Hunter ! Tu as débloqué "${targetCard.title}" et remporté +${targetCard.points} points !`,
      card: targetCard,
      isNewRank,
      newRankTitle: nextRank,
    };
  },

  // Reset all game data (for admin or testing)
  resetAllGameData(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PLAYER);
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(INITIAL_RIVALS));
    localStorage.setItem(STORAGE_KEYS.QR_CODES, JSON.stringify(INITIAL_QR_CODES));
    localStorage.removeItem(STORAGE_KEYS.SCANS);
  },
};
