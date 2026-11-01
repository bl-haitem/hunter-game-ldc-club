import { Card, Player, ScanLog } from '../types/hxh';
import { INITIAL_CARDS, INITIAL_RIVALS, getRankTier } from '../data/initialData';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

// Helper d'extraction intelligente de code QR (URLs, paramètres ?code=, tokens Hunter)
export function extractCleanCode(rawCode: string): string {
  if (!rawCode) return '';
  let str = rawCode.trim();

  // Si le code contient le marqueur masqué temporaire
  if (str.includes('NEN-CIPHER-PROTECTED')) {
    return 'CIPHER_MASKED_ERROR';
  }

  // Extraction depuis URL param (?code=..., ?card=..., ?c=...)
  const paramMatch = str.match(/[?&](?:code|card|c)=([A-Za-z0-9-_]+)/i);
  if (paramMatch && paramMatch[1]) {
    return paramMatch[1].trim().toUpperCase();
  }

  // Extraction motif officiel Hunter (ex: HXH-NUMERE-01, HXH-XXXX-XXXX)
  const hxhMatch = str.match(/HXH-[A-Za-z0-9-_]+/i);
  if (hxhMatch) {
    return hxhMatch[0].trim().toUpperCase();
  }

  return str.trim().toUpperCase();
}

// Helper cryptographique SHA-256 Web Crypto (standard navigateur)
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simulation & Cloud Connector for Convex Database
export class ConvexDatabaseService {
  private static instance: ConvexDatabaseService;
  public isConvexCloud: boolean = false;
  public convexUrl: string = '';
  private client: ConvexHttpClient | null = null;
  public adminSessionToken: string = '';

  private constructor() {
    this.convexUrl =
      ((import.meta as any).env?.VITE_CONVEX_URL as string) ||
      'https://handsome-puffin-656.convex.cloud';
    this.isConvexCloud = !!this.convexUrl;

    // Récupérer le token de session admin existant si valide
    this.adminSessionToken = sessionStorage.getItem('hxh_admin_token') || '';

    if (this.isConvexCloud) {
      try {
        this.client = new ConvexHttpClient(this.convexUrl);
        console.log('[Convex] Connecté au Cloud officiel :', this.convexUrl);
      } catch (err) {
        console.warn('[Convex] Erreur d\'initialisation du client Cloud :', err);
      }
    }
  }

  public static getInstance(): ConvexDatabaseService {
    if (!ConvexDatabaseService.instance) {
      ConvexDatabaseService.instance = new ConvexDatabaseService();
    }
    return ConvexDatabaseService.instance;
  }

  // --- SÉCURITÉ ADMIN : VÉRIFICATION HASHÉE & ANTI BRUTE-FORCE ---
  public async loginAdmin(rawPassword: string): Promise<{ success: boolean; message?: string }> {
    const passwordHash = await sha256(rawPassword.trim());

    if (this.client) {
      try {
        const res: any = await this.client.mutation(api.adminAuth.loginAdmin, {
          passwordHash
        });

        if (res && res.success && res.token) {
          this.adminSessionToken = res.token;
          sessionStorage.setItem('hxh_admin_token', res.token);
          await this.getCards();
          return { success: true };
        } else {
          return { success: false, message: res?.message || 'Mot de passe incorrect !' };
        }
      } catch (err: any) {
        console.warn('[Convex] Erreur loginAdmin cloud :', err);
        return { success: false, message: 'Erreur lors de la validation sur Convex Cloud.' };
      }
    }

    return { success: false, message: 'Connexion au serveur Convex Cloud requise pour le panel examinateur !' };
  }

  public async checkAdminSession(): Promise<boolean> {
    if (!this.adminSessionToken) return false;

    if (this.client && this.adminSessionToken.startsWith('adm_sec_')) {
      try {
        const isValid = await this.client.query(api.adminAuth.checkAdminSession, {
          token: this.adminSessionToken
        });
        return !!isValid;
      } catch {
        return false;
      }
    }

    return false;
  }

  public async logoutAdmin(): Promise<void> {
    if (this.client && this.adminSessionToken) {
      try {
        await this.client.mutation(api.adminAuth.logoutAdmin, {
          token: this.adminSessionToken
        });
      } catch {}
    }
    this.adminSessionToken = '';
    sessionStorage.removeItem('hxh_admin_token');
  }

  public async changeAdminPassword(newRawPassword: string): Promise<{ success: boolean; message: string }> {
    if (!this.adminSessionToken) throw new Error('Session expirée');
    const newHash = await sha256(newRawPassword.trim());

    if (this.client) {
      return await this.client.mutation(api.adminAuth.changeAdminPassword, {
        token: this.adminSessionToken,
        newPasswordHash: newHash
      });
    }

    return { success: true, message: 'Mot de passe mis à jour !' };
  }

  // --- AUTHENTICATION & PLAYER REGISTRATION (REAL ACCOUNT OWNER NAME) ---
  public async registerOrLogin(email: string, name?: string): Promise<Player> {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Adresse email invalide !');
    }

    const cleanName = (name || '').trim();
    const fallbackNickname = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '');
    const chosenNickname = cleanName || fallbackNickname || 'Hunter_Candidat';

    if (this.client) {
      try {
        const cloudPlayer: any = await this.client.mutation(api.players.registerOrLoginWithEmail, {
          email: cleanEmail,
          name: cleanName || undefined
        } as any);
        if (cloudPlayer) {
          const player: Player = {
            id: cloudPlayer._id,
            email: cloudPlayer.email,
            nickname: cloudPlayer.nickname,
            hunterNumber: cloudPlayer.hunterNumber,
            score: cloudPlayer.score,
            scannedCodeIds: cloudPlayer.scannedCodeIds || [],
            solvedClueIds: [],
            nenType: cloudPlayer.nenType,
            registeredAt: cloudPlayer.registeredAt,
            sessionToken: cloudPlayer.sessionToken
          };
          localStorage.setItem('hxh_player', JSON.stringify(player));
          return player;
        }
      } catch (err) {
        console.warn('[Convex] Erreur registerOrLogin cloud, fallback local :', err);
      }
    }

    const all = await this.getAllPlayers();
    const existing = all.find(p => p.email.toLowerCase() === cleanEmail);

    if (existing) {
      if (cleanName) {
        existing.nickname = cleanName;
      }
      localStorage.setItem('hxh_player', JSON.stringify(existing));
      return existing;
    }

    const NEN_LIST = ['Renforcement', 'Transmutation', 'Matérialisation', 'Émission', 'Manipulation', 'Spécialisation'];
    const randomNen = NEN_LIST[Math.floor(Math.random() * NEN_LIST.length)];
    const hunterNumber = 'HXH-' + Math.floor(Math.random() * 900 + 100);

    const newPlayer: Player = {
      id: 'hunter_' + Date.now(),
      email: cleanEmail,
      nickname: chosenNickname,
      hunterNumber,
      score: 0,
      scannedCodeIds: [],
      solvedClueIds: [],
      nenType: randomNen,
      registeredAt: Date.now()
    };

    all.push(newPlayer);
    localStorage.setItem('hxh_all_players', JSON.stringify(all));
    localStorage.setItem('hxh_player', JSON.stringify(newPlayer));

    return newPlayer;
  }

  // --- CANDIDATES LIST (ALL PLAYERS) ---
  public async getAllPlayers(): Promise<Player[]> {
    const adminToken = this.adminSessionToken || sessionStorage.getItem('hxh_admin_token') || undefined;
    if (this.client) {
      try {
        const cloudPlayers: any = await this.client.query(api.players.getAllPlayers, {
          adminToken
        } as any);
        if (Array.isArray(cloudPlayers)) {
          const mapped: Player[] = cloudPlayers.map((p: any) => ({
            id: p._id,
            email: p.email || '',
            nickname: p.nickname,
            hunterNumber: p.hunterNumber,
            score: p.score,
            scannedCodeIds: p.scannedCodeIds || [],
            solvedClueIds: [],
            nenType: p.nenType,
            registeredAt: p.registeredAt
          }));
          localStorage.setItem('hxh_all_players', JSON.stringify(mapped));
          return mapped;
        }
      } catch (err) {
        console.warn('[Convex] Erreur getAllPlayers cloud :', err);
      }
    }

    try {
      const saved = localStorage.getItem('hxh_all_players');
      if (saved) {
        const list: Player[] = JSON.parse(saved);
        if (Array.isArray(list)) return list;
      }
    } catch {}

    return [];
  }

  // --- ADMIN: UPDATE CANDIDATE POINTS (SECURE BACKEND MUTATION) ---
  public async adminUpdatePlayerPoints(
    playerId: string,
    newPoints: number
  ): Promise<{ success: boolean; newScore: number; rank: string }> {
    if (!this.adminSessionToken) {
      throw new Error('ACCÈS REFUSÉ : Session administrateur non active !');
    }

    if (newPoints < 0) {
      throw new Error('Le score ne peut pas être négatif !');
    }

    if (this.client && !playerId.startsWith('hunter_') && !playerId.startsWith('rival-')) {
      try {
        await this.client.mutation(api.players.adminUpdatePlayerPoints, {
          adminToken: this.adminSessionToken,
          playerId: playerId as any,
          newScore: newPoints
        });
      } catch (err) {
        console.warn('[Convex] Erreur adminUpdatePlayerPoints cloud :', err);
      }
    }

    const all = await this.getAllPlayers();
    const target = all.find(p => p.id === playerId);
    if (target) {
      target.score = newPoints;
      localStorage.setItem('hxh_all_players', JSON.stringify(all));
    }

    try {
      const active = localStorage.getItem('hxh_player');
      if (active) {
        const p: Player = JSON.parse(active);
        if (p.id === playerId) {
          p.score = newPoints;
          localStorage.setItem('hxh_player', JSON.stringify(p));
        }
      }
    } catch {}

    const rank = getRankTier(newPoints);
    return { success: true, newScore: newPoints, rank: rank.title };
  }

  // --- ADMIN: DELETE SPECIFIC CANDIDATE ---
  public async adminDeletePlayer(playerId: string): Promise<boolean> {
    if (!this.adminSessionToken) {
      throw new Error('ACCÈS REFUSÉ : Session administrateur non active !');
    }

    if (this.client && !playerId.startsWith('hunter_') && !playerId.startsWith('rival-')) {
      try {
        await this.client.mutation(api.players.adminDeletePlayer, {
          adminToken: this.adminSessionToken,
          playerId: playerId as any
        } as any);
      } catch (err) {
        console.warn('[Convex] Erreur adminDeletePlayer cloud :', err);
      }
    }

    const all = await this.getAllPlayers();
    const filtered = all.filter(p => p.id !== playerId);
    localStorage.setItem('hxh_all_players', JSON.stringify(filtered));

    try {
      const active = localStorage.getItem('hxh_player');
      if (active) {
        const p: Player = JSON.parse(active);
        if (p.id === playerId) {
          localStorage.removeItem('hxh_player');
        }
      }
    } catch {}

    return true;
  }

  // --- ADMIN: RESET & PURGE ALL CANDIDATES ---
  public async adminResetAllPlayers(): Promise<{ success: boolean; deletedCount: number; message: string }> {
    if (!this.adminSessionToken) {
      throw new Error('ACCÈS REFUSÉ : Session administrateur non active !');
    }

    let deletedCount = 0;
    if (this.client) {
      try {
        const res: any = await this.client.mutation(api.players.adminResetAllPlayers, {
          adminToken: this.adminSessionToken
        } as any);
        if (res) {
          deletedCount = res.deletedCount || 0;
        }
      } catch (err) {
        console.warn('[Convex] Erreur adminResetAllPlayers cloud :', err);
      }
    }

    // Réinitialiser le cache local
    localStorage.removeItem('hxh_all_players');
    localStorage.removeItem('hxh_scans');
    localStorage.removeItem('hxh_player');

    return {
      success: true,
      deletedCount,
      message: `Tous les candidats ont été définitivement supprimés (${deletedCount}).`
    };
  }

  // --- CARDS & QUOTAS ---
  // --- CARDS & QUOTAS (PROTECTION ZERO-KNOWLEDGE) ---
  public async getCards(playerId?: string): Promise<Card[]> {
    const adminToken = this.adminSessionToken || sessionStorage.getItem('hxh_admin_token') || undefined;
    let resolvedPlayerId = playerId && !playerId.startsWith('hunter_') && !playerId.startsWith('rival-') ? playerId : undefined;
    if (!resolvedPlayerId) {
      try {
        const activeStr = localStorage.getItem('hxh_player');
        if (activeStr) {
          const parsed = JSON.parse(activeStr);
          if (parsed.email) resolvedPlayerId = parsed.email;
        }
      } catch {}
    }

    if (this.client) {
      try {
        const cloudCards: any = await this.client.query(api.cards.getCards, {
          adminToken,
          playerId: resolvedPlayerId
        });
        if (Array.isArray(cloudCards) && cloudCards.length > 0) {
          const mapped: Card[] = cloudCards.map((c: any) => ({
            id: c._id,
            code: c.code,
            title: c.title,
            cardRank: c.cardRank,
            points: c.points,
            maxScans: c.maxScans,
            scannedBy: c.scannedBy || [],
            hint: c.hint,
            locationDesc: c.locationDesc
          }));

          localStorage.setItem('hxh_cards', JSON.stringify(mapped));
          return mapped;
        }
      } catch (err) {
        console.warn('[Convex] Erreur getCards cloud :', err);
      }
    }

    try {
      const saved = localStorage.getItem('hxh_cards');
      if (saved) {
        const list: Card[] = JSON.parse(saved);
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch {}

    localStorage.setItem('hxh_cards', JSON.stringify(INITIAL_CARDS));
    return INITIAL_CARDS;
  }

  public async adminUpdateCardQuota(
    cardId: string,
    newQuota: number
  ): Promise<{ success: boolean; newQuota: number }> {
    if (!this.adminSessionToken) {
      throw new Error('ACCÈS REFUSÉ : Session administrateur non active !');
    }

    if (this.client && !cardId.startsWith('card-')) {
      try {
        await this.client.mutation(api.cards.adminUpdateQuota, {
          adminToken: this.adminSessionToken,
          cardId: cardId as any,
          newQuota
        });
      } catch (err) {
        console.warn('[Convex] Erreur adminUpdateCardQuota cloud :', err);
      }
    }

    const cards = await this.getCards();
    const card = cards.find(c => c.id === cardId);
    if (!card) throw new Error('Carte introuvable !');

    const currentScans = (card.scannedBy || []).length;
    if (newQuota < currentScans) {
      throw new Error(`Le quota ne peut pas être inférieur au nombre de scans actuels (${currentScans}) !`);
    }

    card.maxScans = newQuota;
    localStorage.setItem('hxh_cards', JSON.stringify(cards));
    return { success: true, newQuota };
  }

  public async adminCreateCard(
    cardData: Omit<Card, 'id' | 'scannedBy'>
  ): Promise<Card> {
    if (!this.adminSessionToken) {
      throw new Error('ACCÈS REFUSÉ : Session administrateur non active !');
    }

    if (this.client) {
      try {
        const newCloudCard: any = await this.client.mutation(api.cards.adminCreateCard, {
          adminToken: this.adminSessionToken,
          code: cardData.code || undefined,
          title: cardData.title,
          cardRank: cardData.cardRank,
          points: cardData.points,
          maxScans: cardData.maxScans,
          hint: cardData.hint,
          locationDesc: cardData.locationDesc
        });
        if (newCloudCard) {
          const card: Card = {
            id: newCloudCard._id,
            code: newCloudCard.code,
            title: newCloudCard.title,
            cardRank: newCloudCard.cardRank,
            points: newCloudCard.points,
            maxScans: newCloudCard.maxScans,
            scannedBy: newCloudCard.scannedBy || [],
            hint: newCloudCard.hint,
            locationDesc: newCloudCard.locationDesc
          };
          return card;
        }
      } catch (err) {
        console.warn('[Convex] Erreur adminCreateCard cloud :', err);
      }
    }

    const cards = await this.getCards();
    const newCard: Card = {
      ...cardData,
      id: 'card-' + Date.now(),
      scannedBy: []
    };

    cards.push(newCard);
    localStorage.setItem('hxh_cards', JSON.stringify(cards));
    return newCard;
  }

  public async adminDeleteCard(cardId: string): Promise<boolean> {
    if (!this.adminSessionToken) {
      throw new Error('ACCÈS REFUSÉ : Session administrateur non active !');
    }

    if (this.client && !cardId.startsWith('card-')) {
      try {
        await this.client.mutation(api.cards.adminDeleteCard, {
          adminToken: this.adminSessionToken,
          cardId: cardId as any
        });
      } catch (err) {
        console.warn('[Convex] Erreur adminDeleteCard cloud :', err);
      }
    }

    const cards = await this.getCards();
    const filtered = cards.filter(c => c.id !== cardId);
    localStorage.setItem('hxh_cards', JSON.stringify(filtered));
    return true;
  }

  // --- SCANS & ANTI-CHEAT ENGINE ---
  public async getScans(): Promise<ScanLog[]> {
    if (this.client) {
      try {
        const cloudScans: any = await this.client.query(api.scans.getLiveScans);
        if (Array.isArray(cloudScans)) {
          const mapped: ScanLog[] = cloudScans.map((s: any) => ({
            id: s._id,
            time: s.timeStr,
            hunterName: s.playerNickname,
            hunterId: s.hunterId,
            cardTitle: s.cardTitle,
            points: s.points
          }));
          localStorage.setItem('hxh_scans', JSON.stringify(mapped));
          return mapped;
        }
      } catch (err) {
        console.warn('[Convex] Erreur getLiveScans cloud :', err);
      }
    }

    try {
      const saved = localStorage.getItem('hxh_scans');
      if (saved) {
        const list: ScanLog[] = JSON.parse(saved);
        if (Array.isArray(list)) return list;
      }
    } catch {}

    return [];
  }

  public async claimScan(
    playerId: string,
    rawCode: string
  ): Promise<{
    success: boolean;
    points: number;
    title: string;
    message: string;
    hint?: string;
  }> {
    const cleanCode = extractCleanCode(rawCode);

    if (cleanCode === 'CIPHER_MASKED_ERROR') {
      return {
        success: false,
        points: 0,
        title: 'QR CODE MASQUÉ',
        message: "Ce QR code a été généré avant la connexion de l'examinateur. Connectez-vous au panneau Admin et cliquez à nouveau sur 'Afficher QR Code'."
      };
    }

    // 1. Tenter la validation sur Convex Cloud si disponible
    if (this.client) {
      let cloudPlayerId = playerId;

      // Si le playerId est temporaire (hunter_...), vérifier si ce joueur a un compte cloud via son email
      if (cloudPlayerId.startsWith('hunter_') || cloudPlayerId.startsWith('rival-')) {
        try {
          const activeStr = localStorage.getItem('hxh_player');
          if (activeStr) {
            const p: Player = JSON.parse(activeStr);
            if (p.email) {
              const cloudPlayer = await this.registerOrLogin(p.email);
              if (cloudPlayer && !cloudPlayer.id.startsWith('hunter_')) {
                cloudPlayerId = cloudPlayer.id;
              }
            }
          }
        } catch {}
      }

      if (!cloudPlayerId.startsWith('hunter_') && !cloudPlayerId.startsWith('rival-')) {
        try {
          const activeStr = localStorage.getItem('hxh_player');
          let sessionToken: string | undefined = undefined;
          if (activeStr) {
            try {
              const p: Player = JSON.parse(activeStr);
              sessionToken = p.sessionToken;
            } catch {}
          }

          const cloudResult: any = await this.client.mutation(api.scans.claimScan, {
            playerId: cloudPlayerId as any,
            rawCode: cleanCode,
            sessionToken
          } as any);
          if (cloudResult) return cloudResult;
        } catch (err) {
          console.warn('[Convex] Erreur claimScan cloud, fallback local :', err);
        }
      }
    }

    // 2. Fallback Local & Offline
    const cards = await this.getCards();
    let card = cards.find(c => c.code && c.code.toUpperCase() === cleanCode);

    // Si non trouvé (par exemple si la carte locale a un code masqué), vérifier dans INITIAL_CARDS
    if (!card) {
      const initMatch = INITIAL_CARDS.find(ic => ic.code.toUpperCase() === cleanCode);
      if (initMatch) {
        card = cards.find(c => c.id === initMatch.id || c.title === initMatch.title);
        if (card) {
          card.code = initMatch.code;
        } else {
          card = { ...initMatch };
          cards.push(card);
        }
      }
    }

    if (!card) {
      return {
        success: false,
        points: 0,
        title: 'FRÉQUENCE NEN INCONNUE',
        message: `Le code [${cleanCode}] ne correspond à aucune carte active de l'examen Hunter.`
      };
    }

    const all = await this.getAllPlayers();
    const player = all.find(p => p.id === playerId);
    if (!player) {
      return {
        success: false,
        points: 0,
        title: 'CANDIDAT INTROUVABLE',
        message: 'Licence non enregistrée.'
      };
    }

    if (player.scannedCodeIds.includes(card.code) || (card.scannedBy || []).includes(player.id)) {
      return {
        success: false,
        points: 0,
        title: 'CARTE DÉJÀ ACQUISE',
        message: `Vous possédez déjà "${card.title}" dans vos archives Greed Island. Aucun point supplémentaire attribué.`,
        hint: card.hint
      };
    }

    const currentScans = (card.scannedBy || []).length;
    if (currentScans >= card.maxScans) {
      return {
        success: false,
        points: 0,
        title: 'QUOTA ATTEINT (CARTE ÉPUISÉE)',
        message: `Cette carte avait un quota strict de ${card.maxScans} scan(s). D'autres candidats ont été plus rapides !`
      };
    }

    card.scannedBy = [...(card.scannedBy || []), player.id];
    player.scannedCodeIds.push(card.code);
    player.score += card.points;

    localStorage.setItem('hxh_cards', JSON.stringify(cards));
    localStorage.setItem('hxh_all_players', JSON.stringify(all));
    localStorage.setItem('hxh_player', JSON.stringify(player));

    const scans = await this.getScans();
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const newLog: ScanLog = {
      id: 'scan_' + Date.now(),
      time: timeStr,
      hunterName: player.nickname,
      hunterId: player.hunterNumber,
      cardTitle: card.title,
      points: card.points
    };
    scans.unshift(newLog);
    localStorage.setItem('hxh_scans', JSON.stringify(scans.slice(0, 50)));

    return {
      success: true,
      points: card.points,
      title: card.title,
      message: `Félicitations ! Vous avez réclamé cette carte avec succès (+${card.points} PTS).`,
      hint: card.hint
    };
  }
}

export const convexDb = ConvexDatabaseService.getInstance();
