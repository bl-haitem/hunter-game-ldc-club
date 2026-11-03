import React, { useState, useMemo, useCallback } from 'react';
import { Card, Player, Rarity } from '../types/hxh';
import { sound } from '../services/sound';

interface HintsViewProps {
  player: Player;
  cards: Card[];
  onNavigateToScan: () => void;
}

export const HintsView: React.FC<HintsViewProps> = ({
  player,
  cards,
  onNavigateToScan
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'available' | 'full'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const scannedSet = useMemo(() => new Set(player.scannedCodeIds || []), [player.scannedCodeIds]);

  const isCardClaimedByPlayer = useCallback((card: Card): boolean => {
    if (!card) return false;
    // 1. Vérification par code si décrypté
    if (card.code && card.code !== '🔒-NEN-CIPHER-PROTECTED' && scannedSet.has(card.code)) {
      return true;
    }
    // 2. Vérification par ID candidat dans scannedBy
    const scannedByList = card.scannedBy || [];
    if (player.id && scannedByList.includes(player.id)) {
      return true;
    }
    // 3. Vérification par email si disponible
    if (player.email && scannedByList.includes(player.email)) {
      return true;
    }
    return false;
  }, [player.id, player.email, scannedSet]);

  // Counts
  const counts = useMemo(() => {
    let unlocked = 0;
    let available = 0;
    let full = 0;
    cards.forEach(c => {
      const isClaimed = isCardClaimedByPlayer(c);
      const isFull = (c.scannedBy || []).length >= c.maxScans;
      if (isClaimed) unlocked++;
      else if (isFull) full++;
      else available++;
    });
    return { all: cards.length, unlocked, available, full };
  }, [cards, isCardClaimedByPlayer]);

  // Filtered cards
  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return cards.filter(c => {
      const isClaimed = isCardClaimedByPlayer(c);
      const isFull = (c.scannedBy || []).length >= c.maxScans;

      if (filter === 'unlocked' && !isClaimed) return false;
      if (filter === 'available' && (isClaimed || isFull)) return false;
      if (filter === 'full' && (isClaimed || !isFull)) return false;

      if (q) {
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchHint = (c.hint || '').toLowerCase().includes(q);
        const matchCode = c.code.toLowerCase().includes(q);
        if (!matchTitle && !matchHint && !matchCode) return false;
      }
      return true;
    });
  }, [cards, filter, searchQuery, isCardClaimedByPlayer]);

  const getRankBadgeClass = (rank: Rarity) => {
    switch (rank) {
      case 'SSR': return 'badge-rank badge-ssr';
      case 'SR': return 'badge-rank badge-sr';
      case 'R': return 'badge-rank badge-r';
      default: return 'badge-rank badge-n';
    }
  };

  const handleCardClick = (card: Card) => {
    sound.playClick();
    setSelectedCard(card);
  };

  const closeCardModal = () => {
    sound.playClick();
    setSelectedCard(null);
  };

  const progressPercent = cards.length > 0 ? (counts.unlocked / cards.length) * 100 : 0;

  return (
    <div className="hints-page-layout">
      {/* Header & Progress bar */}
      <div style={{ flexShrink: 0 }}>
        <div className="page-header" style={{ marginBottom: 6 }}>
          <h1>秘密の書 <em>GREED ISLAND</em></h1>
          <p>CLASSEUR OFFICIEL DE CARTES NEN — BY LDC CLUB</p>
        </div>

        {/* Progress Track */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontFamily: 'var(--font-code)', fontSize: 8, letterSpacing: 1, color: 'var(--ash)', textTransform: 'uppercase' }}>
            CARTES ACQUISES
          </div>
          <div style={{ fontFamily: 'var(--font-hxh)', fontSize: 14, letterSpacing: 1 }}>
            <span style={{ color: 'var(--hunter-green)' }}>{counts.unlocked}</span>
            <span style={{ color: 'var(--ash-dark)', margin: '0 2px' }}>/</span>
            <span style={{ color: 'var(--ash)' }}>{cards.length}</span>
          </div>
        </div>

        <div className="progress-track" style={{ height: 3, marginBottom: 8 }}>
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: 6 }}>
          <input
            type="text"
            className="search-box"
            placeholder="Rechercher une carte ou un indice..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Chips */}
        <div className="filter-bar">
          <button
            className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => { sound.playClick(); setFilter('all'); }}
          >
            TOUTES ({counts.all})
          </button>
          <button
            className={`filter-chip ${filter === 'unlocked' ? 'active' : ''}`}
            onClick={() => { sound.playClick(); setFilter('unlocked'); }}
          >
            ✓ ACQUISES ({counts.unlocked})
          </button>
          <button
            className={`filter-chip ${filter === 'available' ? 'active' : ''}`}
            onClick={() => { sound.playClick(); setFilter('available'); }}
          >
            ⚡ DISPONIBLES ({counts.available})
          </button>
          <button
            className={`filter-chip ${filter === 'full' ? 'active' : ''}`}
            onClick={() => { sound.playClick(); setFilter('full'); }}
          >
            ⛔ ÉPUISÉES ({counts.full})
          </button>
        </div>
      </div>

      {/* The Scalable Cards List */}
      <div className="cards-list-container" id="cards-list-container">
        {filteredCards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px' }}>
            <div style={{ fontFamily: 'var(--font-hxh)', fontSize: 24, color: 'var(--ash-dark)', letterSpacing: 2, marginBottom: 6 }}>
              AUCUNE CARTE TROUVÉE
            </div>
            <div style={{ fontFamily: 'var(--font-code)', fontSize: 10, color: 'var(--ash)' }}>
              Modifiez vos filtres ou effectuez une autre recherche.
            </div>
          </div>
        ) : (
          filteredCards.map(c => {
            const isClaimed = isCardClaimedByPlayer(c);
            const currentScans = (c.scannedBy || []).length;
            const isFull = currentScans >= c.maxScans;
            const slotsLeft = Math.max(0, c.maxScans - currentScans);
            const globalIdx = cards.findIndex(x => x.id === c.id) + 1;

            let rowClass = 'hunter-card-row';
            let statusPill = null;

            if (isClaimed) {
              rowClass += ' unlocked';
              statusPill = <span className="status-pill status-claimed">✓ ACQUISE</span>;
            } else if (isFull) {
              rowClass += ' quota-full';
              statusPill = <span className="status-pill status-full">⛔ QUOTA ATTEINT ({currentScans}/{c.maxScans})</span>;
            } else {
              rowClass += ' available';
              statusPill = <span className="status-pill status-open">⚡ {slotsLeft}/{c.maxScans} PLACES</span>;
            }

            return (
              <div key={c.id} className={rowClass} onClick={() => handleCardClick(c)}>
                {/* Rarity Badge */}
                <div className="card-badge-col">
                  <span className={getRankBadgeClass(c.cardRank)}>{c.cardRank}</span>
                  <span className="card-idx-num">#{globalIdx.toString().padStart(3, '0')}</span>
                </div>

                {/* Card Info */}
                <div className="card-info-col">
                  <div className="card-title-text">{c.title}</div>
                  <div className="card-meta-row">
                    <span style={{ color: 'var(--hunter-gold)', fontWeight: 700 }}>+{c.points} PTS</span>
                    <span>•</span>
                    {statusPill}
                  </div>
                </div>

                {/* Chevron */}
                <div className="card-action-col">
                  <span style={{ fontSize: 12, color: 'var(--ash)' }}>▸</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CARD DETAIL MODAL */}
      {selectedCard && (() => {
        const isClaimed = isCardClaimedByPlayer(selectedCard);
        const currentScans = (selectedCard.scannedBy || []).length;
        const isFull = currentScans >= selectedCard.maxScans;
        const slotsLeft = Math.max(0, selectedCard.maxScans - currentScans);
        const globalIdx = cards.findIndex(x => x.id === selectedCard.id) + 1;

        return (
          <div className="modal-overlay open">
            <div className="modal-box" style={{ maxHeight: '85vh', overflowY: 'auto', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span className={getRankBadgeClass(selectedCard.cardRank)}>{selectedCard.cardRank}</span>
                    <span style={{ fontFamily: 'var(--font-code)', fontSize: 9, color: 'var(--ash)' }}>
                      CARTE N°{globalIdx.toString().padStart(3, '0')}
                    </span>
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-hxh)', fontSize: 20, letterSpacing: 1, color: '#fff', textTransform: 'uppercase' }}>
                    {selectedCard.title}
                  </h2>
                </div>
                <button
                  onClick={closeCardModal}
                  style={{ background: 'none', border: 'none', color: 'var(--ash)', fontSize: 20, cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* Quota and Points Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: 6, padding: '8px 12px', marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-code)', fontSize: 8, color: 'var(--ash)', textTransform: 'uppercase' }}>
                    VALEUR EN POINTS
                  </div>
                  <div style={{ fontFamily: 'var(--font-code)', fontSize: 16, fontWeight: 700, color: 'var(--hunter-gold)' }}>
                    +{selectedCard.points} PTS NEN
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-code)', fontSize: 8, color: 'var(--ash)', textTransform: 'uppercase' }}>
                    QUOTA CANDIDATS
                  </div>
                  <div style={{ fontFamily: 'var(--font-code)', fontSize: 12, fontWeight: 700, color: isFull ? 'var(--hunter-danger)' : 'var(--hunter-cyan)' }}>
                    {currentScans} / {selectedCard.maxScans} {isFull ? '(ÉPUISÉ)' : `(${slotsLeft} rest.)`}
                  </div>
                </div>
              </div>

              {/* Hint Text Box (Always Visible Clue as Requested) */}
              <div style={{
                background: 'rgba(2,4,10,0.75)',
                border: `1px solid ${isClaimed ? 'rgba(0,240,118,0.45)' : 'rgba(0,242,254,0.35)'}`,
                borderRadius: 6,
                padding: 14,
                marginBottom: 14,
                boxShadow: '0 4px 20px rgba(0,0,0,0.6)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-code)', fontSize: 9, color: isClaimed ? 'var(--hunter-green)' : 'var(--hunter-cyan)', letterSpacing: 1, textTransform: 'uppercase' }}>
                    <span>{isClaimed ? '✓ CARTE ACQUISE DANS VOS ARCHIVES' : '✦ INDICE / ÉNIGME NEN'}</span>
                  </div>
                  {isClaimed ? (
                    <span style={{ fontFamily: 'var(--font-code)', fontSize: 8, color: 'var(--hunter-green)', background: 'rgba(0,240,118,0.12)', border: '1px solid rgba(0,240,118,0.4)', padding: '2px 7px', borderRadius: 3 }}>
                      VALIDÉ
                    </span>
                  ) : isFull ? (
                    <span style={{ fontFamily: 'var(--font-code)', fontSize: 8, color: 'var(--hunter-danger)', background: 'rgba(244,63,94,0.12)', border: '1px solid var(--hunter-danger)', padding: '2px 7px', borderRadius: 3 }}>
                      QUOTA ATTEINT
                    </span>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-code)', fontSize: 8, color: 'var(--hunter-cyan)', background: 'rgba(0,242,254,0.12)', border: '1px solid rgba(0,242,254,0.4)', padding: '2px 7px', borderRadius: 3 }}>
                      DISPONIBLE
                    </span>
                  )}
                </div>

                <p style={{ fontFamily: 'var(--font-jp)', fontSize: 13, color: '#f1f5f9', lineHeight: 1.7, marginBottom: 10 }}>
                  {selectedCard.hint}
                </p>

                {selectedCard.locationDesc && (
                  <div style={{ fontFamily: 'var(--font-code)', fontSize: 9, color: 'var(--ash)', borderTop: '1px dashed var(--border-glass)', paddingTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--hunter-gold)' }}>📍 INDICATION :</span> {selectedCard.locationDesc}
                  </div>
                )}

                {isClaimed && (
                  <div style={{ fontFamily: 'var(--font-code)', fontSize: 9, color: 'var(--ash)', marginTop: 6 }}>
                    CODE NEN : <span style={{ color: 'var(--hunter-green)' }}>{selectedCard.code}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button className="btn btn-outline btn-full btn-sm" onClick={closeCardModal}>
                  FERMER
                </button>
                {!isClaimed && !isFull && (
                  <button
                    className="btn btn-green btn-full btn-sm"
                    onClick={() => {
                      closeCardModal();
                      onNavigateToScan();
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <span>SCANNER CE CODE</span> →
                  </button>
                )}
              </div>

              {/* LDC Club Creator Signature */}
              <div className="ldc-footer-credit">
                <span className="dot">✦</span> JEU CRÉÉ PAR LE CLUB LDC <span className="dot">✦</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
