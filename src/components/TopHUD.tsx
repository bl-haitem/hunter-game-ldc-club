import React, { useRef } from 'react';
import { ActiveTab } from '../types/hxh';
import { sound } from '../services/sound';

interface TopHUDProps {
  score: number;
  currentTab: ActiveTab;
  onOpenAdmin: () => void;
}

export const TopHUD: React.FC<TopHUDProps> = ({ score, currentTab, onOpenAdmin }) => {
  const tapCountRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = () => {
    sound.playClick();
    tapCountRef.current++;
    if (timerRef.current) clearTimeout(timerRef.current);

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      onOpenAdmin();
    } else {
      timerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 1200);
    }
  };

  const getPageTag = () => {
    switch (currentTab) {
      case 'scan': return 'LDC EXAM';
      case 'hints': return 'GREED ARCHIVES';
      case 'classmen': return 'RANKING';
      case 'settings': return 'LICENCE HUNTER';
      case 'admin': return 'GAME MASTER';
      default: return 'EXAMEN 2026';
    }
  };

  return (
    <header className="top-hud">
      <div className="hxh-mark" onClick={handleLogoClick} title="Appuyez 3x pour le mode Examinateur" style={{ cursor: 'pointer' }}>
        H<span className="sep">×</span>H
        <span className="ldc-brand-badge" style={{ marginLeft: 8, fontSize: 7, padding: '2px 7px' }}>
          LDC CLUB
        </span>
      </div>

      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        <div className="hud-pts">
          <span>{score}</span> PTS
        </div>
      </div>

      <div style={{ fontFamily: 'var(--font-code)', fontSize: 8, letterSpacing: '1.5px', color: 'var(--hunter-cyan)', textTransform: 'uppercase' }}>
        {getPageTag()}
      </div>
    </header>
  );
};
