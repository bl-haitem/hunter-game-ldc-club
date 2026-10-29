import { Card, Player } from '../types/hxh';

export const INITIAL_CARDS: Card[] = [
  {
    id: 'card-1',
    code: '🔒-NEN-CIPHER-PROTECTED',
    title: 'Marais de Numere — Papillons de Brume',
    cardRank: 'N',
    points: 50,
    maxScans: 5,
    scannedBy: ['rival-1', 'rival-2'],
    hint: 'Méfiez-vous du brouillard épais. Satotz court d\'un pas régulier. Cherchez près du grand arbre de l\'entrée principale.',
    locationDesc: 'Hall d\'entrée ou arche principale.'
  },
  {
    id: 'card-2',
    code: '🔒-NEN-CIPHER-PROTECTED',
    title: 'Festin des Gourmets — Menchi & Buhara',
    cardRank: 'R',
    points: 80,
    maxScans: 4,
    scannedBy: ['rival-1', 'rival-2', 'rival-3'],
    hint: 'Le Gourmet Hunter recherche la saveur pure. La carte se cache là où le feu et l\'eau se rencontrent.',
    locationDesc: 'Espace restauration, cafétéria ou fontaine.'
  },
  {
    id: 'card-3',
    code: '🔒-NEN-CIPHER-PROTECTED',
    title: 'Tour aux Astuces — Dalle Secrète 72h',
    cardRank: 'SR',
    points: 120,
    maxScans: 3,
    scannedBy: ['rival-1'],
    hint: 'Une dalle secrète ne s\'ouvre qu\'à la majorité des voix. Observez sous les marches d\'un escalier ou derrière un pilier massif.',
    locationDesc: 'Sous un escalier ou derrière un pilier.'
  },
  {
    id: 'card-4',
    code: '🔒-NEN-CIPHER-PROTECTED',
    title: 'Île de Zevil — Plaque Cible #44',
    cardRank: 'SR',
    points: 150,
    maxScans: 2,
    scannedBy: ['rival-1'],
    hint: 'L\'aura menaçante d\'Hisoka rôde dans l\'ombre. Suivez la discrétion du Zetsu vers un bosquet de verdure ou un recoin isolé.',
    locationDesc: 'Dans une plante verte ou salon de repos.'
  },
  {
    id: 'card-5',
    code: '🔒-NEN-CIPHER-PROTECTED',
    title: 'Défi Suprême — Sceau du Président Netero',
    cardRank: 'SSR',
    points: 250,
    maxScans: 1, // Single claim bounty!
    scannedBy: [],
    hint: 'Pour décrocher le titre de Triple Star Hunter, approchez-vous du trône du Président. Le QR code suprême n\'attend qu\'un seul élu !',
    locationDesc: 'Table d\'honneur des examinateurs.'
  }
];

export const INITIAL_RIVALS: Player[] = [
  {
    id: 'rival-1',
    email: 'killua.zoldyck@hunter.exam',
    nickname: 'killua.zoldyck',
    hunterNumber: 'HXH-099',
    score: 350,
    scannedCodeIds: ['HXH-NUMERE-01', 'HXH-GOURMET-02', 'HXH-TRICKTOWER-03', 'HXH-ZEVIL-04'],
    solvedClueIds: [],
    nenType: 'Transmutation'
  },
  {
    id: 'rival-2',
    email: 'kurapika.kurta@hunter.exam',
    nickname: 'kurapika.kurta',
    hunterNumber: 'HXH-404',
    score: 230,
    scannedCodeIds: ['HXH-NUMERE-01', 'HXH-GOURMET-02'],
    solvedClueIds: [],
    nenType: 'Matérialisation'
  },
  {
    id: 'rival-3',
    email: 'hisoka.morow@hunter.exam',
    nickname: 'hisoka.morow',
    hunterNumber: 'HXH-044',
    score: 80,
    scannedCodeIds: ['HXH-GOURMET-02'],
    solvedClueIds: [],
    nenType: 'Transmutation'
  }
];

export function getRankTier(score: number): { title: string; stars: string; color: string } {
  if (score >= 400) return { title: 'Triple Star Hunter', stars: '★★★', color: '#fbbf24' };
  if (score >= 250) return { title: 'Double Star Hunter', stars: '★★',  color: '#00f2fe' };
  if (score >= 120) return { title: 'Single Star Hunter', stars: '★',   color: '#00f076' };
  if (score >= 50)  return { title: 'Pro Hunter',         stars: '★',   color: '#a855f7' };
  return { title: 'Aspirant Hunter', stars: '', color: '#94a3b8' };
}
