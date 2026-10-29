/**
 * HUNTER × HUNTER — OFFICIAL APP ENGINE
 * Nen State, QR Quota Validation, Hunter Audio & Storage
 */

// ── INITIAL NEN BOUNTY CARDS (NON-SEQUENTIAL, WITH SCAN QUOTAS) ──
const INITIAL_CARDS = [
  {
    id: 'card-1',
    code: 'HXH-NUMERE-01',
    title: 'Marais de Numere — Papillons de Brume',
    cardRank: 'N',
    points: 50,
    maxScans: 5,
    scannedBy: ['rival-1', 'rival-2'],
    hint: 'Méfiez-vous du brouillard épais. Satotz court d\'un pas régulier. Cherchez près du grand arbre de l\'entrée principale.',
    locationDesc: 'Hall d\'entrée ou arche principale.'
  },
  {
    id: 'card-2',
    code: 'HXH-GOURMET-02',
    title: 'Festin des Gourmets — Menchi & Buhara',
    cardRank: 'R',
    points: 80,
    maxScans: 4,
    scannedBy: ['rival-1', 'rival-2', 'rival-3'],
    hint: 'Le Gourmet Hunter recherche la saveur pure. La carte se cache là où le feu et l\'eau se rencontrent.',
    locationDesc: 'Espace restauration, cafétéria ou fontaine.'
  },
  {
    id: 'card-3',
    code: 'HXH-TRICKTOWER-03',
    title: 'Tour aux Astuces — Dalle Secrète 72h',
    cardRank: 'SR',
    points: 120,
    maxScans: 3,
    scannedBy: ['rival-1'],
    hint: 'Une dalle secrète ne s\'ouvre qu\'à la majorité des voix. Observez sous les marches d\'un escalier ou derrière un pilier massif.',
    locationDesc: 'Sous un escalier ou derrière un pilier.'
  },
  {
    id: 'card-4',
    code: 'HXH-ZEVIL-04',
    title: 'Île de Zevil — Plaque Cible #44',
    cardRank: 'SR',
    points: 150,
    maxScans: 2,
    scannedBy: ['rival-1'],
    hint: 'L\'aura menaçante d\'Hisoka rôde dans l\'ombre. Suivez la discrétion du Zetsu vers un bosquet de verdure ou un recoin isolé.',
    locationDesc: 'Dans une plante verte ou salon de repos.'
  },
  {
    id: 'card-5',
    code: 'HXH-NETERO-FINAL',
    title: 'Défi Suprême — Sceau du Président Netero',
    cardRank: 'SSR',
    points: 250,
    maxScans: 1, // Single claim bounty!
    scannedBy: [],
    hint: 'Pour décrocher le titre de Triple Star Hunter, approchez-vous du trône du Président. Le QR code suprême n\'attend qu\'un seul élu !',
    locationDesc: 'Table d\'honneur des examinateurs.'
  }
];

const INITIAL_RIVALS = [
  { id: 'rival-1', nickname: 'Killua_Z',       hunterNumber: 'HXH-099', score: 350, scannedCodeIds: ['HXH-NUMERE-01', 'HXH-GOURMET-02', 'HXH-TRICKTOWER-03', 'HXH-ZEVIL-04'] },
  { id: 'rival-2', nickname: 'Kurapika_Chain', hunterNumber: 'HXH-404', score: 230, scannedCodeIds: ['HXH-NUMERE-01', 'HXH-GOURMET-02'] },
  { id: 'rival-3', nickname: 'Hisoka_★',        hunterNumber: 'HXH-044', score: 80,  scannedCodeIds: ['HXH-GOURMET-02'] }
];

// ── GLOBAL APPLICATION STATE ──
const APP = {
  player: null,
  allPlayers: [],
  cards: [],
  scans: []
};

function loadState() {
  // 1. Current Player
  try { APP.player = JSON.parse(localStorage.getItem('hxh_player')); } catch {}
  if (!APP.player) {
    APP.player = {
      id: 'hunter_' + Date.now(),
      nickname: 'Hunter Candidat',
      hunterNumber: 'HXH-' + Math.floor(Math.random() * 900 + 100),
      score: 0,
      scannedCodeIds: [],
      solvedClueIds: []
    };
    savePlayer();
  }

  // 2. All Players
  try { APP.allPlayers = JSON.parse(localStorage.getItem('hxh_all_players')) || []; } catch {}
  if (!APP.allPlayers.length) {
    APP.allPlayers = [APP.player, ...INITIAL_RIVALS];
    localStorage.setItem('hxh_all_players', JSON.stringify(APP.allPlayers));
  } else {
    const idx = APP.allPlayers.findIndex(p => p.id === APP.player.id);
    if (idx >= 0) APP.allPlayers[idx] = APP.player;
    else APP.allPlayers.push(APP.player);
  }

  // 3. QR Cards (with scan quotas)
  try { APP.cards = JSON.parse(localStorage.getItem('hxh_cards')) || []; } catch {}
  if (!APP.cards.length || !APP.cards[0].maxScans) {
    APP.cards = INITIAL_CARDS;
    localStorage.setItem('hxh_cards', JSON.stringify(APP.cards));
  }

  // 4. Live Scans History
  try { APP.scans = JSON.parse(localStorage.getItem('hxh_scans')) || []; } catch {}
  if (!APP.scans.length) {
    APP.scans = [
      { id: 's1', playerNickname: 'Killua_Z',       qrCodeTitle: 'Marais de Numere', pointsAwarded: 50,  timestamp: Date.now() - 1800000 },
      { id: 's2', playerNickname: 'Kurapika_Chain', qrCodeTitle: 'Festin des Gourmets', pointsAwarded: 80, timestamp: Date.now() - 3600000 }
    ];
    localStorage.setItem('hxh_scans', JSON.stringify(APP.scans));
  }
}

function savePlayer() {
  localStorage.setItem('hxh_player', JSON.stringify(APP.player));
  const idx = APP.allPlayers.findIndex(p => p.id === APP.player.id);
  if (idx >= 0) APP.allPlayers[idx] = APP.player;
  else APP.allPlayers.push(APP.player);
  localStorage.setItem('hxh_all_players', JSON.stringify(APP.allPlayers));
}

function saveCards() {
  localStorage.setItem('hxh_cards', JSON.stringify(APP.cards));
}

function saveScans() {
  localStorage.setItem('hxh_scans', JSON.stringify(APP.scans));
}

// ── PROCESS SCAN WITH DYNAMIC QUOTA ENFORCEMENT ──
function processScan(rawCode) {
  if (!rawCode) return null;
  const clean = rawCode.trim().toUpperCase();
  const card = APP.cards.find(c => c.code.toUpperCase() === clean || c.id.toUpperCase() === clean);

  // 1. Invalid Code
  if (!card) {
    return {
      success: false,
      title: 'CODE INCONNU',
      message: 'Ce code QR ne correspond à aucune carte de l\'Examen Hunter officiel.',
      points: 0
    };
  }

  // 2. Already scanned by this user
  if (APP.player.scannedCodeIds.includes(card.code)) {
    return {
      success: false,
      title: 'DÉJÀ VALIDÉ',
      message: `Vous avez déjà validé la carte "${card.title}". Une licence Hunter n'accorde les points qu'une seule fois.`,
      points: 0
    };
  }

  // 3. Quota check
  card.scannedBy = card.scannedBy || [];
  if (card.scannedBy.length >= card.maxScans) {
    return {
      success: false,
      title: 'QUOTA ÉPUISÉ',
      message: `Trop tard ! Le quota maximal de ${card.maxScans} Hunters pour la carte "${card.title}" a été atteint. Ce QR Code est désormais désactivé.`,
      points: 0
    };
  }

  // 4. Successful Scan within Quota!
  card.scannedBy.push(APP.player.id);
  saveCards();

  APP.player.score += card.points;
  APP.player.scannedCodeIds.push(card.code);
  savePlayer();

  APP.scans.unshift({
    id: 'scan_' + Date.now(),
    playerNickname: APP.player.nickname,
    qrCodeTitle: card.title,
    pointsAwarded: card.points,
    timestamp: Date.now()
  });
  saveScans();

  const slotsRemaining = card.maxScans - card.scannedBy.length;

  return {
    success: true,
    title: card.title,
    message: `Félicitations Hunter ! Vous décrochez cette carte (${card.scannedBy.length}/${card.maxScans} places attribuées · ${slotsRemaining} restante(s)).`,
    points: card.points,
    hint: card.hint,
    slotsRemaining: slotsRemaining,
    maxScans: card.maxScans
  };
}

// ── RANK CALCULATION ──
function getRank(score) {
  if (score >= 400) return { title: 'Triple Star Hunter', stars: '★★★', color: '#fbbf24' };
  if (score >= 250) return { title: 'Double Star Hunter', stars: '★★',  color: '#00f2fe' };
  if (score >= 120) return { title: 'Single Star Hunter', stars: '★',   color: '#00f076' };
  if (score >= 50)  return { title: 'Pro Hunter',         stars: '★',   color: '#a855f7' };
  return { title: 'Aspirant Hunter', stars: '', color: '#94a3b8' };
}

// ── SOUND ENGINE (NEN AUDIO FREQUENCIES) ──
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  playSuccess() {
    if (this.isMuted) return;
    try {
      this.init();
      const now = this.ctx.currentTime;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.35;
      gain.connect(this.ctx.destination);
      // Bright anime crystal arpeggio
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, now + i * 0.07);
        g.gain.linearRampToValueAtTime(0.3, now + i * 0.07 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);
        osc.connect(g);
        g.connect(gain);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.36);
      });
    } catch {}
  }
  playError() {
    if (this.isMuted) return;
    try {
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);
      g.gain.setValueAtTime(0.3, now);
      g.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch {}
  }
  playClick() {
    if (this.isMuted) return;
    try {
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      g.gain.setValueAtTime(0.12, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }
}

const sound = new SoundEngine();

function showToast(msg, isError = false) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'toast' + (isError ? ' error' : '');
  t.textContent = msg;
  t.style.position = 'fixed';
  t.style.top = '64px';
  t.style.left = '50%';
  t.style.transform = 'translateX(-50%)';
  t.style.zIndex = '999';
  t.style.background = '#0e1726';
  t.style.border = isError ? '1px solid #f43f5e' : '1px solid #00f076';
  t.style.color = isError ? '#f43f5e' : '#00f076';
  t.style.padding = '8px 18px';
  t.style.borderRadius = '4px';
  t.style.fontFamily = 'var(--font-code)';
  t.style.fontSize = '11px';
  t.style.letterSpacing = '1px';
  t.style.boxShadow = isError ? '0 0 15px rgba(244,63,94,0.4)' : '0 0 15px rgba(0,240,118,0.4)';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

function updateHUD() {
  if (!APP.player) return;
  const scoreEl = document.getElementById('hud-score');
  if (scoreEl) scoreEl.textContent = APP.player.score;
}

// ── ACCÈS DISCRET EXAMINATEUR / ADMIN (3 Taps rapides sur le logo H×H) ──
let adminTapCount = 0;
let adminTapTimer = null;
document.addEventListener('DOMContentLoaded', () => {
  const marks = document.querySelectorAll('.hxh-mark');
  marks.forEach(m => {
    m.style.cursor = 'pointer';
    m.addEventListener('click', () => {
      adminTapCount++;
      clearTimeout(adminTapTimer);
      if (adminTapCount >= 3) {
        adminTapCount = 0;
        const target = window.location.pathname.includes('/pages/') ? './admin.html' : './pages/admin.html';
        window.location.href = target;
      } else {
        adminTapTimer = setTimeout(() => { adminTapCount = 0; }, 1400);
      }
    });
  });
});
