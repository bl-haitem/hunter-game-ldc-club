import React, { useState } from 'react';
import { PlayerProfile, ScanRecord } from '../types';
import { NEN_TYPES_INFO, getRankFromScore, AVATAR_PRESETS } from '../types/nenData';
import { Trophy, Crown, Flame, Tv, Sparkles, Clock, Shield } from 'lucide-react';

interface LeaderboardProps {
  currentPlayer: PlayerProfile;
  players: PlayerProfile[];
  scans: ScanRecord[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  currentPlayer,
  players,
  scans,
}) => {
  const [activeTab, setActiveTab] = useState<'ranking' | 'liveFeed'>('ranking');
  const [projectorMode, setProjectorMode] = useState(false);

  // Sort players descending by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const top1 = sortedPlayers[0];
  const top2 = sortedPlayers[1];
  const top3 = sortedPlayers[2];
  const rest = sortedPlayers.slice(3);

  const getAvatar = (id: string) => {
    return AVATAR_PRESETS.find((a) => a.id === id) || AVATAR_PRESETS[0];
  };

  return (
    <div
      className={`w-full mx-auto transition-all duration-300 ${
        projectorMode
          ? 'fixed inset-0 z-50 bg-[#07080d] p-6 overflow-y-auto'
          : 'max-w-2xl space-y-4'
      }`}
    >
      {/* Top Header & Projector Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-hunter-gold to-amber-600 flex items-center justify-center text-black shadow-lg">
            <Trophy className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-black font-display tracking-tight text-white flex items-center gap-2">
              CLASSEMENT OFFICIEL
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                TEMPS RÉEL
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Les meilleurs candidats à l'obtention du titre de Pro Hunter
            </p>
          </div>
        </div>

        {/* Projector / Big Screen Mode Button */}
        <button
          onClick={() => setProjectorMode(!projectorMode)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
            projectorMode
              ? 'bg-hunter-neon text-black border-hunter-neon shadow-nen-green'
              : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/30'
          }`}
          title="Mode plein écran pour rétroprojecteur"
        >
          <Tv className="w-3.5 h-3.5" />
          <span>{projectorMode ? 'Quitter Plein Écran' : 'Mode Écran Géant'}</span>
        </button>
      </div>

      {/* Tabs: Ranking vs Live Feed */}
      <div className="flex gap-2 p-1 rounded-xl bg-black/40 border border-white/10">
        <button
          onClick={() => setActiveTab('ranking')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'ranking'
              ? 'bg-hunter-card text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-hunter-gold" />
          <span>Podium & Classement</span>
        </button>
        <button
          onClick={() => setActiveTab('liveFeed')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'liveFeed'
              ? 'bg-hunter-card text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-hunter-cyan" />
          <span>Scans en Direct ({scans.length})</span>
        </button>
      </div>

      {activeTab === 'ranking' ? (
        <>
          {/* THE PODIUM (Top 3 Hunters) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-8 pb-4">
            {/* 2nd Place */}
            {top2 && (
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-500 border-2 border-slate-300 flex items-center justify-center text-2xl shadow-lg">
                    {getAvatar(top2.avatarId).emoji}
                  </div>
                  <div className="absolute -bottom-2 -right-1 px-1.5 py-0.5 rounded-full bg-slate-400 text-black font-black text-[10px] shadow">
                    2
                  </div>
                </div>
                <div className="text-center w-full px-1">
                  <div className="text-xs font-bold text-white truncate font-display">
                    {top2.nickname}
                  </div>
                  <div className="text-xs font-black text-cyan-400 font-mono">
                    {top2.score} PTS
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    ★★ Double
                  </div>
                </div>
                <div className="w-full h-20 sm:h-24 bg-gradient-to-t from-slate-900 to-slate-800 border-t-2 border-slate-400 rounded-t-xl mt-2 flex items-center justify-center text-slate-500 font-mono font-bold text-sm">
                  2ND
                </div>
              </div>
            )}

            {/* 1st Place (Winner / Triple Hunter) */}
            {top1 && (
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <Crown className="w-7 h-7 text-hunter-gold absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce" />
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-300 to-yellow-600 border-2 border-hunter-gold flex items-center justify-center text-3xl sm:text-4xl shadow-nen-gold">
                    {getAvatar(top1.avatarId).emoji}
                  </div>
                  <div className="absolute -bottom-2 -right-1 px-2 py-0.5 rounded-full bg-hunter-gold text-black font-black text-xs shadow">
                    1
                  </div>
                </div>
                <div className="text-center w-full px-1">
                  <div className="text-sm font-black text-white truncate font-display flex items-center justify-center gap-1">
                    {top1.nickname}
                    <Sparkles className="w-3 h-3 text-hunter-gold" />
                  </div>
                  <div className="text-sm font-black text-hunter-gold font-mono">
                    {top1.score} PTS
                  </div>
                  <div className="text-[10px] font-bold text-hunter-neon uppercase tracking-wider">
                    ★★★ TRIPLE STAR
                  </div>
                </div>
                <div className="w-full h-28 sm:h-32 bg-gradient-to-t from-amber-950/60 to-amber-900/40 border-t-2 border-hunter-gold rounded-t-xl mt-2 flex items-center justify-center text-hunter-gold font-mono font-black text-base shadow-lg">
                  1ST
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3 && (
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 border-2 border-amber-600 flex items-center justify-center text-2xl shadow-lg">
                    {getAvatar(top3.avatarId).emoji}
                  </div>
                  <div className="absolute -bottom-2 -right-1 px-1.5 py-0.5 rounded-full bg-amber-600 text-white font-black text-[10px] shadow">
                    3
                  </div>
                </div>
                <div className="text-center w-full px-1">
                  <div className="text-xs font-bold text-white truncate font-display">
                    {top3.nickname}
                  </div>
                  <div className="text-xs font-black text-emerald-400 font-mono">
                    {top3.score} PTS
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    ★ Single
                  </div>
                </div>
                <div className="w-full h-14 sm:h-16 bg-gradient-to-t from-slate-900 to-slate-800 border-t-2 border-amber-700 rounded-t-xl mt-2 flex items-center justify-center text-amber-700 font-mono font-bold text-sm">
                  3RD
                </div>
              </div>
            )}
          </div>

          {/* Full Candidate List */}
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 px-1">
              Tous les Participants ({sortedPlayers.length})
            </div>
            {sortedPlayers.map((player, index) => {
              const isCurrent = player.id === currentPlayer.id;
              const nenInfo = NEN_TYPES_INFO[player.nenType];
              const rankInfo = getRankFromScore(player.score);

              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                    isCurrent
                      ? 'bg-hunter-neon/10 border-hunter-neon shadow-nen-green'
                      : 'bg-hunter-card border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank index */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                        index === 0
                          ? 'bg-hunter-gold text-black'
                          : index === 1
                          ? 'bg-slate-300 text-black'
                          : index === 2
                          ? 'bg-amber-600 text-white'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center text-xl shrink-0">
                      {getAvatar(player.avatarId).emoji}
                    </div>

                    {/* Name & Nen */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-bold text-sm text-white truncate">
                          {player.nickname}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-hunter-neon text-black">
                            Toi
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span style={{ color: nenInfo.color }}>
                          {player.nenType}
                        </span>
                        <span>•</span>
                        <span>{rankInfo.rank}</span>
                      </div>
                    </div>
                  </div>

                  {/* Score & Scans */}
                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-base text-hunter-neon">
                      {player.score} <span className="text-[10px] text-slate-400">PTS</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {player.scannedCodeIds.length} scans
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* LIVE SCANS FEED */
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Historique des Scans en Direct
          </div>

          {scans.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-hunter-card border border-white/10 text-slate-400 text-xs">
              Aucun scan enregistré pour le moment. Sois le premier à scanner un QR Code !
            </div>
          ) : (
            scans.map((scan) => (
              <div
                key={scan.id}
                className="p-3 rounded-2xl bg-hunter-card border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-hunter-neon/20 border border-hunter-neon/30 flex items-center justify-center text-hunter-neon shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-white">
                      <span className="font-bold text-hunter-gold">
                        {scan.playerNickname}
                      </span>{' '}
                      a validé <span className="font-semibold text-slate-200">"{scan.qrCodeTitle}"</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(scan.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="font-mono font-black text-sm text-hunter-neon shrink-0">
                  +{scan.pointsAwarded} PTS
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
