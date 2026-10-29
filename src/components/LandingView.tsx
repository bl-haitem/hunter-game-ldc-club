import React, { useRef } from 'react';
import { sound } from '../services/sound';

interface LandingViewProps {
  totalHunters: number;
  totalCodes: number;
  topScore: number;
  onStart: () => void;
  onOpenAdmin?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  totalHunters,
  totalCodes,
  topScore,
  onStart,
  onOpenAdmin
}) => {
  const tapCountRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStart = () => {
    sound.playClick();
    onStart();
  };

  const handleLogoTripleTap = () => {
    sound.playClick();
    tapCountRef.current++;
    if (timerRef.current) clearTimeout(timerRef.current);

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      if (onOpenAdmin) onOpenAdmin();
    } else {
      timerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 1200);
    }
  };

  return (
    <div className="landing-page">
      {/* HxH All Characters Ensemble (Gon, Killua, Kurapika, Hisoka, Chrollo) */}
      <div className="landing-hero">
        <img src="/assets/hero_ensemble.jpg" alt="Hunter x Hunter Heroes and Villains" />
      </div>

      {/* Dramatic Nen Aura Overlay */}
      <div className="landing-overlay" />

      {/* Content Layer */}
      <div className="landing-content">
        {/* Top bar */}
        <div className="landing-top">
          <div
            className="hxh-mark"
            onClick={handleLogoTripleTap}
            title="Appuyez 3x pour le mode Examinateur"
            style={{ cursor: 'pointer' }}
          >
            H<span className="sep">×</span>H
            <span className="ldc-brand-badge" style={{ marginLeft: 8, color: 'var(--hunter-cyan)', borderColor: 'rgba(0,242,254,0.35)' }}>
              LDC CLUB
            </span>
          </div>
          <div className="ldc-brand-badge">
            MADE BY LDC CLUB
          </div>
        </div>

        {/* Bottom hero content */}
        <div className="landing-bottom">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span className="ldc-brand-badge">✦ MADE BY LDC CLUB ✦</span>
            <span style={{ fontFamily: 'var(--font-code)', fontSize: 10, letterSpacing: '2px', color: 'var(--hunter-green)', textShadow: 'var(--glow-green)', textTransform: 'uppercase' }}>
              ハンター試験 <span>—</span> OFFICIAL EXAM
            </span>
          </div>

          <h1 className="landing-title">
            THE<br />
            <span className="green">HUNTER</span><br />
            EXAM
          </h1>

          <p style={{ fontFamily: 'var(--font-jp)', fontSize: 12, color: '#cbd5e1', lineHeight: 1.6, maxWidth: 320, marginBottom: 18, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
            Traquez les cartes de Nen dissimulées dans l'arène avant l'épuisement des quotas autorisés. Résolvez les énigmes, cumulez vos points et décrochez votre Licence de Hunter.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <button onClick={handleStart} className="btn-enter" id="btn-start" style={{ border: 'none' }}>
              開始する — ENTRER DANS L'ARÈNE
              <span style={{ fontSize: 16 }}>→</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-hxh)', fontSize: 24, letterSpacing: '1px', color: 'var(--hunter-gold)', lineHeight: 1 }}>
                {totalHunters}
              </div>
              <div style={{ fontFamily: 'var(--font-code)', fontSize: 8, letterSpacing: '1.5px', color: 'var(--ash)', textTransform: 'uppercase', marginTop: 2 }}>
                Candidats
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-hxh)', fontSize: 24, letterSpacing: '1px', color: 'var(--hunter-cyan)', lineHeight: 1 }}>
                {totalCodes}
              </div>
              <div style={{ fontFamily: 'var(--font-code)', fontSize: 8, letterSpacing: '1.5px', color: 'var(--ash)', textTransform: 'uppercase', marginTop: 2 }}>
                Cibles Actives
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-hxh)', fontSize: 24, letterSpacing: '1px', color: 'var(--hunter-green)', lineHeight: 1 }}>
                {topScore > 0 ? `${topScore} PTS` : '—'}
              </div>
              <div style={{ fontFamily: 'var(--font-code)', fontSize: 8, letterSpacing: '1.5px', color: 'var(--ash)', textTransform: 'uppercase', marginTop: 2 }}>
                Record Nen
              </div>
            </div>
          </div>

          {/* LDC Club Creator Signature */}
          <div className="ldc-footer-credit" style={{ marginTop: 14 }}>
            <span className="dot">✦</span> JEU CRÉÉ PAR LE CLUB LDC <span>•</span> MADE BY LDC CLUB <span className="dot">✦</span>
          </div>
        </div>
      </div>
    </div>
  );
};
