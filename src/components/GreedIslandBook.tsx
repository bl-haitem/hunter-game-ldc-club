import React, { useState } from 'react';
import { PlayerProfile, QRCodeCard } from '../types';
import { soundManager } from '../services/soundManager';
import { 
  BookOpen, 
  Lock, 
  Unlock, 
  Sparkles, 
  Compass, 
  MapPin, 
  CheckCircle2, 
  X,
  Search,
  Filter
} from 'lucide-react';

interface GreedIslandBookProps {
  player: PlayerProfile;
  cards: QRCodeCard[];
  onNavigateToScanner: () => void;
}

export const GreedIslandBook: React.FC<GreedIslandBookProps> = ({
  player,
  cards,
  onNavigateToScanner,
}) => {
  const [selectedCard, setSelectedCard] = useState<QRCodeCard | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const scannedCount = player.scannedCodeIds.length;
  const totalCards = cards.length;
  const progressPercent = totalCards > 0 ? Math.round((scannedCount / totalCards) * 100) : 0;

  const filteredCards = cards.filter((card) => {
    const isScanned = player.scannedCodeIds.includes(card.code);
    if (filterMode === 'unlocked' && !isScanned) return false;
    if (filterMode === 'locked' && isScanned) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        card.title.toLowerCase().includes(q) ||
        card.hint.toLowerCase().includes(q) ||
        card.code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenCard = (card: QRCodeCard) => {
    soundManager.playBookOpen();
    setSelectedCard(card);
  };

  const getRarityBadgeStyle = (rank?: string) => {
    switch (rank) {
      case 'SSR':
        return 'bg-gradient-to-r from-amber-400 to-yellow-600 text-black border-yellow-200';
      case 'SR':
        return 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-purple-300';
      case 'R':
        return 'bg-gradient-to-r from-cyan-400 to-blue-600 text-black border-cyan-200';
      default:
        return 'bg-gradient-to-r from-emerald-400 to-teal-600 text-black border-emerald-200';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Greed Island Binder Header */}
      <div className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#171b2e] to-[#0c0e17] border border-hunter-gold/30 shadow-xl overflow-hidden">
        {/* Holographic animated sheen */}
        <div className="absolute inset-0 holo-shine opacity-25 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-hunter-gold to-amber-700 flex items-center justify-center text-black shadow-lg">
              <BookOpen className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black font-display tracking-tight text-white">
                  GREED ISLAND BOOK
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-hunter-gold/20 text-hunter-gold border border-hunter-gold/40">
                  CARNET D'INDICES
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Consulte les énigmes pour débusquer les QR Codes cachés dans la zone !
              </p>
            </div>
          </div>

          {/* Collection Progress */}
          <div className="bg-black/50 border border-white/10 rounded-2xl p-3 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
              Slots Spécifiés
            </div>
            <div className="text-lg font-black font-display text-hunter-neon">
              {scannedCount} <span className="text-xs text-slate-400 font-normal">/ {totalCards} Cartes</span>
            </div>
            <div className="w-24 sm:w-28 bg-white/10 h-1.5 rounded-full overflow-hidden mt-1 hidden sm:block">
              <div
                className="bg-hunter-neon h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-2">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une énigme, étape..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-hunter-neon"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={() => {
                soundManager.playUiClick();
                setFilterMode('all');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterMode === 'all'
                  ? 'bg-white/20 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tous ({cards.length})
            </button>
            <button
              onClick={() => {
                soundManager.playUiClick();
                setFilterMode('locked');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                filterMode === 'locked'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3 h-3" />
              À Trouver
            </button>
            <button
              onClick={() => {
                soundManager.playUiClick();
                setFilterMode('unlocked');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                filterMode === 'unlocked'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Trouvées
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Greed Island Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredCards.map((card, idx) => {
          const isScanned = player.scannedCodeIds.includes(card.code);

          return (
            <div
              key={card.id}
              onClick={() => handleOpenCard(card)}
              className={`group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer border overflow-hidden ${
                isScanned
                  ? 'bg-gradient-to-br from-[#12221b] to-[#0c1410] border-emerald-500/40 hover:border-hunter-neon shadow-lg hover:scale-[1.01]'
                  : 'bg-gradient-to-br from-[#171a29] to-[#0c0e17] border-white/10 hover:border-amber-400/50 hover:scale-[1.01]'
              }`}
            >
              {/* Greed Island Card Slot Top Bar */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-slate-400">
                    No. {String(card.stageNumber || idx + 1).padStart(3, '0')}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase shadow-sm ${getRarityBadgeStyle(
                      card.cardRank
                    )}`}
                  >
                    {card.cardRank || 'SR'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-hunter-gold">
                    +{card.points} PTS
                  </span>
                  {isScanned ? (
                    <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="p-1 rounded-full bg-amber-500/20 text-amber-400">
                      <Compass className="w-4 h-4 animate-spin-slow" />
                    </span>
                  )}
                </div>
              </div>

              {/* Card Title */}
              <h3 className="font-display font-bold text-sm text-white group-hover:text-hunter-neon transition line-clamp-1 mb-1">
                {card.title}
              </h3>

              {/* Hint Preview snippet */}
              <p className="text-xs text-slate-300/90 line-clamp-2 italic leading-relaxed">
                "{card.hint}"
              </p>

              {/* Status Badge */}
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
                {isScanned ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Carte acquise dans ton classeur
                  </span>
                ) : (
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Indice actif • Scanner disponible
                  </span>
                )}
                <span className="text-slate-400 font-mono text-[10px] group-hover:translate-x-0.5 transition">
                  Ouvrir →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCards.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-hunter-card border border-white/10">
          <Filter className="w-10 h-10 text-slate-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-white mb-1">Aucune carte trouvée</h4>
          <p className="text-xs text-slate-400">
            Ajuste ton filtre ou ta recherche pour afficher les indices disponibles.
          </p>
        </div>
      )}

      {/* DETAILED CARD MODAL (GREED ISLAND INSPECT VIEW) */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl p-6 bg-gradient-to-b from-[#181d33] to-[#0c0e17] border-2 border-hunter-gold/60 shadow-2xl shadow-yellow-500/10 overflow-hidden">
            {/* Holographic card sheen */}
            <div className="absolute inset-0 holo-shine opacity-30 pointer-events-none" />

            {/* Close button */}
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header info */}
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs font-bold text-slate-400">
                CARTE No. {String(selectedCard.stageNumber || 1).padStart(3, '0')}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase shadow-sm ${getRarityBadgeStyle(
                  selectedCard.cardRank
                )}`}
              >
                {selectedCard.cardRank || 'SR'}
              </span>
              <span className="ml-auto text-sm font-black text-hunter-gold">
                +{selectedCard.points} PTS
              </span>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold font-display text-white mb-2">
              {selectedCard.title}
            </h3>

            {/* Scanned status indicator */}
            {player.scannedCodeIds.includes(selectedCard.code) ? (
              <div className="mb-4 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Tu as déjà validé cette étape et collecté les points !
              </div>
            ) : (
              <div className="mb-4 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                <Compass className="w-4 h-4 animate-spin-slow" />
                Étape en cours : utilise l'énigme ci-dessous pour trouver le QR Code !
              </div>
            )}

            {/* The Hunter Clue / Riddle */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 mb-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-hunter-neon mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Énigme & Indice Hunter :
              </div>
              <p className="text-sm text-slate-100 italic leading-relaxed">
                "{selectedCard.hint}"
              </p>
            </div>

            {/* Location context */}
            {selectedCard.locationDesc && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 mb-5 text-xs text-slate-300 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Zone de jeu :</span>{' '}
                  {selectedCard.locationDesc}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCard(null)}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
              >
                Fermer
              </button>
              {!player.scannedCodeIds.includes(selectedCard.code) && (
                <button
                  onClick={() => {
                    setSelectedCard(null);
                    onNavigateToScanner();
                  }}
                  className="flex-1 py-3 rounded-xl bg-hunter-neon hover:bg-hunter-neonHover text-black font-bold text-xs transition shadow-lg flex items-center justify-center gap-1.5"
                >
                  <Compass className="w-4 h-4" />
                  Scanner ce lieu
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
