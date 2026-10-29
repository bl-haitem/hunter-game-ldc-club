import React, { useState, useEffect } from 'react';
import { Card, Player, ScanLog, Rarity } from '../types/hxh';
import { QRCodeSVG } from 'qrcode.react';
import { sound } from '../services/sound';
import { getRankTier, INITIAL_CARDS } from '../data/initialData';
import { convexDb } from '../services/convexService';

interface AdminViewProps {
  cards: Card[];
  allPlayers: Player[];
  scans: ScanLog[];
  onUpdatePlayerPoints: (playerId: string, newPoints: number) => Promise<void>;
  onUpdateCardQuota: (cardId: string, newQuota: number) => Promise<void>;
  onAddCard: (card: Omit<Card, 'id' | 'scannedBy'>) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onAdminLogin: (password: string) => Promise<{ success: boolean; message?: string }>;
  onAdminLogout: () => Promise<void>;
  onChangeAdminPassword?: (newPassword: string) => Promise<{ success: boolean; message: string }>;
  onReloadDatabase?: () => Promise<void>;
  onExitAdmin: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  cards,
  allPlayers,
  scans,
  onUpdatePlayerPoints,
  onUpdateCardQuota,
  onAddCard,
  onDeleteCard,
  onAdminLogin,
  onAdminLogout,
  onChangeAdminPassword,
  onReloadDatabase,
  onExitAdmin
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminCards, setAdminCards] = useState<Card[]>(cards);
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Modal Changement de mot de passe
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ text: string; error: boolean } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

  // Active Admin Tab: 'candidates' | 'quotas' | 'create'
  const [adminTab, setAdminTab] = useState<'candidates' | 'quotas' | 'create'>('candidates');

  // Candidate Search & Editing
  const [playerSearch, setPlayerSearch] = useState('');
  const [pointsInputs, setPointsInputs] = useState<Record<string, number>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Card Form state
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState(50);
  const [rarity, setRarity] = useState<Rarity>('N');
  const [maxScans, setMaxScans] = useState(5);
  const [hint, setHint] = useState('');

  // Selected QR preview (Code cryptographique vectoriel en mémoire)
  const [previewCard, setPreviewCard] = useState<{ code: string; title: string; points?: number; rarity?: string } | null>(null);

  // Quota inputs state map
  const [quotaInputs, setQuotaInputs] = useState<Record<string, number>>({});

  const downloadQRCode = () => {
    sound.playClick();
    const svg = document.getElementById('admin-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 40, 40, 520, 520);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR_${(previewCard?.title || 'Card').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const refreshAdminCards = async () => {
    try {
      const fresh = await convexDb.getCards();
      if (Array.isArray(fresh) && fresh.length > 0) {
        setAdminCards(fresh);
      }
      if (onReloadDatabase) await onReloadDatabase();
    } catch (e) {
      console.warn('[AdminView] Erreur refreshAdminCards:', e);
    }
  };

  useEffect(() => {
    setAdminCards(cards);
  }, [cards]);

  // Vérifier la session admin existante de manière sécurisée au chargement
  useEffect(() => {
    let mounted = true;
    convexDb.checkAdminSession()
      .then(valid => {
        if (mounted) {
          setIsAuthenticated(valid);
          setIsVerifyingSession(false);
          if (valid) {
            refreshAdminCards();
          }
        }
      })
      .catch(() => {
        if (mounted) {
          setIsAuthenticated(false);
          setIsVerifyingSession(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim() || isLoggingIn) return;

    setIsLoggingIn(true);
    setAuthError(null);

    try {
      const res = await onAdminLogin(passwordInput);
      if (res.success) {
        setIsAuthenticated(true);
        setPasswordInput('');
        sound.playSuccess();
        showToast('Session Administrateur validée avec succès');
        await refreshAdminCards();
      } else {
        setAuthError(res.message || 'Mot de passe examinateur incorrect !');
        sound.playError();
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Erreur de connexion');
      sound.playError();
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await onAdminLogout();
    setIsAuthenticated(false);
    sound.playClick();
    showToast('Session Administrateur fermée');
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus({ text: 'Le mot de passe doit comporter au moins 6 caractères !', error: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ text: 'Les deux mots de passe ne correspondent pas !', error: true });
      return;
    }
    if (!onChangeAdminPassword) return;

    setIsChangingPassword(true);
    setPasswordStatus(null);

    try {
      const res = await onChangeAdminPassword(newPassword);
      if (res.success) {
        setPasswordStatus({ text: res.message || 'Mot de passe modifié avec succès !', error: false });
        sound.playSuccess();
        setTimeout(() => {
          setShowPasswordModal(false);
          setNewPassword('');
          setConfirmPassword('');
          setPasswordStatus(null);
        }, 1500);
      } else {
        setPasswordStatus({ text: res.message || 'Erreur lors de la modification', error: true });
        sound.playError();
      }
    } catch (err: any) {
      setPasswordStatus({ text: err?.message || 'Erreur serveur', error: true });
      sound.playError();
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleScoreSave = async (playerId: string) => {
    const val = pointsInputs[playerId];
    const player = allPlayers.find(p => p.id === playerId);
    const scoreToSet = val !== undefined ? val : (player?.score || 0);

    if (scoreToSet < 0) {
      alert('Le score ne peut pas être inférieur à 0 !');
      return;
    }

    try {
      await onUpdatePlayerPoints(playerId, scoreToSet);
      sound.playSuccess();
      showToast(`Score de ${player?.nickname} fixé à ${scoreToSet} PTS !`);
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la modification des points');
      sound.playError();
    }
  };

  const handleQuickAdd = (playerId: string, delta: number) => {
    const player = allPlayers.find(p => p.id === playerId);
    const current = pointsInputs[playerId] !== undefined ? pointsInputs[playerId] : (player?.score || 0);
    const nextVal = Math.max(0, current + delta);
    setPointsInputs(prev => ({ ...prev, [playerId]: nextVal }));
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !hint.trim()) return;

    // Générateur cryptographique CSPRNG haute entropie (Zéro corrélation avec le titre, impossible à deviner)
    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);
    const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let randStr = '';
    for (let i = 0; i < 8; i++) {
      randStr += alphabet[randomBytes[i] % alphabet.length];
    }
    const code = `HXH-${randStr.slice(0, 4)}-${randStr.slice(4, 8)}`;

    try {
      await onAddCard({
        code,
        title: title.trim(),
        points,
        cardRank: rarity,
        maxScans,
        hint: hint.trim()
      });

      setPreviewCard({ code, title, points, rarity });
      setTitle('');
      setHint('');
      sound.playSuccess();
      showToast('Nouvelle carte Nen enregistrée avec succès !');
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la création de la carte');
      sound.playError();
    }
  };

  const handleQuotaChange = async (cardId: string, currentScans: number) => {
    const val = quotaInputs[cardId];
    if (val === undefined || isNaN(val) || val < currentScans) {
      alert(`Veuillez entrer un quota au moins égal au nombre actuel de scans (${currentScans}) !`);
      return;
    }
    try {
      await onUpdateCardQuota(cardId, val);
      sound.playSuccess();
      showToast('Quota mis à jour sur la base de données !');
    } catch (err: any) {
      alert(err?.message || 'Erreur mise à jour quota');
      sound.playError();
    }
  };

  if (isVerifyingSession) {
    return (
      <div style={{ maxWidth: 360, margin: '80px auto', padding: 20, textAlign: 'center' }}>
        <div className="card" style={{ padding: 24, borderColor: 'var(--hunter-cyan)', boxShadow: 'var(--glow-cyan)' }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>🛡️</div>
          <div style={{ fontFamily: 'var(--font-code)', fontSize: 11, color: 'var(--hunter-cyan)', letterSpacing: 1.5 }}>
            VÉRIFICATION DE LA SESSION SÉCURISÉE...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: 380, margin: '60px auto', padding: 20, textAlign: 'center' }}>
        <div className="card" style={{ padding: 28, borderColor: 'var(--hunter-cyan)', boxShadow: 'var(--glow-cyan)' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
          <h2 style={{ fontFamily: 'var(--font-hxh)', fontSize: 22, letterSpacing: 1.5, color: '#fff', marginBottom: 6 }}>
            PANEL EXAMINATEUR SÉCURISÉ
          </h2>
          <div style={{
            display: 'inline-block',
            background: 'rgba(0, 240, 118, 0.1)',
            border: '1px solid rgba(0, 240, 118, 0.3)',
            borderRadius: 4,
            padding: '4px 10px',
            marginBottom: 16
          }}>
            <span style={{ fontFamily: 'var(--font-code)', fontSize: 9, color: 'var(--hunter-green)', letterSpacing: 1 }}>
              SHIELD ANTI BRUTE-FORCE ACTIF
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-code)', fontSize: 9, color: 'var(--ash)', marginBottom: 18, lineHeight: 1.5 }}>
            ACCÈS RÉSERVÉ AU GAME MASTER (LDC CLUB).<br />
            AUCUN MOT DE PASSE N'EST STOCKÉ DANS LE NAVIGATEUR.
          </p>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Mot de passe examinateur..."
              value={passwordInput}
              onChange={e => {
                setPasswordInput(e.target.value);
                if (authError) setAuthError(null);
              }}
              className="field-input"
              style={{ textAlign: 'center', marginBottom: 12 }}
              disabled={isLoggingIn}
              autoFocus
            />

            {authError && (
              <div style={{
                color: 'var(--hunter-danger)',
                fontSize: 10,
                fontFamily: 'var(--font-code)',
                marginBottom: 12,
                background: 'rgba(255, 68, 68, 0.1)',
                padding: '8px 10px',
                borderRadius: 4,
                border: '1px solid rgba(255, 68, 68, 0.3)'
              }}>
                ⚠ {authError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-outline btn-full btn-sm"
                onClick={onExitAdmin}
                disabled={isLoggingIn}
              >
                RETOUR
              </button>
              <button
                type="submit"
                className="btn btn-green btn-full btn-sm"
                disabled={isLoggingIn || !passwordInput.trim()}
              >
                {isLoggingIn ? 'VÉRIFICATION...' : 'DÉVERROUILLER'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Filtrage des candidats
  const filteredPlayers = allPlayers.filter(p => {
    const q = playerSearch.toLowerCase();
    return (
      p.nickname.toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.hunterNumber || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 80px', overflowY: 'auto', height: '100%' }}>
      {/* Toast Alert */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: '#07131f',
            border: '1px solid var(--hunter-green)',
            color: 'var(--hunter-green)',
            padding: '8px 18px',
            borderRadius: 4,
            fontFamily: 'var(--font-code)',
            fontSize: 11,
            letterSpacing: 1,
            boxShadow: '0 0 20px rgba(0,240,118,0.5)'
          }}
        >
          ✓ {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 12 }}>
        <h1>PANEL EXAMINATEUR <em>LDC CLUB</em></h1>
        <p>CONTRÔLE DES CANDIDATS, POINTS & QUOTAS NEN</p>
      </div>

      {/* Security Session Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(5, 15, 25, 0.7)',
        border: '1px solid rgba(0, 240, 118, 0.25)',
        borderRadius: 6,
        padding: '8px 12px',
        marginBottom: 14,
        flexWrap: 'wrap',
        gap: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12 }}>🛡️</span>
          <span style={{ fontFamily: 'var(--font-code)', fontSize: 10, color: 'var(--hunter-green)', fontWeight: 700 }}>
            SESSION SÉCURISÉE
          </span>
          <span style={{ fontFamily: 'var(--font-code)', fontSize: 9, color: 'var(--ash)' }}>
            (CONVEX SHA-256)
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={() => { setShowPasswordModal(true); setPasswordStatus(null); sound.playClick(); }}
            style={{ fontSize: 9, padding: '4px 8px' }}
          >
            🔑 CHANGER MOT DE PASSE
          </button>
          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={handleLogout}
            style={{ fontSize: 9, padding: '4px 8px', color: 'var(--hunter-danger)', borderColor: 'rgba(255,68,68,0.4)' }}
          >
            ⏻ VERROUILLER
          </button>
        </div>
      </div>

      {/* Modal Changement de mot de passe */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div className="card" style={{ maxWidth: 360, width: '100%', padding: 22, borderColor: 'var(--hunter-cyan)', boxShadow: 'var(--glow-cyan)' }}>
            <h3 style={{ fontFamily: 'var(--font-hxh)', fontSize: 16, color: '#fff', marginBottom: 6 }}>
              MODIFIER LE MOT DE PASSE ADMIN
            </h3>
            <p style={{ fontFamily: 'var(--font-code)', fontSize: 9, color: 'var(--ash)', marginBottom: 14 }}>
              Le nouveau mot de passe sera immédiatement haché et mis à jour sur Convex Cloud.
            </p>

            <form onSubmit={handleChangePasswordSubmit}>
              <div style={{ marginBottom: 10 }}>
                <label className="field-label" style={{ fontSize: 9 }}>NOUVEAU MOT DE PASSE (MIN 6 CARACTÈRES)</label>
                <input
                  type="password"
                  className="field-input"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Nouveau mot de passe..."
                  required
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="field-label" style={{ fontSize: 9 }}>CONFIRMER LE MOT DE PASSE</label>
                <input
                  type="password"
                  className="field-input"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez..."
                  required
                />
              </div>

              {passwordStatus && (
                <div style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-code)',
                  marginBottom: 10,
                  padding: '6px 8px',
                  borderRadius: 4,
                  color: passwordStatus.error ? 'var(--hunter-danger)' : 'var(--hunter-green)',
                  background: passwordStatus.error ? 'rgba(255,68,68,0.1)' : 'rgba(0,240,118,0.1)'
                }}>
                  {passwordStatus.text}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-full btn-sm"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={isChangingPassword}
                >
                  ANNULER
                </button>
                <button
                  type="submit"
                  className="btn btn-green btn-full btn-sm"
                  disabled={isChangingPassword || !newPassword || !confirmPassword}
                >
                  {isChangingPassword ? 'ENREGISTREMENT...' : 'ENREGISTRER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div className="card" style={{ padding: 12, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-code)', fontSize: 20, fontWeight: 900, color: 'var(--hunter-green)' }}>
            {allPlayers.length}
          </div>
          <div style={{ fontSize: 8, color: 'var(--ash)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            Candidats
          </div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-code)', fontSize: 20, fontWeight: 900, color: 'var(--hunter-cyan)' }}>
            {scans.length}
          </div>
          <div style={{ fontSize: 8, color: 'var(--ash)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            Total Scans
          </div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-code)', fontSize: 20, fontWeight: 900, color: 'var(--hunter-gold)' }}>
            {cards.length}
          </div>
          <div style={{ fontSize: 8, color: 'var(--ash)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            Cibles Actives
          </div>
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button
          onClick={() => { sound.playClick(); setAdminTab('candidates'); }}
          className={`btn btn-sm ${adminTab === 'candidates' ? 'btn-green' : 'btn-outline'}`}
          style={{ flex: 1, fontSize: 10, padding: '8px 4px' }}
        >
          👤 Candidats & Points ({allPlayers.length})
        </button>
        <button
          onClick={() => { sound.playClick(); setAdminTab('quotas'); }}
          className={`btn btn-sm ${adminTab === 'quotas' ? 'btn-green' : 'btn-outline'}`}
          style={{ flex: 1, fontSize: 10, padding: '8px 4px' }}
        >
          🎯 Quotas Cartes ({cards.length})
        </button>
        <button
          onClick={() => { sound.playClick(); setAdminTab('create'); }}
          className={`btn btn-sm ${adminTab === 'create' ? 'btn-green' : 'btn-outline'}`}
          style={{ flex: 1, fontSize: 10, padding: '8px 4px' }}
        >
          ＋ Nouveau QR
        </button>
      </div>

      {/* TAB 1: CANDIDATES LIST & POINTS CONTROL (CORE USER REQUIREMENT) */}
      {adminTab === 'candidates' && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--hunter-green)' }}>
              ★ LISTE DES JOUEURS & CONTRÔLE DES POINTS
            </div>
            <span style={{ fontFamily: 'var(--font-code)', fontSize: 9, color: 'var(--hunter-cyan)' }}>
              Convex Live
            </span>
          </div>

          {/* Search Box */}
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Rechercher par nom, email ou HXH-ID..."
              value={playerSearch}
              onChange={e => setPlayerSearch(e.target.value)}
              className="field-input"
              style={{ fontSize: 11 }}
            />
          </div>

          {/* Candidates Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredPlayers.map(p => {
              const currentScore = pointsInputs[p.id] !== undefined ? pointsInputs[p.id] : p.score;
              const rank = getRankTier(currentScore);

              return (
                <div
                  key={p.id}
                  style={{
                    background: 'rgba(2, 6, 14, 0.7)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 6,
                    padding: 12
                  }}
                >
                  {/* Top info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--font-code)', fontSize: 10, fontWeight: 700, color: 'var(--hunter-cyan)' }}>
                          {p.hunterNumber}
                        </span>
                        <span style={{ fontFamily: 'var(--font-jp)', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                          {p.nickname}
                        </span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-code)', fontSize: 9, color: 'var(--ash)', marginTop: 2 }}>
                        {p.email || 'Email non renseigné'} · {p.scannedCodeIds.length} cartes validées
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: 'var(--font-code)',
                          color: rank.color,
                          background: 'rgba(255,255,255,0.03)',
                          padding: '2px 6px',
                          borderRadius: 3,
                          border: `1px solid ${rank.color}40`
                        }}
                      >
                        {rank.title}
                      </span>
                    </div>
                  </div>

                  {/* Score Modifier Controls */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '8px 10px',
                      borderRadius: 4,
                      gap: 6
                    }}
                  >
                    {/* Quick increment/decrement buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(p.id, -50)}
                        style={{
                          background: 'rgba(244, 63, 94, 0.15)',
                          border: '1px solid rgba(244, 63, 94, 0.3)',
                          color: '#f43f5e',
                          padding: '3px 7px',
                          borderRadius: 3,
                          fontSize: 10,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-code)'
                        }}
                      >
                        -50
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(p.id, +50)}
                        style={{
                          background: 'rgba(0, 240, 118, 0.15)',
                          border: '1px solid rgba(0, 240, 118, 0.3)',
                          color: 'var(--hunter-green)',
                          padding: '3px 7px',
                          borderRadius: 3,
                          fontSize: 10,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-code)'
                        }}
                      >
                        +50
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(p.id, +100)}
                        style={{
                          background: 'rgba(251, 191, 36, 0.15)',
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                          color: 'var(--hunter-gold)',
                          padding: '3px 7px',
                          borderRadius: 3,
                          fontSize: 10,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-code)'
                        }}
                      >
                        +100
                      </button>
                    </div>

                    {/* Score Number Input & Save Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="number"
                          value={currentScore}
                          min={0}
                          max={99999}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            setPointsInputs(prev => ({ ...prev, [p.id]: val }));
                          }}
                          style={{
                            width: 65,
                            padding: '4px 6px',
                            border: '1px solid var(--hunter-gold)',
                            background: '#040711',
                            color: 'var(--hunter-gold)',
                            fontWeight: 700,
                            borderRadius: 3,
                            textAlign: 'center',
                            fontFamily: 'var(--font-code)',
                            fontSize: 12
                          }}
                        />
                        <span style={{ fontFamily: 'var(--font-code)', fontSize: 9, color: 'var(--ash)', marginLeft: 4 }}>
                          PTS
                        </span>
                      </div>

                      <button
                        onClick={() => handleScoreSave(p.id)}
                        className="btn btn-sm btn-green"
                        style={{ padding: '4px 10px', fontSize: 10, fontWeight: 700 }}
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredPlayers.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--ash)', fontFamily: 'var(--font-code)', fontSize: 11 }}>
                Aucun candidat trouvé pour cette recherche.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE CARDS & QUOTA MANAGEMENT */}
      {adminTab === 'quotas' && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--hunter-gold)', marginBottom: 12 }}>
            Cartes Actives & Modification des Quotas
          </div>

          {(adminCards.length > 0 ? adminCards : cards).map(c => {
            const currentScans = (c.scannedBy || []).length;
            const isQuotaFull = currentScans >= c.maxScans;
            const slotsRemaining = Math.max(0, c.maxScans - currentScans);
            const currentInputValue = quotaInputs[c.id] !== undefined ? quotaInputs[c.id] : c.maxScans;

            let displayCode = c.code;
            if (!displayCode || displayCode.includes('NEN-CIPHER-PROTECTED')) {
              const matchedInit = INITIAL_CARDS.find(ic => ic.title === c.title || ic.id === c.id);
              if (matchedInit) displayCode = matchedInit.code;
            }

            return (
              <div key={c.id} className="qr-card-admin" style={{ background: 'rgba(2,4,10,0.6)', border: '1px solid var(--border-glass)', borderRadius: 6, padding: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-jp)', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                      {c.title}
                    </div>
                    <div style={{ fontFamily: 'var(--font-code)', fontSize: 9, color: 'var(--ash)', marginTop: 2 }}>
                      {displayCode} · +{c.points} PTS
                    </div>
                  </div>
                  <div>
                    <span className={`chip ${isQuotaFull ? 'chip-danger' : 'chip-green'}`}>
                      {isQuotaFull ? 'QUOTA ATTEINT' : `${slotsRemaining} PLACES RESTANTES`}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 4, margin: '8px 0' }}>
                  <div style={{ fontFamily: 'var(--font-code)', fontSize: 10, color: 'var(--ash)' }}>
                    Scans actuels : <strong style={{ color: '#fff' }}>{currentScans}</strong> / Quota max :
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="number"
                      value={currentInputValue}
                      min={currentScans}
                      max={999}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setQuotaInputs(prev => ({ ...prev, [c.id]: val }));
                      }}
                      style={{
                        width: 55,
                        padding: 4,
                        border: '1px solid var(--hunter-cyan)',
                        background: '#050811',
                        color: '#fff',
                        borderRadius: 3,
                        textAlign: 'center',
                        fontFamily: 'var(--font-code)',
                        fontSize: 11
                      }}
                    />
                    <button
                      onClick={() => handleQuotaChange(c.id, currentScans)}
                      className="btn btn-sm btn-cyan"
                      style={{ padding: '4px 8px', fontSize: 9 }}
                    >
                      Changer Quota
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setPreviewCard({ code: displayCode, title: c.title, points: c.points, rarity: c.cardRank });
                    }}
                    className="btn btn-sm btn-cyan"
                    style={{ fontSize: 9, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <span>👁️ Afficher QR Code</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Voulez-vous supprimer cette carte ?')) {
                        onDeleteCard(c.id);
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: '#f43f5e', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-code)' }}
                  >
                    [Supprimer]
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: CREATE CARD FORM */}
      {adminTab === 'create' && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--hunter-cyan)', marginBottom: 12 }}>
            ＋ Créer une Nouvelle Carte Nen & Fixer son Quota
          </div>
          <form onSubmit={handleCreateCard}>
            <div style={{ marginBottom: 10 }}>
              <label className="field-label">Titre de la Carte</label>
              <input
                type="text"
                className="field-input"
                placeholder="Ex: Île de Zevil — Plaque #44"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div>
                <label className="field-label">Points</label>
                <input
                  type="number"
                  className="field-input"
                  value={points}
                  onChange={e => setPoints(parseInt(e.target.value) || 0)}
                  min={10}
                  max={1000}
                  required
                />
              </div>
              <div>
                <label className="field-label">Rareté</label>
                <select
                  className="field-input"
                  value={rarity}
                  onChange={e => setRarity(e.target.value as Rarity)}
                >
                  <option value="N">Normal (N)</option>
                  <option value="R">Rare (R)</option>
                  <option value="SR">Super Rare (SR)</option>
                  <option value="SSR">Double/Triple (SSR)</option>
                </select>
              </div>
              <div>
                <label className="field-label">Quota Max Scans</label>
                <input
                  type="number"
                  className="field-input"
                  value={maxScans}
                  onChange={e => setMaxScans(parseInt(e.target.value) || 1)}
                  min={1}
                  max={999}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="field-label">Indice / Énigme</label>
              <textarea
                className="field-input"
                rows={2}
                placeholder="Écrivez l'indice pour orienter les candidats..."
                value={hint}
                onChange={e => setHint(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-green btn-full btn-sm">
              GÉNÉRER LE QR CODE & ENREGISTRER
            </button>
          </form>
        </div>
      )}

      {/* Return Button */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <button onClick={onExitAdmin} className="btn btn-outline btn-full">
          ← RETOURNER À L'ARÈNE (SCANNER)
        </button>
      </div>

      {/* MODAL GLOBAL : QR CODE VECTORIEL SÉCURISÉ & TÉLÉCHARGEMENT */}
      {previewCard && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 6, 14, 0.92)',
          backdropFilter: 'blur(10px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div className="card" style={{
            maxWidth: 380,
            width: '100%',
            padding: 24,
            textAlign: 'center',
            borderColor: 'var(--hunter-cyan)',
            boxShadow: '0 0 45px rgba(0, 242, 254, 0.35)',
            background: 'linear-gradient(160deg, #091322 0%, #03070e 100%)',
            borderRadius: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{
                fontFamily: 'var(--font-code)',
                fontSize: 9.5,
                color: 'var(--hunter-green)',
                letterSpacing: 1.5,
                fontWeight: 700
              }}>
                ✦ QR CODE NEN CRYPTOGRAPHIQUE ✦
              </div>
              <button
                type="button"
                onClick={() => setPreviewCard(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ash)',
                  fontSize: 18,
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                ✕
              </button>
            </div>

            <h3 style={{ fontFamily: 'var(--font-hxh)', fontSize: 18, color: '#fff', marginBottom: 4 }}>
              {previewCard.title}
            </h3>

            {previewCard.points !== undefined && (
              <div style={{ fontFamily: 'var(--font-code)', fontSize: 11, color: 'var(--hunter-gold)', marginBottom: 10 }}>
                VALEUR : {previewCard.points} PTS {previewCard.rarity ? `• RANG [${previewCard.rarity}]` : ''}
              </div>
            )}

            <div style={{
              fontFamily: 'var(--font-code)',
              fontSize: 10,
              color: 'var(--hunter-cyan)',
              marginBottom: 14,
              wordBreak: 'break-all',
              background: 'rgba(0, 242, 254, 0.08)',
              padding: '6px 10px',
              borderRadius: 4,
              border: '1px solid rgba(0, 242, 254, 0.2)'
            }}>
              CODE : {previewCard.code}
            </div>

            {/* Rendu Vectoriel Dynamique SVG (Zéro image en base de données) */}
            <div style={{
              background: '#ffffff',
              padding: 16,
              borderRadius: 10,
              display: 'inline-block',
              boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
              marginBottom: 14
            }}>
              <QRCodeSVG
                id="admin-qr-svg"
                value={previewCard.code}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>

            <p style={{
              fontFamily: 'var(--font-code)',
              fontSize: 8.5,
              color: 'var(--ash)',
              marginBottom: 16,
              lineHeight: 1.4
            }}>
              🔒 GÉNÉRATION VECTORIELLE DYNAMIQUE EN MÉMOIRE.<br />
              Aucune image n'est enregistrée en base de données.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={downloadQRCode}
                className="btn btn-green btn-full btn-sm"
                style={{ fontWeight: 700 }}
              >
                📥 TÉLÉCHARGER LE QR CODE (PNG HAUTE RÉSOLUTION)
              </button>
              <button
                type="button"
                onClick={() => setPreviewCard(null)}
                className="btn btn-outline btn-full btn-sm"
              >
                FERMER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LDC Club Creator Signature */}
      <div className="ldc-footer-credit">
        <span className="dot">✦</span> SYSTÈME DE CONTRÔLE CRÉÉ PAR LE CLUB LDC <span className="dot">✦</span>
      </div>
    </div>
  );
};
