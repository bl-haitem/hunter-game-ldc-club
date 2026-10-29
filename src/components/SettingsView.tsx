import React from 'react';
import { Player } from '../types/hxh';
import { getRankTier } from '../data/initialData';
import { sound } from '../services/sound';

interface SettingsViewProps {
  player: Player;
  totalCards: number;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  player,
  totalCards,
  onLogout
}) => {
  const rank = getRankTier(player.score);

  const handleLogoutClick = () => {
    sound.playClick();
    if (window.confirm('Voulez-vous vraiment vous déconnecter de votre Licence Hunter ?')) {
      onLogout();
    }
  };

  return (
    <div className="settings-layout">
      {/* Top Section */}
      <div>
        <div className="page-header" style={{ marginBottom: 12 }}>
          <h1>ライセンス <em>LICENCE HUNTER</em></h1>
          <p>PROFIL CANDIDAT — EXAMEN OFFICIEL 2026</p>
        </div>

        {/* Hunter Dossier Card */}
        <div className="hunter-dossier">
          <div className="stamp-badge">ASSOCIATION HUNTER • LDC CLUB</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-code)', fontSize: 8, color: 'var(--ash)', letterSpacing: '1.5px' }}>
                IDENTIFIANT :
              </div>
              <div style={{ fontFamily: 'var(--font-code)', fontSize: 16, fontWeight: 700, color: 'var(--hunter-cyan)', letterSpacing: 1 }}>
                {player.hunterNumber || 'HXH-404'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-code)', fontSize: 8, color: 'var(--ash)', letterSpacing: '1.5px' }}>
                TITRE ACTUEL :
              </div>
              <div style={{ fontFamily: 'var(--font-hxh)', fontSize: 14, color: rank.color }}>
                {rank.title.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Locked Name Display (Name CANNOT be edited) */}
          <div style={{ marginBottom: 12 }}>
            <div className="field-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><span style={{ color: 'var(--hunter-green)' }}>▸</span> PSEUDO DU CANDIDAT</span>
              <span style={{ color: 'var(--hunter-cyan)', fontSize: 9, fontFamily: 'var(--font-code)' }}>
                🔒 VERROUILLÉ PAR L'EXAMEN
              </span>
            </div>
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(0, 240, 118, 0.3)',
                borderRadius: 4,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ fontFamily: 'var(--font-code)', fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>
                {player.nickname}
              </span>
              <span
                style={{
                  background: 'rgba(0, 240, 118, 0.1)',
                  color: 'var(--hunter-green)',
                  border: '1px solid rgba(0, 240, 118, 0.3)',
                  padding: '2px 8px',
                  borderRadius: 3,
                  fontSize: 9,
                  fontFamily: 'var(--font-code)'
                }}
              >
                Invariable
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-code)', fontSize: 8, color: 'var(--ash)', marginTop: 4, letterSpacing: 0.5 }}>
              * Le nom est généré automatiquement depuis votre adresse email pour garantir l'intégrité de l'épreuve.
            </div>
          </div>

          {/* Registered Email Field (Read-only) */}
          <div style={{ marginBottom: 12 }}>
            <div className="field-label">
              <span style={{ color: 'var(--hunter-cyan)' }}>▸</span> COMPTE GOOGLE CONNECTÉ (CONVEX DB)
            </div>
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid var(--border-glass)',
                borderRadius: 4,
                padding: '8px 12px',
                fontFamily: 'var(--font-code)',
                fontSize: 12,
                color: 'var(--hunter-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>{player.email || 'candidat@gmail.com'}</span>
              <span style={{ fontSize: 10, color: 'var(--hunter-green)' }}>✓ Google SSO</span>
            </div>
          </div>

          {/* Nen Type Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 4 }}>
            <span style={{ fontFamily: 'var(--font-code)', fontSize: 9, color: 'var(--ash)' }}>
              AFFINITÉ DE NEN DÉTECTÉE :
            </span>
            <span style={{ fontFamily: 'var(--font-jp)', fontSize: 11, fontWeight: 700, color: 'var(--hunter-gold)' }}>
              {player.nenType || 'Transmutation'}
            </span>
          </div>
        </div>
      </div>

      {/* Center Status Summary */}
      <div>
        <div className="stat-pill">
          <div>
            <div style={{ fontFamily: 'var(--font-code)', fontSize: 8, color: 'var(--ash)', letterSpacing: 1, textTransform: 'uppercase' }}>
              CARTES ACQUISES
            </div>
            <div style={{ fontFamily: 'var(--font-hxh)', fontSize: 18, color: '#fff' }}>
              {player.scannedCodeIds.length} / {totalCards}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-code)', fontSize: 8, color: 'var(--ash)', letterSpacing: 1, textTransform: 'uppercase' }}>
              TOTAL POINTS NEN
            </div>
            <div style={{ fontFamily: 'var(--font-code)', fontSize: 18, fontWeight: 700, color: 'var(--hunter-gold)' }}>
              {player.score} PTS
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          className="action-btn-logout"
          onClick={handleLogoutClick}
          id="btn-logout"
          style={{
            background: 'rgba(255, 68, 68, 0.15)',
            borderColor: 'var(--hunter-danger)',
            color: 'var(--hunter-danger)',
            width: '100%',
            padding: '12px 18px',
            fontSize: 12,
            letterSpacing: 1.5,
            fontWeight: 700
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>SE DÉCONNECTER (LOGOUT)</span>
        </button>

        {/* LDC Club Creator Signature */}
        <div className="ldc-footer-credit" style={{ marginTop: 6 }}>
          <span className="dot">✦</span> JEU CONÇU & DÉVELOPPÉ PAR LE CLUB LDC <span className="dot">✦</span>
        </div>
      </div>
    </div>
  );
};
