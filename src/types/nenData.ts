import { NenAffinityInfo, NenType } from './index';

export const NEN_TYPES_INFO: Record<NenType, NenAffinityInfo> = {
  Renforcement: {
    type: 'Renforcement',
    nameFr: 'Renforcement (Kyouka)',
    nameJp: '強化系',
    color: '#00FF88', // Vibrant Nen Green
    bgGlow: 'rgba(0, 255, 136, 0.25)',
    borderGlow: '#00FF88',
    description: 'Augmente la puissance physique naturelle et la résistance. Esprit franc, déterminé et honnête.',
    icon: '👊',
    representative: 'Gon Freecss'
  },
  Transmutation: {
    type: 'Transmutation',
    nameFr: 'Transmutation (Henka)',
    nameJp: '変化系',
    color: '#BD00FF', // Purple / Lightning aura
    bgGlow: 'rgba(189, 0, 255, 0.25)',
    borderGlow: '#BD00FF',
    description: 'Modifie les propriétés de l\'aura (électricité, gomme extensible). Esprit vif, mystérieux et imprévisible.',
    icon: '⚡',
    representative: 'Killua Zoldyck & Hisoka'
  },
  Émission: {
    type: 'Émission',
    nameFr: 'Émission (Houshutsu)',
    nameJp: '放出系',
    color: '#00E5FF', // Bright Cyan aura
    bgGlow: 'rgba(0, 229, 255, 0.25)',
    borderGlow: '#00E5FF',
    description: 'Projette l\'aura à distance sous forme de projectiles ou portails. Tempérament passionné, impulsif et loyal.',
    icon: '💥',
    representative: 'Leorio & Knuckle'
  },
  Matérialisation: {
    type: 'Matérialisation',
    nameFr: 'Matérialisation (Gugenka)',
    nameJp: '具現化系',
    color: '#E2E8F0', // Platinum / Silver aura
    bgGlow: 'rgba(226, 232, 240, 0.25)',
    borderGlow: '#E2E8F0',
    description: 'Crée un objet physique indépendant doté de pouvoirs spéciaux. Esprit analytique, prudent et méticuleux.',
    icon: '⛓️',
    representative: 'Kurapika & Shizuku'
  },
  Manipulation: {
    type: 'Manipulation',
    nameFr: 'Manipulation (Sousa)',
    nameJp: '操作系',
    color: '#FF9900', // Amber / Gold-Orange aura
    bgGlow: 'rgba(255, 153, 0, 0.25)',
    borderGlow: '#FF9900',
    description: 'Contrôle des êtres vivants ou des objets inanimés. Raisonnement logique, calculateur et protecteur.',
    icon: '🎯',
    representative: 'Illumi Zoldyck & Morel'
  },
  Spécialisation: {
    type: 'Spécialisation',
    nameFr: 'Spécialisation (Tokushitsu)',
    nameJp: '特質系',
    color: '#FFD700', // Imperial Gold aura
    bgGlow: 'rgba(255, 215, 0, 0.3)',
    borderGlow: '#FFD700',
    description: 'Aura unique aux facultés rares ne rentrant dans aucune autre catégorie. Charismatique, indépendant et visionnaire.',
    icon: '👑',
    representative: 'Chrollo Lucilfer & Kurapika'
  }
};

export const AVATAR_PRESETS = [
  { id: 'gon', name: 'Gon', emoji: '🎣', color: 'from-green-500 to-emerald-700' },
  { id: 'killua', name: 'Killua', emoji: '⚡', color: 'from-blue-500 to-purple-600' },
  { id: 'kurapika', name: 'Kurapika', emoji: '⛓️', color: 'from-amber-400 to-red-600' },
  { id: 'leorio', name: 'Leorio', emoji: '💼', color: 'from-sky-500 to-indigo-700' },
  { id: 'hisoka', name: 'Hisoka', emoji: '🃏', color: 'from-pink-500 to-purple-800' },
  { id: 'chrollo', name: 'Chrollo', emoji: '📖', color: 'from-violet-600 to-slate-900' },
  { id: 'ging', name: 'Ging', emoji: '🐗', color: 'from-orange-500 to-amber-700' },
  { id: 'netero', name: 'Netero', emoji: '🙏', color: 'from-yellow-400 to-amber-600' },
];

export function getRankFromScore(score: number): {
  rank: string;
  badge: string;
  stars: number;
  color: string;
} {
  if (score >= 500) {
    return { rank: 'Triple Hunter', badge: '★★★', stars: 3, color: '#FFD700' };
  } else if (score >= 300) {
    return { rank: 'Double Hunter', badge: '★★', stars: 2, color: '#00E5FF' };
  } else if (score >= 150) {
    return { rank: 'Single Hunter', badge: '★', stars: 1, color: '#00FF88' };
  } else if (score >= 50) {
    return { rank: 'Pro Hunter', badge: 'LICENCE', stars: 0, color: '#A855F7' };
  } else {
    return { rank: 'Aspirant Hunter', badge: 'ROOKIE', stars: 0, color: '#94A3B8' };
  }
}
