/**
 * HUNTER × HUNTER EXAM & GREED ISLAND - MASTER APPLICATION LOGIC
 * High-End Mobile-First Architecture with Real Anime Artwork & Lucide Icons
 */

// ============================== 1. SOUND MANAGER (WEB AUDIO API) ==============================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.ambientGain = null;
    this.ambientOscs = [];
    this.isAmbientPlaying = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Scan Success : Greed Island Card chime / Nen unlock burst
  playSuccess() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const master = this.ctx.createGain();
      master.gain.setValueAtTime(0.5, now);
      master.connect(this.ctx.destination);

      const freqs = [440, 554.37, 659.25, 880, 1108.73];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.5);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.55);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Scan Error / Already scanned buzzer
  playError() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [0, 0.15].forEach((delay) => {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(150, now + delay);
        osc2.frequency.setValueAtTime(144, now + delay);

        gain.gain.setValueAtTime(0.2, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.12);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now + delay);
        osc2.start(now + delay);
        osc1.stop(now + delay + 0.13);
        osc2.stop(now + delay + 0.13);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  // Greed Island "BOOK!" whoosh & card slot click
  playBook() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }

  playClick() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    } catch {}
  }

  // Ambient Meditation Music Drone (Hunter Exam Atmosphere)
  toggleAmbient() {
    this.init();
    if (this.isAmbientPlaying) {
      this.stopAmbient();
      return false;
    } else {
      this.startAmbient();
      return true;
    }
  }

  startAmbient() {
    try {
      if (!this.ctx) return;
      this.stopAmbient();
      const now = this.ctx.currentTime;
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, now);
      this.ambientGain.gain.linearRampToValueAtTime(0.08, now + 1.5);
      this.ambientGain.connect(this.ctx.destination);

      const freqs = [73.4, 110.0, 146.8, 185.0];
      this.ambientOscs = freqs.map((freq) => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        osc.type = 'sine';
        osc.frequency.value = freq;
        filter.type = 'lowpass';
        filter.frequency.value = 350;
        osc.connect(filter);
        filter.connect(this.ambientGain);
        osc.start();
        return osc;
      });
      this.isAmbientPlaying = true;
    } catch {}
  }

  stopAmbient() {
    if (this.ambientGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.ambientGain.gain.linearRampToValueAtTime(0.001, now + 0.5);
        setTimeout(() => {
          this.ambientOscs.forEach(o => { try { o.stop(); o.disconnect(); } catch {} });
          this.ambientOscs = [];
          if (this.ambientGain) { this.ambientGain.disconnect(); this.ambientGain = null; }
        }, 550);
      } catch {}
    }
    this.isAmbientPlaying = false;
  }
}

const sound = new SoundEngine();

// ============================== 2. INITIAL SEED DATA & ARTWORK ==============================
const NEN_INFO = {
  Renforcement: { nameFr: 'Renforcement', color: '#00FF88', tag: 'REN', desc: 'Force et vitalité décuplées' },
  Transmutation: { nameFr: 'Transmutation', color: '#BD00FF', tag: 'HEN', desc: 'Transformation de l\'aura' },
  Émission: { nameFr: 'Émission', color: '#00E5FF', tag: 'HOU', desc: 'Projection d\'énergie' },
  Matérialisation: { nameFr: 'Matérialisation', color: '#E2E8F0', tag: 'GUG', desc: 'Création d\'objets indépendants' },
  Manipulation: { nameFr: 'Manipulation', color: '#FF9900', tag: 'SOU', desc: 'Contrôle d\'êtres et d\'objets' },
  Spécialisation: { nameFr: 'Spécialisation', color: '#FFD700', tag: 'TOK', desc: 'Aptitudes rares et uniques' }
};

const AVATARS = [
  { id: 'gon', name: 'Gon Freecss', image: './assets/gon.jpg', nen: 'Renforcement' },
  { id: 'killua', name: 'Killua Zoldyck', image: './assets/killua.jpg', nen: 'Transmutation' },
  { id: 'kurapika', name: 'Kurapika', image: './assets/kurapika.jpg', nen: 'Matérialisation' },
  { id: 'hisoka', name: 'Hisoka Morow', image: './assets/hisoka.jpg', nen: 'Transmutation' },
];

const INITIAL_CARDS = [
  {
    id: 'card-1',
    code: 'HXH-NUMERE-01',
    title: 'Étape 1 : Le Marais de Numere (Le Nid des Escrocs)',
    stageNumber: 1,
    points: 50,
    hint: 'Méfie-toi du brouillard épais. L\'examinateur Satotz court sans jamais s\'essouffler. Cherche là où les papillons hypnotiques dorment près de l\'arbre ou de l\'entrée principale.',
    locationDesc: 'Zone d\'entrée ou hall d\'accueil.',
    isSingleUseGlobal: false,
    cardRank: 'N',
    image: './assets/card_numere.jpg'
  },
  {
    id: 'card-2',
    code: 'HXH-GOURMET-02',
    title: 'Étape 2 : Le Festin de Menchi & Buhara',
    stageNumber: 2,
    points: 80,
    hint: 'Le Gourmet Hunter recherche la saveur absolue. La cible est dissimulée là où l\'eau et le feu se rencontrent (zone cafétéria, fontaine ou cuisine).',
    locationDesc: 'Près de l\'espace restauration / fontaine.',
    isSingleUseGlobal: false,
    cardRank: 'R',
    image: './assets/greed_island_binder.jpg'
  },
  {
    id: 'card-3',
    code: 'HXH-TRICKTOWER-03',
    title: 'Étape 3 : La Tour aux Astuces (Trick Tower - 72h)',
    stageNumber: 3,
    points: 120,
    hint: 'Une dalle secrète ne s\'ouvre qu\'à la majorité des voix. Regarde sous les marches d\'un escalier ou derrière un pilier élevé.',
    locationDesc: 'Sous un escalier ou angle de pilier.',
    isSingleUseGlobal: false,
    cardRank: 'SR',
    image: './assets/card_trick_tower.jpg'
  },
  {
    id: 'card-4',
    code: 'HXH-ZEVIL-04',
    title: 'Étape 4 : L\'Île de Zevil (Cible Secrète #44)',
    stageNumber: 4,
    points: 150,
    hint: 'L\'aura d\'Hisoka rôde dans l\'ombre. Suis la trace invisible du Zetsu vers un lieu de repos discret ou de verdure.',
    locationDesc: 'Dans une plante verte ou coin salon.',
    isSingleUseGlobal: false,
    cardRank: 'SR',
    image: './assets/hisoka.jpg'
  },
  {
    id: 'card-5',
    code: 'HXH-NETERO-FINAL',
    title: 'Épreuve Finale : Le Défi du Président Netero',
    stageNumber: 5,
    points: 250,
    hint: 'Pour décrocher le titre de Triple Star Hunter, approche-toi de la salle du trône du Président. Le QR code suprême attend les plus téméraires !',
    locationDesc: 'Table d\'honneur de l\'organisateur.',
    isSingleUseGlobal: true,
    cardRank: 'SSR',
    image: './assets/card_netero.jpg'
  }
];

const INITIAL_RIVALS = [
  { id: 'rival-1', nickname: 'Killua_Z', nenType: 'Transmutation', avatarId: 'killua', hunterNumber: 'HXH-099', score: 400, scannedCodeIds: ['HXH-NUMERE-01', 'HXH-GOURMET-02', 'HXH-TRICKTOWER-03', 'HXH-ZEVIL-04'] },
  { id: 'rival-2', nickname: 'Kurapika_Chain', nenType: 'Matérialisation', avatarId: 'kurapika', hunterNumber: 'HXH-404', score: 350, scannedCodeIds: ['HXH-NUMERE-01', 'HXH-GOURMET-02', 'HXH-TRICKTOWER-03'] },
  { id: 'rival-3', nickname: 'Hisoka_★', nenType: 'Transmutation', avatarId: 'hisoka', hunterNumber: 'HXH-044', score: 250, scannedCodeIds: ['HXH-NUMERE-01', 'HXH-GOURMET-02', 'HXH-ZEVIL-04'] },
];

// ============================== 3. STATE & STORAGE MANAGEMENT ==============================
let state = {
  currentView: 'profile',
  player: null,
  allPlayers: [],
  cards: [],
  scans: [],
  cameraStream: null,
  cameraFacing: 'environment',
  isCardFlipped: false,
  bookFilter: 'all'
};

function loadStorage() {
  const storedPlayer = localStorage.getItem('hxh_player');
  if (storedPlayer) {
    try { state.player = JSON.parse(storedPlayer); } catch {}
  }
  if (!state.player) {
    state.player = {
      id: 'player_' + Date.now(),
      nickname: 'Gon Freecss',
      nenType: 'Renforcement',
      avatarId: 'gon',
      hunterNumber: 'HXH-404',
      score: 0,
      scannedCodeIds: [],
      solvedClueIds: []
    };
    savePlayer();
  }

  const storedAll = localStorage.getItem('hxh_all_players');
  if (storedAll) {
    try { state.allPlayers = JSON.parse(storedAll); } catch {}
  }
  if (!state.allPlayers || state.allPlayers.length === 0) {
    state.allPlayers = [state.player, ...INITIAL_RIVALS];
    localStorage.setItem('hxh_all_players', JSON.stringify(state.allPlayers));
  } else {
    const idx = state.allPlayers.findIndex(p => p.id === state.player.id);
    if (idx >= 0) {
      state.allPlayers[idx] = state.player;
    } else {
      state.allPlayers.push(state.player);
    }
  }

  const storedCards = localStorage.getItem('hxh_cards');
  if (storedCards) {
    try { state.cards = JSON.parse(storedCards); } catch {}
  }
  if (!state.cards || state.cards.length === 0) {
    state.cards = INITIAL_CARDS;
    localStorage.setItem('hxh_cards', JSON.stringify(state.cards));
  } else {
    // Make sure all cards have images assigned
    state.cards.forEach((c, idx) => {
      if (!c.image) {
        c.image = INITIAL_CARDS[idx % INITIAL_CARDS.length].image;
      }
    });
    localStorage.setItem('hxh_cards', JSON.stringify(state.cards));
  }

  const storedScans = localStorage.getItem('hxh_scans');
  if (storedScans) {
    try { state.scans = JSON.parse(storedScans); } catch {}
  }
  if (!state.scans || state.scans.length === 0) {
    state.scans = [
      { id: 's1', playerNickname: 'Killua_Z', qrCodeTitle: 'Étape 3 : La Trick Tower', pointsAwarded: 120, timestamp: Date.now() - 1200000 },
      { id: 's2', playerNickname: 'Kurapika_Chain', qrCodeTitle: 'Étape 2 : Le Festin de Menchi', pointsAwarded: 80, timestamp: Date.now() - 3600000 }
    ];
    localStorage.setItem('hxh_scans', JSON.stringify(state.scans));
  }
}

function savePlayer() {
  localStorage.setItem('hxh_player', JSON.stringify(state.player));
  const idx = state.allPlayers.findIndex(p => p.id === state.player.id);
  if (idx >= 0) {
    state.allPlayers[idx] = state.player;
  } else {
    state.allPlayers.push(state.player);
  }
  localStorage.setItem('hxh_all_players', JSON.stringify(state.allPlayers));
}

function saveCards() {
  localStorage.setItem('hxh_cards', JSON.stringify(state.cards));
}

function saveScans() {
  localStorage.setItem('hxh_scans', JSON.stringify(state.scans));
}

function getRank(score) {
  if (score >= 500) return { title: 'Triple Hunter', stars: '★★★', color: '#FFD700' };
  if (score >= 300) return { title: 'Double Hunter', stars: '★★', color: '#00E5FF' };
  if (score >= 150) return { title: 'Single Hunter', stars: '★', color: '#00FF88' };
  if (score >= 50) return { title: 'Pro Hunter', stars: '★', color: '#BD00FF' };
  return { title: 'Aspirant Hunter', stars: '', color: '#94A3B8' };
}

// ============================== 4. NAVIGATION ==============================
function navigateTo(viewId) {
  sound.playClick();
  state.currentView = viewId;

  const views = ['profile', 'scanner', 'book', 'leaderboard', 'admin'];
  views.forEach(v => {
    const el = document.getElementById('view-' + v);
    if (el) el.style.display = (v === viewId ? 'block' : 'none');
    const navBtn = document.getElementById('nav-' + v);
    if (navBtn) {
      if (v === viewId) navBtn.classList.add('active');
      else navBtn.classList.remove('active');
    }
  });

  if (viewId === 'scanner') {
    startCamera();
  } else {
    stopCamera();
  }

  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================== 5. CAMERA & SCANNER ==============================
async function startCamera() {
  const video = document.getElementById('cameraVideo');
  if (!video) return;
  stopCamera();

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: state.cameraFacing, width: { ideal: 1280 } }
    });
    state.cameraStream = stream;
    video.srcObject = stream;
    video.play();
  } catch (err) {
    console.warn('Camera error:', err);
  }
}

function stopCamera() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(t => t.stop());
    state.cameraStream = null;
  }
}

function toggleCameraFacing() {
  sound.playClick();
  state.cameraFacing = (state.cameraFacing === 'environment' ? 'user' : 'environment');
  startCamera();
}

function handleFileScan(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  alert("Photo reçue ! Tu peux également valider le code instantanément via les boutons de test ci-dessous.");
}

// ============================== 6. SCAN PROCESSING ==============================
function processCodeScan(scannedCode) {
  if (!scannedCode) return;
  const clean = scannedCode.trim().toUpperCase();
  const card = state.cards.find(c => c.code.toUpperCase() === clean || c.id === clean);

  if (!card) {
    sound.playError();
    showCelebrationModal({
      success: false,
      title: 'Aura Inconnue',
      message: 'Ce QR Code ne fait pas partie de l\'Examen Hunter ou de Greed Island.',
      points: 0
    });
    return;
  }

  if (state.player.scannedCodeIds.includes(card.code)) {
    sound.playError();
    showCelebrationModal({
      success: false,
      title: 'Carte Déjà Scannée !',
      message: `Tu as déjà validé "${card.title}". Une licence Hunter ne peut pas enregistrer deux fois le même indice !`,
      points: 0
    });
    return;
  }

  if (card.isSingleUseGlobal && card.isScannedGlobally) {
    sound.playError();
    showCelebrationModal({
      success: false,
      title: 'Carte Déjà Réclamée !',
      message: 'Trop tard ! Un autre candidat Hunter s\'est déjà emparé de cette carte unique.',
      points: 0
    });
    return;
  }

  sound.playSuccess();
  if (card.isSingleUseGlobal) {
    card.isScannedGlobally = true;
    saveCards();
  }

  state.player.score += card.points;
  state.player.scannedCodeIds.push(card.code);
  state.player.solvedClueIds.push(card.id);
  savePlayer();

  state.scans.unshift({
    id: 'scan_' + Date.now(),
    playerNickname: state.player.nickname,
    qrCodeTitle: card.title,
    pointsAwarded: card.points,
    timestamp: Date.now()
  });
  saveScans();

  showCelebrationModal({
    success: true,
    title: card.title,
    message: `Félicitations ! Tu as déchiffré l'énigme et remporté +${card.points} points Nen !`,
    points: card.points
  });

  renderAll();
}

function showCelebrationModal({ success, title, message, points }) {
  const modal = document.getElementById('scanCelebrationModal');
  const icon = document.getElementById('scanModalIcon');
  const pts = document.getElementById('scanModalPoints');
  const tit = document.getElementById('scanModalTitle');
  const msg = document.getElementById('scanModalMessage');

  icon.innerText = success ? '✨' : '❌';
  pts.style.display = success ? 'block' : 'none';
  pts.innerText = `+${points} POINTS !`;
  tit.innerText = title;
  msg.innerText = message;
  modal.style.display = 'flex';
}

function closeCelebrationModal() {
  sound.playClick();
  document.getElementById('scanCelebrationModal').style.display = 'none';
}

// ============================== 7. RENDERING WITH REAL ANIME ARTWORK ==============================
function renderAll() {
  renderProfile();
  renderScannerSimulation();
  renderBook();
  renderLeaderboard();
  renderAdmin();
  document.getElementById('headerScore').innerText = state.player.score;

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// View 1: Profile & License
function renderProfile() {
  const p = state.player;
  const nen = NEN_INFO[p.nenType] || NEN_INFO.Renforcement;
  const rank = getRank(p.score);
  const avatar = AVATARS.find(a => a.id === p.avatarId) || AVATARS[0];

  // Top Game HUD updates
  const hudAvatar = document.getElementById('hudAvatarImg');
  if (hudAvatar) hudAvatar.src = avatar.image;
  const hudRankTag = document.getElementById('hudRankTag');
  if (hudRankTag) hudRankTag.innerText = nen.tag || 'REN';
  const hudName = document.getElementById('hudCandidateName');
  if (hudName) hudName.innerText = p.nickname;
  const hudNum = document.getElementById('hudCandidateNumber');
  if (hudNum) hudNum.innerText = p.hunterNumber;

  // License Card elements
  document.getElementById('licenseNickname').innerText = p.nickname;
  document.getElementById('licenseNumber').innerText = `ID: ${p.hunterNumber}`;
  document.getElementById('licenseNenText').innerText = nen.nameFr;
  document.getElementById('licenseNenBadge').style.color = nen.color;
  document.getElementById('licenseNenBadge').style.borderColor = nen.color;
  document.getElementById('licenseNenBadge').style.background = `${nen.color}18`;
  document.getElementById('licenseNenTag').innerText = nen.nameFr.toUpperCase();
  document.getElementById('licenseAvatarImg').src = avatar.image;
  document.getElementById('licenseStars').innerText = rank.stars;
  document.getElementById('licenseRankTitle').innerText = rank.title;
  document.getElementById('licenseRankTitle').style.color = rank.color;
  document.getElementById('licensePoints').innerText = `${p.score} PTS`;
  document.getElementById('licenseScansCount').innerText = `${p.scannedCodeIds.length} / ${state.cards.length}`;
  document.getElementById('licenseSerialBarcode').innerText = `${p.hunterNumber}-GREED-ISLAND-VERIFIED-DATA`;
  document.getElementById('licenseBackNickname').innerText = p.nickname;

  // Dynamic Aura border
  const card = document.getElementById('hunterCard');
  if (card) {
    card.style.borderColor = nen.color;
    card.style.boxShadow = `0 12px 40px rgba(0, 0, 0, 0.9), 0 0 30px ${nen.color}45`;
  }

  // Recent discoveries in profile
  const recentGrid = document.getElementById('profileRecentClues');
  if (recentGrid) {
    recentGrid.innerHTML = state.cards.slice(0, 4).map(c => {
      const isScanned = p.scannedCodeIds.includes(c.code);
      return `
        <div onclick="navigateTo('book')" style="background: rgba(255,255,255,0.03); border: 1px solid ${isScanned ? 'rgba(0,255,136,0.3)' : 'var(--game-border-glass)'}; border-radius: 12px; padding: 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${c.image || './assets/greed_island_binder.jpg'}" alt="${c.title}" style="width: 38px; height: 38px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(255,255,255,0.15);" />
            <div>
              <div style="font-size: 13px; font-weight: 800; color: #fff;">${c.title}</div>
              <div style="font-size: 10px; color: ${isScanned ? 'var(--nen-green)' : '#94a3b8'}; margin-top: 2px;">
                ${isScanned ? '✓ Débloqué dans ton Book' : '🔒 Indice à rechercher'}
              </div>
            </div>
          </div>
          <div style="font-family: var(--font-code); font-weight: 900; font-size: 13px; color: var(--nen-gold);">
            +${c.points}pt
          </div>
        </div>
      `;
    }).join('');
  }
}

// View 2: Scanner Simulator
function renderScannerSimulation() {
  const grid = document.getElementById('scannerSimulationGrid');
  if (!grid) return;

  grid.innerHTML = state.cards.map(card => {
    const isScanned = state.player.scannedCodeIds.includes(card.code);
    return `
      <div onclick="processCodeScan('${card.code}')" style="background: ${isScanned ? 'rgba(0,255,136,0.06)' : 'rgba(255,255,255,0.03)'}; border: 1.5px solid ${isScanned ? 'rgba(0,255,136,0.45)' : 'var(--game-border-glass)'}; border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${card.image || './assets/greed_island_binder.jpg'}" alt="${card.title}" style="width: 38px; height: 38px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(255,255,255,0.2);" />
          <div>
            <div style="font-size: 13px; font-weight: 800; color: ${isScanned ? 'var(--nen-green)' : '#fff'};">${card.title}</div>
            <div style="font-size: 10px; font-family: var(--font-code); color: #64748b; margin-top: 2px;">${card.code}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-family: var(--font-code); font-weight: 900; font-size: 13px; color: var(--nen-gold);">+${card.points}pt</span>
          <span>${isScanned ? '✅' : '⚡'}</span>
        </div>
      </div>
    `;
  }).join('');
}

// View 3: Greed Island Book (Genuine Card Slots with Art)
function filterBook(filter) {
  sound.playBook();
  state.bookFilter = filter;
  ['All', 'Locked', 'Unlocked'].forEach(f => {
    const btn = document.getElementById('filter' + f + 'Btn');
    if (btn) {
      if (f.toLowerCase() === filter) {
        btn.style.borderColor = 'var(--nen-green)';
        btn.style.color = 'var(--nen-green)';
      } else {
        btn.style.borderColor = 'var(--game-border-glass)';
        btn.style.color = 'var(--text-white)';
      }
    }
  });
  renderBook();
}

function renderBook() {
  const grid = document.getElementById('bookCardsGrid');
  if (!grid) return;

  document.getElementById('bookSlotBadge').innerText = 
    `${state.player.scannedCodeIds.length} / ${state.cards.length} CARTES`;

  const filtered = state.cards.filter(c => {
    const isScanned = state.player.scannedCodeIds.includes(c.code);
    if (state.bookFilter === 'unlocked' && !isScanned) return false;
    if (state.bookFilter === 'locked' && isScanned) return false;
    return true;
  });

  grid.innerHTML = filtered.map((c, idx) => {
    const isScanned = state.player.scannedCodeIds.includes(c.code);
    const cardArt = c.image || './assets/greed_island_binder.jpg';

    return `
      <div class="greed-card-slot ${isScanned ? 'acquired' : ''}" onclick="inspectCard('${c.id}')">
        <div class="slot-card-image-header">
          <img src="${cardArt}" alt="${c.title}" />
          <div class="slot-badge-number">No. 00${c.stageNumber || idx + 1}</div>
          <div class="slot-badge-rarity rarity-${c.cardRank || 'SR'}">${c.cardRank || 'SR'}</div>
        </div>
        <div class="slot-card-body">
          <div>
            <div class="slot-stage-title">${c.title}</div>
            <div class="slot-hint-snippet">"${c.hint}"</div>
          </div>
          <div class="slot-card-footer">
            <span style="color: ${isScanned ? 'var(--nen-green)' : 'var(--nen-gold)'}; font-weight: 800; font-size: 11px;">
              ${isScanned ? '✓ Déjà Acquise' : '🔍 Indice Disponible'}
            </span>
            <span style="font-weight: 900; color: var(--nen-gold); font-family: var(--font-code);">+${c.points} PTS</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function inspectCard(cardId) {
  sound.playBook();
  const card = state.cards.find(c => c.id === cardId);
  if (!card) return;
  const isScanned = state.player.scannedCodeIds.includes(card.code);

  alert(`📖 CARTE GREED ISLAND No. 00${card.stageNumber}\n\n` +
        `TITRE: ${card.title}\n` +
        `VALEUR: +${card.points} POINTS NEN\n` +
        `RARETÉ: ${card.cardRank || 'SR'}\n` +
        `STATUT: ${isScanned ? 'Déjà scannée et acquise ✅' : 'À rechercher sur le terrain 🔒'}\n\n` +
        `ÉNIGME NEN:\n"${card.hint}"\n\n` +
        `INDICE D'EMPLACEMENT:\n${card.locationDesc || 'Non précisé'}`);
}

// View 4: Leaderboard with Anime Portraits
function renderLeaderboard() {
  const sorted = [...state.allPlayers].sort((a, b) => b.score - a.score);
  const podium = document.getElementById('podiumContainer');
  const list = document.getElementById('leaderboardList');
  const top1 = sorted[0];
  const top2 = sorted[1];
  const top3 = sorted[2];

  const getAvatarImg = (avatarId) => {
    const a = AVATARS.find(x => x.id === avatarId);
    return a ? a.image : './assets/gon.jpg';
  };

  if (podium) {
    podium.innerHTML = `
      <!-- 2nd Place -->
      ${top2 ? `
        <div class="podium-box rank-2">
          <div class="podium-character-avatar">
            <img src="${getAvatarImg(top2.avatarId)}" alt="${top2.nickname}" />
          </div>
          <div style="font-size: 12px; font-weight: 900; color: #fff; truncate; max-width: 90px; font-family: var(--font-game);">${top2.nickname}</div>
          <div style="font-size: 12px; font-weight: 900; color: var(--nen-cyan); font-family: var(--font-code);">${top2.score} PTS</div>
          <div class="podium-pedestal">2ND</div>
        </div>
      ` : '<div></div>'}

      <!-- 1st Place -->
      ${top1 ? `
        <div class="podium-box rank-1">
          <div style="color: var(--nen-gold); font-size: 22px; margin-bottom: -4px;">👑</div>
          <div class="podium-character-avatar">
            <img src="${getAvatarImg(top1.avatarId)}" alt="${top1.nickname}" />
          </div>
          <div style="font-size: 14px; font-weight: 900; color: #fff; truncate; max-width: 100px; font-family: var(--font-game);">${top1.nickname}</div>
          <div style="font-size: 14px; font-weight: 900; color: var(--nen-gold); font-family: var(--font-code);">${top1.score} PTS</div>
          <div class="podium-pedestal">1ST</div>
        </div>
      ` : '<div></div>'}

      <!-- 3rd Place -->
      ${top3 ? `
        <div class="podium-box rank-3">
          <div class="podium-character-avatar">
            <img src="${getAvatarImg(top3.avatarId)}" alt="${top3.nickname}" />
          </div>
          <div style="font-size: 12px; font-weight: 900; color: #fff; truncate; max-width: 90px; font-family: var(--font-game);">${top3.nickname}</div>
          <div style="font-size: 12px; font-weight: 900; color: #cd7f32; font-family: var(--font-code);">${top3.score} PTS</div>
          <div class="podium-pedestal">3RD</div>
        </div>
      ` : '<div></div>'}
    `;
  }

  if (list) {
    list.innerHTML = sorted.map((p, idx) => {
      const isMe = p.id === state.player.id;
      const rank = getRank(p.score);
      const nen = NEN_INFO[p.nenType] || NEN_INFO.Renforcement;
      return `
        <div class="candidate-row-card ${isMe ? 'is-active-user' : ''}">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 24px; font-weight: 900; font-size: 14px; color: ${idx === 0 ? 'var(--nen-gold)' : '#94a3b8'}; font-family: var(--font-game);">
              #${idx + 1}
            </div>
            <div style="width: 44px; height: 44px; border-radius: 10px; overflow: hidden; border: 1.5px solid var(--game-border-glass); flex-shrink: 0; background: #000;">
              <img src="${getAvatarImg(p.avatarId)}" alt="${p.nickname}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div>
              <div style="font-weight: 900; font-size: 14px; color: #fff; display: flex; align-items: center; gap: 6px; font-family: var(--font-game);">
                ${p.nickname} ${isMe ? '<span style="font-size: 9px; background: var(--nen-green); color: #000; padding: 2px 6px; border-radius: 4px; font-weight: 900;">TOI</span>' : ''}
              </div>
              <div style="font-size: 11px; color: ${nen.color}; font-weight: 800;">
                ${nen.nameFr} • <span style="color: #94a3b8;">${rank.title}</span>
              </div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: var(--font-code); font-weight: 900; font-size: 16px; color: var(--nen-green);">
              ${p.score} PTS
            </div>
            <div style="font-size: 10px; color: #64748b; font-family: var(--font-code);">${p.scannedCodeIds.length} scans</div>
          </div>
        </div>
      `;
    }).join('');
  }

  const liveEl = document.getElementById('liveScansList');
  if (liveEl) {
    document.getElementById('liveScanCount').innerText = `${state.scans.length} scans`;
    liveEl.innerHTML = state.scans.slice(0, 8).map(s => `
      <div style="padding: 10px 14px; background: rgba(255,255,255,0.03); border-radius: 10px; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-weight: 800; color: var(--nen-gold); font-family: var(--font-game);">${s.playerNickname}</span>
          a validé <span style="color: #fff; font-weight: 600;">"${s.qrCodeTitle}"</span>
        </div>
        <div style="font-weight: 900; color: var(--nen-green); font-family: var(--font-code);">
          +${s.pointsAwarded} PTS
        </div>
      </div>
    `).join('');
  }
}

function toggleProjectorMode() {
  sound.playClick();
  const lb = document.getElementById('view-leaderboard');
  if (lb.classList.contains('projector-mode')) {
    lb.classList.remove('projector-mode');
    lb.style.cssText = 'display: block;';
  } else {
    lb.classList.add('projector-mode');
    lb.style.cssText = 'display: block; position: fixed; inset: 0; z-index: 1000; background: #05060a; padding: 24px; overflow-y: auto;';
  }
}

// View 5: Admin Panel
function renderAdmin() {
  const list = document.getElementById('adminCardsList');
  if (!list) return;

  list.innerHTML = state.cards.map((card, idx) => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: rgba(0,0,0,0.4); border: 1.5px solid var(--game-border-glass); border-radius: 12px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <img src="${card.image || './assets/greed_island_binder.jpg'}" alt="${card.title}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(255,255,255,0.15);" />
        <div>
          <div style="font-weight: 900; font-size: 13px; color: #fff; font-family: var(--font-game);">${card.title}</div>
          <div style="font-size: 10px; font-family: var(--font-code); color: var(--nen-green); margin-top: 2px;">
            Code: ${card.code} • Rareté: ${card.cardRank || 'SR'} • ${card.isSingleUseGlobal ? '⚠️ Unique' : 'Pour tous'}
          </div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-weight: 900; color: var(--nen-gold); font-size: 14px; font-family: var(--font-code);">+${card.points}pt</span>
        <button onclick="deleteCard('${card.id}')" style="background: none; border: none; color: #ff3366; font-size: 16px; cursor: pointer;">
          ✕
        </button>
      </div>
    </div>
  `).join('');
}

function handleCreateQRCode(e) {
  e.preventDefault();
  sound.playClick();

  const title = document.getElementById('adminTitle').value.trim();
  const points = parseInt(document.getElementById('adminPoints').value, 10);
  const rarity = document.getElementById('adminRarity').value;
  const hint = document.getElementById('adminHint').value.trim();
  const location = document.getElementById('adminLocation').value.trim();
  const isSingle = document.getElementById('adminSingleUse').checked;

  const newCode = `HXH-${title.substring(0, 4).toUpperCase().replace(/\s/g, '')}-${Math.floor(10 + Math.random() * 89)}`;

  const newCard = {
    id: 'card-' + Date.now(),
    code: newCode,
    title: title,
    stageNumber: state.cards.length + 1,
    points: points,
    hint: hint,
    locationDesc: location,
    isSingleUseGlobal: isSingle,
    cardRank: rarity,
    image: './assets/greed_island_binder.jpg'
  };

  state.cards.push(newCard);
  saveCards();

  alert(`✅ Nouveau QR Code créé avec succès !\nCode généré : ${newCode}\nPoints : ${points} PTS`);
  e.target.reset();
  renderAll();
}

function deleteCard(id) {
  if (confirm("Supprimer définitivement ce QR Code et cette énigme ?")) {
    state.cards = state.cards.filter(c => c.id !== id);
    saveCards();
    renderAll();
  }
}

// Print Generator for physical cards
function printAllQRCards() {
  sound.playClick();
  const printArea = document.getElementById('printArea');
  if (!printArea) return;

  printArea.innerHTML = state.cards.map(c => `
    <div class="print-card-sheet" style="page-break-after: always; padding: 40px; border: 4px double #000; text-align: center; font-family: sans-serif; max-width: 500px; margin: 20px auto;">
      <div style="font-size: 22px; font-weight: 900; letter-spacing: 2px; margin-bottom: 4px;">
        HUNTER × HUNTER EXAM
      </div>
      <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; color: #444;">
        FICHE OFFICIELLE D'INDICE DE L'EXAMEN HUNTER
      </div>

      <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
        ${c.title}
      </div>
      <div style="display: inline-block; padding: 4px 12px; border: 2px solid #000; font-weight: 900; font-size: 14px; margin-bottom: 20px;">
        VALEUR : +${c.points} POINTS NEN
      </div>

      <div style="display: flex; justify-content: center; margin: 20px 0;">
        <div id="print-qr-${c.id}" style="padding: 12px; border: 2px solid #000; border-radius: 8px; width: 200px; height: 200px; display: flex; align-items: center; justify-content: center;">
        </div>
      </div>

      <div style="font-family: monospace; font-size: 14px; font-weight: bold; margin-bottom: 16px;">
        CODE DE SECOURS : ${c.code}
      </div>

      <div style="border-top: 1px dashed #000; padding-top: 16px; margin-top: 10px; font-style: italic; font-size: 13px; line-height: 1.5;">
        " ${c.hint} "
      </div>

      <div style="margin-top: 24px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666;">
        Scanne ce QR Code depuis l'application web pour valider ton passage et accumuler tes points !
      </div>
    </div>
  `).join('');

  printArea.style.display = 'block';

  setTimeout(() => {
    state.cards.forEach(c => {
      const el = document.getElementById(`print-qr-${c.id}`);
      if (el && window.QRCode) {
        el.innerHTML = '';
        new window.QRCode(el, {
          text: c.code,
          width: 176,
          height: 176,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.H
        });
      }
    });
    window.print();
  }, 200);
}

// ============================== 8. PROFILE MODAL ==============================
function openProfileModal() {
  sound.playClick();
  const modal = document.getElementById('profileEditModal');
  const input = document.getElementById('editNicknameInput');
  const select = document.getElementById('editNenSelect');
  const avatarGrid = document.getElementById('avatarGrid');

  input.value = state.player.nickname;
  select.value = state.player.nenType;

  avatarGrid.innerHTML = AVATARS.map(a => `
    <div onclick="selectAvatar('${a.id}')" id="avatar-item-${a.id}" style="cursor: pointer; border-radius: 12px; border: 2px solid ${a.id === state.player.avatarId ? 'var(--nen-green)' : 'var(--game-border-glass)'}; overflow: hidden; position: relative; aspect-ratio: 1/1; box-shadow: ${a.id === state.player.avatarId ? '0 0 14px rgba(0,255,136,0.5)' : 'none'};">
      <img src="${a.image}" alt="${a.name}" style="width: 100%; height: 100%; object-fit: cover;" />
      <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.85); font-size: 9px; font-weight: 800; text-align: center; color: #fff; padding: 2px 0;">
        ${a.name}
      </div>
    </div>
  `).join('');

  modal.style.display = 'flex';
}

function selectAvatar(id) {
  sound.playClick();
  state.player.avatarId = id;
  const chosen = AVATARS.find(a => a.id === id);
  if (chosen) {
    document.getElementById('editNenSelect').value = chosen.nen;
  }
  AVATARS.forEach(a => {
    const el = document.getElementById('avatar-item-' + a.id);
    if (el) {
      el.style.borderColor = (a.id === id ? 'var(--nen-green)' : 'var(--game-border-glass)');
      el.style.boxShadow = (a.id === id ? '0 0 14px rgba(0,255,136,0.5)' : 'none');
    }
  });
}

function saveProfileChanges() {
  sound.playClick();
  const input = document.getElementById('editNicknameInput');
  const select = document.getElementById('editNenSelect');

  if (input.value.trim()) {
    state.player.nickname = input.value.trim();
  }
  state.player.nenType = select.value;
  savePlayer();

  document.getElementById('profileEditModal').style.display = 'none';
  renderAll();
}

// 3D Card Flip & Gyro
function initCard3D() {
  const card = document.getElementById('hunterCard');
  if (!card) return;

  card.addEventListener('click', () => {
    sound.playClick();
    state.isCardFlipped = !state.isCardFlipped;
    const front = document.getElementById('licenseFront');
    const back = document.getElementById('licenseBack');
    if (state.isCardFlipped) {
      front.style.display = 'none';
      back.style.display = 'flex';
    } else {
      front.style.display = 'block';
      back.style.display = 'none';
    }
  });

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    card.style.transform = `perspective(1000px) rotateX(${-(y / (rect.height / 2)) * 8}deg) rotateY(${(x / (rect.width / 2)) * 8}deg)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
  });
}

function initAudioButton() {
  const btn = document.getElementById('audioToggleBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const active = sound.toggleAmbient();
    if (active) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// ============================== 9. INITIALIZATION ==============================
window.addEventListener('DOMContentLoaded', () => {
  loadStorage();
  initCard3D();
  initAudioButton();
  renderAll();
});
