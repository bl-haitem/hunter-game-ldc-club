import React, { useState } from 'react';
import { Player, ScanLog } from '../types/hxh';
import { getRankTier } from '../data/initialData';
import { sound } from '../services/sound';

interface ClassmenViewProps {
  player: Player;
  allPlayers: Player[];
  scans: ScanLog[];
}

export const ClassmenView: React.FC<ClassmenViewProps> = ({
  player,
  allPlayers,
  scans
}) => {
  const [activeSegment, setActiveSegment] = useState<'leaderboard' | 'live'>('leaderboard');

  // Sort players descending by score
  const sortedPlayers = [...allPlayers].sort((a, b) => (b.score || 0) - (a.score || 0));
  const myRankIdx = sortedPlayers.findIndex(p => p.id === player.id);
  const myRank = myRankIdx >= 0 ? myRankIdx + 1 : 1;

  // Top 3 Podium
  const top1 = sortedPlayers[0] || { nickname: 'killua.zoldyck', score: 350, hunterNumber: 'HXH-099' };
  const top2 = sortedPlayers[1] || { nickname: 'kurapika.kurta', score: 230, hunterNumber: 'HXH-404' };
  const top3 = sortedPlayers[2] || { nickname: player.nickname || 'Hunter', score: player.score, hunterNumber: player.hunterNumber };
  const restPlayers = sortedPlayers.slice(3);

  return (
    <div className="classmen-layout">
      {/* Header with Japanese */}
      <div style={{ flexShrink: 0 }}>
        <div className="page-header" style={{ marginBottom: 8 }}>
          <h1>ランキング <em>CLASSEMENT</em></h1>
          <p>TABLEAU OFFICIEL EN DIRECT — ORGANISÉ PAR LE CLUB LDC</p>
        </div>

        {/* Segment switch: Podium / Live */}
        <div className="segment-tabs">
          <button
            className={`segment-tab ${activeSegment === 'leaderboard' ? 'active' : ''}`}
            onClick={() => { sound.playClick(); setActiveSegment('leaderboard'); }}
          >
            🏆 Podium & Candidats
          </button>
          <button
            className={`segment-tab ${activeSegment === 'live' ? 'active' : ''}`}
            onClick={() => { sound.playClick(); setActiveSegment('live'); }}
          >
            ⚡ Scans en direct
          </button>
        </div>
      </div>

      {/* View 1: Leaderboard & Podium */}
      {activeSegment === 'leaderboard' && (
        <div className="panel-view" id="view-leaderboard">
          {/* Top 3 Luxury Podium Stage */}
          <div className="podium-container">
            {/* 2nd Place (Left) — Silver / Cyan */}
            <div className="podium-stand-col">
              <div className="podium-crown">🥈</div>
              <div className="podium-name" style={{ color: 'var(--hunter-cyan)' }}>
                {top2.nickname}
              </div>
              <div className="podium-score" style={{ color: 'var(--hunter-cyan)' }}>
                {top2.score} PTS
              </div>
              <div className="podium-pedestal pedestal-2">
                <span className="pedestal-rank-num">2</span>
              </div>
            </div>

            {/* 1st Place (Center) — Gold Greed Island */}
            <div className="podium-stand-col">
              <div className="podium-crown">👑</div>
              <div className="podium-name" style={{ color: 'var(--hunter-gold)', fontSize: 12, fontWeight: 900 }}>
                {top1.nickname}
              </div>
              <div className="podium-score" style={{ color: 'var(--hunter-gold)', fontSize: 13 }}>
                {top1.score} PTS
              </div>
              <div className="podium-pedestal pedestal-1">
                <span className="pedestal-rank-num">1</span>
              </div>
            </div>

            {/* 3rd Place (Right) — Bronze / Emerald */}
            <div className="podium-stand-col">
              <div className="podium-crown">🥉</div>
              <div className="podium-name" style={{ color: 'var(--hunter-green)' }}>
                {top3.nickname}
              </div>
              <div className="podium-score" style={{ color: 'var(--hunter-green)' }}>
                {top3.score} PTS
              </div>
              <div className="podium-pedestal pedestal-3">
                <span className="pedestal-rank-num">3</span>
              </div>
            </div>
          </div>

          {/* Remaining Top Candidates List */}
          <div className="compact-rank-list">
            {restPlayers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--ash)', fontSize: 10 }}>
                Aucun autre candidat pour le moment.
              </div>
            ) : (
              restPlayers.map((p, idx) => {
                const rankInfo = getRankTier(p.score || 0);
                const isMe = p.id === player.id;
                return (
                  <div
                    key={p.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: isMe ? 'rgba(0, 240, 118, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isMe ? 'var(--hunter-green)' : 'var(--border-glass)'}`,
                      borderRadius: 6,
                      boxShadow: isMe ? 'var(--glow-green)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: 'var(--font-hxh)', fontSize: 16, color: 'var(--ash)', width: 20 }}>
                        #{idx + 4}
                      </span>
                      <div>
                        <div style={{ fontFamily: 'var(--font-jp)', fontSize: 12, fontWeight: 700, color: isMe ? 'var(--hunter-green)' : '#fff' }}>
                          {p.nickname} {isMe ? '(Vous)' : ''}
                        </div>
                        <div style={{ fontFamily: 'var(--font-code)', fontSize: 8, color: rankInfo.color, marginTop: 1 }}>
                          {rankInfo.title} · {p.hunterNumber || 'HXH'}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-code)', fontSize: 12, fontWeight: 800, color: 'var(--hunter-gold)' }}>
                      {p.score} PTS
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Player pinned card at bottom */}
          <div className="user-pinned-bar" style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontFamily: 'var(--font-hxh)', fontSize: 24, color: 'var(--hunter-green)', lineHeight: 1 }}>
                #{myRank}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-jp)', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  {player.nickname}
                </div>
                <div style={{ fontFamily: 'var(--font-code)', fontSize: 8, color: 'var(--hunter-cyan)', letterSpacing: 1 }}>
                  VOTRE RANG ACTUEL
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-code)', fontSize: 16, fontWeight: 800, color: 'var(--hunter-gold)' }}>
                {player.score} PTS
              </div>
            </div>
          </div>

          {/* LDC Club Creator Signature */}
          <div className="ldc-footer-credit" style={{ marginTop: 6, flexShrink: 0 }}>
            <span className="dot">✦</span> JEU CRÉÉ PAR LE CLUB LDC <span className="dot">✦</span>
          </div>
        </div>
      )}

      {/* View 2: Live Feed */}
      {activeSegment === 'live' && (
        <div className="panel-view" id="view-live" style={{ justifyContent: 'flex-start' }}>
          <div style={{ fontFamily: 'var(--font-code)', fontSize: 9, letterSpacing: 2, color: 'var(--ash)', textTransform: 'uppercase', margin: '4px 0 8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>FLUX D'ACTIVITÉ NEN</span>
            <span style={{ color: 'var(--hunter-green)' }}>{scans.length} SCANS</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', flex: 1, paddingRight: 2 }}>
            {scans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--ash)', fontSize: 11 }}>
                Aucune activité récente. Scannez un QR code pour débuter !
              </div>
            ) : (
              scans.map(s => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 6
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-jp)', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                      {s.hunterName} <span style={{ color: 'var(--ash)', fontWeight: 400 }}>a réclamé</span> {s.cardTitle}
                    </div>
                    <div style={{ fontFamily: 'var(--font-code)', fontSize: 8, color: 'var(--ash)', marginTop: 2 }}>
                      {s.time} · {s.hunterId}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-code)', fontSize: 11, fontWeight: 700, color: 'var(--hunter-green)' }}>
                    +{s.points} PTS
                  </div>
                </div>
              ))
            )}
          </div>

          {/* LDC Club Creator Signature */}
          <div className="ldc-footer-credit" style={{ marginTop: 6, flexShrink: 0 }}>
            <span className="dot">✦</span> JEU CRÉÉ PAR LE CLUB LDC <span className="dot">✦</span>
          </div>
        </div>
      )}
    </div>
  );
};
