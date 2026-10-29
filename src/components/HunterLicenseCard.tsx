import React, { useState } from 'react';
import { PlayerProfile } from '../types';
import { NEN_TYPES_INFO, getRankFromScore, AVATAR_PRESETS } from '../types/nenData';
import { Shield, Sparkles, Award, RotateCw, Eye } from 'lucide-react';

interface HunterLicenseCardProps {
  player: PlayerProfile;
  onEditProfile?: () => void;
  interactive?: boolean;
}

export const HunterLicenseCard: React.FC<HunterLicenseCardProps> = ({
  player,
  onEditProfile,
  interactive = true,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const nenInfo = NEN_TYPES_INFO[player.nenType];
  const rankInfo = getRankFromScore(player.score);
  const avatar = AVATAR_PRESETS.find((a) => a.id === player.avatarId) || AVATAR_PRESETS[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: -(y / (rect.height / 2)) * 10,
      y: (x / (rect.width / 2)) * 10,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div className="w-full max-w-md mx-auto perspective-1000 select-none">
      <div
        className="relative transition-all duration-300 ease-out cursor-pointer group"
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Dynamic Nen Aura behind the card */}
        <div
          className="absolute -inset-2 rounded-2xl opacity-60 blur-xl transition-all duration-700 pointer-events-none group-hover:opacity-90 group-hover:blur-2xl"
          style={{
            background: `radial-gradient(circle, ${nenInfo.color} 0%, transparent 70%)`,
          }}
        />

        {/* Card Body */}
        <div
          className="relative w-full rounded-2xl overflow-hidden shadow-2xl border transition-all duration-300"
          style={{
            borderColor: nenInfo.color,
            background: 'linear-gradient(145deg, #121422 0%, #090a10 100%)',
          }}
        >
          {/* Holographic animated sweep */}
          <div className="absolute inset-0 holo-shine pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity" />

          {/* FRONT OF THE CARD */}
          {!isFlipped ? (
            <div className="relative p-5 sm:p-6 text-white min-h-[240px] flex flex-col justify-between">
              {/* Hunter Iconic Dual Blue Stripe on top */}
              <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-600 shadow-sm" />
              <div className="absolute top-3 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-300 opacity-60" />

              {/* Header: Logo, Association, Chip */}
              <div className="flex items-start justify-between mt-2">
                <div className="flex items-center gap-2.5">
                  {/* Hunter Association Double X Badge */}
                  <div className="w-10 h-10 rounded-lg bg-black/60 border border-white/20 flex items-center justify-center shadow-inner">
                    <span className="font-display font-black text-xl tracking-tighter text-hunter-neon">
                      H<span className="text-hunter-gold">✕</span>H
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xs uppercase tracking-widest text-slate-400 font-semibold font-display">
                      HUNTER ASSOCIATION
                    </h2>
                    <p className="text-[10px] text-emerald-400/90 font-mono tracking-wider">
                      LICENCE OFFICIELLE DE HUNTER
                    </p>
                  </div>
                </div>

                {/* Golden Electronic Chip & Flip indicator */}
                <div className="flex items-center gap-2">
                  <div className="w-9 h-7 rounded bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border border-yellow-200 shadow-md relative overflow-hidden flex flex-col justify-around py-0.5 px-1 opacity-90">
                    <div className="h-[1px] bg-amber-800/60 w-full" />
                    <div className="h-[1px] bg-amber-800/60 w-full" />
                    <div className="h-[1px] bg-amber-800/60 w-full" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 animate-shimmer" />
                  </div>
                  <button
                    type="button"
                    title="Retourner la licence"
                    className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 transition"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Middle: Candidate Photo, Nickname, Nen Type */}
              <div className="flex items-center gap-4 my-4">
                {/* Candidate Portrait */}
                <div className="relative group/avatar">
                  <div
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 shadow-lg flex items-center justify-center text-3xl sm:text-4xl bg-gradient-to-br transition-transform group-hover/avatar:scale-105"
                    style={{
                      borderColor: nenInfo.color,
                      boxShadow: `0 0 15px ${nenInfo.color}40`,
                    }}
                  >
                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${avatar.color}`}>
                      {avatar.emoji}
                    </div>
                  </div>
                  {/* Nen Aura Water Divination marker */}
                  <div
                    className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-black shadow"
                    style={{ backgroundColor: nenInfo.color }}
                  >
                    {player.nenType.substring(0, 3).toUpperCase()}
                  </div>
                </div>

                {/* Candidate Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white truncate">
                      {player.nickname}
                    </h3>
                  </div>

                  {/* Candidate Serial & Nen Type */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-300 border border-white/5">
                      N° {player.hunterNumber}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1"
                      style={{
                        backgroundColor: `${nenInfo.color}15`,
                        borderColor: `${nenInfo.color}60`,
                        color: nenInfo.color,
                      }}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      {player.nenType}
                    </span>
                  </div>

                  {/* Rank title & Stars */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="flex items-center text-hunter-gold text-xs font-black">
                      {rankInfo.stars > 0 ? (
                        Array.from({ length: rankInfo.stars }).map((_, i) => (
                          <span key={i} className="text-sm">★</span>
                        ))
                      ) : (
                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      {rankInfo.rank}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer: Score Counter & Hunter Exam Footer Stripe */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400">Score Nen</div>
                    <div className="text-lg sm:text-xl font-black font-display text-hunter-neon flex items-center gap-1">
                      {player.score} <span className="text-xs font-semibold text-slate-400">PTS</span>
                    </div>
                  </div>
                  <div className="h-6 w-[1px] bg-white/10" />
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400">Indices Trouvés</div>
                    <div className="text-sm sm:text-base font-bold font-display text-hunter-gold">
                      {player.scannedCodeIds.length} <span className="text-xs font-normal text-slate-400">scans</span>
                    </div>
                  </div>
                </div>

                {onEditProfile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditProfile();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-medium text-slate-200 transition border border-white/10 flex items-center gap-1"
                  >
                    Modifier
                  </button>
                )}
              </div>

              {/* Bottom decorative stripe */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500" />
            </div>
          ) : (
            /* BACK OF THE CARD (Greed Island / Hunter rules & Security chip) */
            <div className="relative p-5 sm:p-6 text-white min-h-[240px] flex flex-col justify-between">
              {/* Magnetic black stripe */}
              <div className="absolute top-6 left-0 right-0 h-9 bg-black/90 border-y border-white/10 flex items-center justify-end pr-4">
                <span className="text-[9px] font-mono tracking-widest text-emerald-400/70">
                  {player.hunterNumber}-GREED-ISLAND-VERIFIED
                </span>
              </div>

              <div className="pt-14 space-y-2 text-[10px] text-slate-400 leading-relaxed">
                <div className="flex items-center gap-2 text-hunter-gold font-bold uppercase text-[11px]">
                  <Award className="w-3.5 h-3.5" />
                  Privilèges de la Licence de Hunter
                </div>
                <p>
                  1. Libre accès à 95% des pays restreints et zones interdites du globe.
                </p>
                <p>
                  2. Gratuité de la quasi-totalité des services publics et bibliothèques confidentielles.
                </p>
                <p>
                  3. Accès exclusif au serveur Greed Island et aux enchères de York Shin City.
                </p>
              </div>

              {/* Barcode & Signature */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-mono text-[9px] text-slate-400">SIGNATURE DU TITULAIRE</div>
                  <div className="font-display italic text-sm text-slate-200 font-bold tracking-wider">
                    {player.nickname}
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-6 w-24 bg-white/20 rounded flex items-center justify-center p-1">
                    {/* Simulated barcode */}
                    <div className="flex gap-[2px] h-full w-full items-center">
                      {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2].map((w, idx) => (
                        <div key={idx} className="bg-white h-full" style={{ width: `${w * 2}px` }} />
                      ))}
                    </div>
                  </div>
                  <div className="text-[8px] font-mono text-slate-500 mt-0.5">EXAMEN OFFICIEL #287</div>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-500 flex items-center justify-center gap-1 mt-1">
                <Eye className="w-3 h-3 text-slate-400" />
                Clique pour retourner vers le recto
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
