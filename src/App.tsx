import React, { useState, useEffect, useCallback } from 'react';
import { Card, Player, ScanLog, ActiveTab } from './types/hxh';
import { INITIAL_CARDS, INITIAL_RIVALS } from './data/initialData';
import { convexDb, extractCleanCode } from './services/convexService';
import { TopHUD } from './components/TopHUD';
import { BottomNav } from './components/BottomNav';
import { LandingView } from './components/LandingView';
import { ScanView } from './components/ScanView';
import { HintsView } from './components/HintsView';
import { ClassmenView } from './components/ClassmenView';
import { SettingsView } from './components/SettingsView';
import { AdminView } from './components/AdminView';
import { EmailAuthModal } from './components/EmailAuthModal';

export const App: React.FC = () => {
  // 1. Current Player State (with Email & Fixed Nickname)
  const [player, setPlayer] = useState<Player>(() => {
    try {
      const saved = localStorage.getItem('hxh_player');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed;
      }
    } catch {}
    return {
      id: 'hunter_' + Date.now(),
      email: '',
      nickname: '',
      hunterNumber: 'HXH-' + Math.floor(Math.random() * 900 + 100),
      score: 0,
      scannedCodeIds: [],
      solvedClueIds: [],
      nenType: 'Transmutation'
    };
  });

  // 2. Cards with Quotas State
  const [cards, setCards] = useState<Card[]>(() => {
    try {
      const saved = localStorage.getItem('hxh_cards');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CARDS;
  });

  // 3. All Players State (Candidates list & Leaderboard)
  const [allPlayers, setAllPlayers] = useState<Player[]>(() => {
    let list: Player[] = [];
    try {
      const saved = localStorage.getItem('hxh_all_players');
      if (saved) list = JSON.parse(saved);
    } catch {}
    if (!Array.isArray(list) || list.length < 3) {
      list = [...INITIAL_RIVALS];
    }
    return list;
  });

  // 4. Scans Feed State
  const [scans, setScans] = useState<ScanLog[]>(() => {
    try {
      const saved = localStorage.getItem('hxh_scans');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 's1', time: '14:22', hunterName: 'killua.zoldyck', hunterId: 'HXH-099', cardTitle: 'Marais de Numere', points: 50 },
      { id: 's2', time: '14:35', hunterName: 'kurapika.kurta', hunterId: 'HXH-404', cardTitle: 'Festin des Gourmets', points: 80 }
    ];
  });

  // 5. Navigation & Modal States
  const [currentTab, setCurrentTab] = useState<ActiveTab>('landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync with Convex database service on startup
  const syncDatabase = useCallback(async () => {
    const loadedCards = await convexDb.getCards();
    const loadedPlayers = await convexDb.getAllPlayers();
    const loadedScans = await convexDb.getScans();

    setCards(loadedCards);
    setAllPlayers(loadedPlayers);
    setScans(loadedScans);

    // Refresh active player score and scanned codes while preserving personal sessionToken and email
    if (player.id) {
      const freshPlayer = loadedPlayers.find(p => p.id === player.id);
      if (freshPlayer) {
        setPlayer(prev => {
          const updated: Player = {
            ...prev,
            score: freshPlayer.score,
            scannedCodeIds: freshPlayer.scannedCodeIds || prev.scannedCodeIds,
          };
          localStorage.setItem('hxh_player', JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, [player.id, player.email]);

  useEffect(() => {
    syncDatabase();

    const checkHash = () => {
      if (window.location.hash === '#admin') {
        setCurrentTab('admin');
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [syncDatabase]);

  // Handle Official Registration / Login (Uses real owner name from Google or input)
  const handleRegisterEmail = async (email: string, name?: string) => {
    const authenticatedPlayer = await convexDb.registerOrLogin(email, name);
    setPlayer(authenticatedPlayer);
    setIsAuthModalOpen(false);
    setCurrentTab('scan');
    await syncDatabase();
  };

  const handleProcessScan = async (rawCode: string) => {
    if (!player.email) {
      setIsAuthModalOpen(true);
      return {
        success: false,
        points: 0,
        title: 'LICENCE REQUISE',
        message: 'Veuillez enregistrer votre adresse email officielle pour obtenir votre Licence Hunter avant de scanner.'
      };
    }

    const clean = extractCleanCode(rawCode);
    const result = await convexDb.claimScan(player.id, clean);

    // Refresh state after claim
    await syncDatabase();

    return result;
  };

  // Admin Mutation: Update Candidate Points (Protected by secure session token)
  const handleAdminUpdatePlayerPoints = async (playerId: string, newPoints: number) => {
    await convexDb.adminUpdatePlayerPoints(playerId, newPoints);
    await syncDatabase();
  };

  // Admin Mutation: Update Card Quota (Protected by secure session token)
  const handleAdminUpdateCardQuota = async (cardId: string, newQuota: number) => {
    await convexDb.adminUpdateCardQuota(cardId, newQuota);
    await syncDatabase();
  };

  // Admin Mutation: Add New Card (Protected by secure session token)
  const handleAdminAddCard = async (newCardData: Omit<Card, 'id' | 'scannedBy'>) => {
    await convexDb.adminCreateCard(newCardData);
    await syncDatabase();
  };

  // Admin Mutation: Delete Card (Protected by secure session token)
  const handleAdminDeleteCard = async (cardId: string) => {
    await convexDb.adminDeleteCard(cardId);
    await syncDatabase();
  };

  const handleStartExam = () => {
    if (!player.email) {
      setIsAuthModalOpen(true);
    } else {
      setCurrentTab('scan');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hxh_player');
    setPlayer({
      id: 'hunter_' + Date.now(),
      email: '',
      nickname: '',
      hunterNumber: 'HXH-' + Math.floor(Math.random() * 900 + 100),
      score: 0,
      scannedCodeIds: [],
      solvedClueIds: [],
      nenType: 'Transmutation'
    });
    setCurrentTab('landing');
  };

  const topRecord = allPlayers.reduce((m, p) => Math.max(m, p.score || 0), 0);

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Texture Backdrop — Hunter Nen Aura Particles */}
      <div className="backdrop" />

      {/* Email Registration Modal (Extracts & Locks Nickname) */}
      <EmailAuthModal
        isOpen={isAuthModalOpen}
        onRegister={handleRegisterEmail}
      />

      {/* TOP HUD (Hidden on Landing) */}
      {currentTab !== 'landing' && (
        <TopHUD
          score={player.score}
          currentTab={currentTab}
          onOpenAdmin={() => setCurrentTab('admin')}
        />
      )}

      {/* MAIN VIEWPORT */}
      {currentTab === 'landing' ? (
        <LandingView
          totalHunters={allPlayers.length}
          totalCodes={cards.length}
          topScore={topRecord}
          onStart={handleStartExam}
          onOpenAdmin={() => { window.location.hash = '#admin'; setCurrentTab('admin'); }}
        />
      ) : (
        <main className="page-viewport">
          <div className="page-content" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '10px 16px' }}>
            {currentTab === 'scan' && (
              <ScanView
                player={player}
                cards={cards}
                onProcessScan={handleProcessScan}
                onNavigateToHints={() => setCurrentTab('hints')}
              />
            )}

            {currentTab === 'hints' && (
              <HintsView
                player={player}
                cards={cards}
                onNavigateToScan={() => setCurrentTab('scan')}
              />
            )}

            {currentTab === 'classmen' && (
              <ClassmenView
                player={player}
                allPlayers={allPlayers}
                scans={scans}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                player={player}
                totalCards={cards.length}
                onLogout={handleLogout}
              />
            )}

            {currentTab === 'admin' && (
              <AdminView
                cards={cards}
                allPlayers={allPlayers}
                scans={scans}
                onUpdatePlayerPoints={handleAdminUpdatePlayerPoints}
                onUpdateCardQuota={handleAdminUpdateCardQuota}
                onAddCard={handleAdminAddCard}
                onDeleteCard={handleAdminDeleteCard}
                onAdminLogin={(pwd) => convexDb.loginAdmin(pwd)}
                onAdminLogout={() => convexDb.logoutAdmin()}
                onChangeAdminPassword={(newPwd) => convexDb.changeAdminPassword(newPwd)}
                onReloadDatabase={syncDatabase}
                onExitAdmin={() => { window.location.hash = ''; setCurrentTab('scan'); }}
              />
            )}
          </div>
        </main>
      )}

      {/* BOTTOM NAV (Hidden on Landing and Admin) */}
      {currentTab !== 'landing' && currentTab !== 'admin' && (
        <BottomNav
          currentTab={currentTab}
          onSelectTab={tab => setCurrentTab(tab)}
        />
      )}
    </div>
  );
};
export default App;
