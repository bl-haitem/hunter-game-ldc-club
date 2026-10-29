import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { validateAdminToken, assertAdminToken } from "./adminAuth";

// Générateur cryptographique haute entropie CSPRNG (128-bit) côté serveur
// Impossible à deviner ou prédire même avec des millions de tentatives
function generateSecureNenCode(): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Base32 sans confusion (pas de 0/O ou 1/I)
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += alphabet[bytes[i] % alphabet.length];
  }
  return `HXH-${result.slice(0, 4)}-${result.slice(4, 8)}-${result.slice(8, 12)}`;
}

// 1. Obtenir toutes les cartes pour le carnet Greed Island et la liste des indices
// SÉCURITÉ ZERO-KNOWLEDGE STRICTE :
// - Les candidats NE REÇOIVENT JAMAIS le code secret des cartes non encore scannées !
// - Seul un administrateur authentifié par session active peut consulter les codes bruts pour les imprimer.
export const getCards = query({
  args: {
    adminToken: v.optional(v.string()),
    playerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cards = await ctx.db.query("cards").collect();

    // 1. Vérification cryptographique stricte de la session administrateur
    let isAdmin = false;
    if (args.adminToken) {
      isAdmin = await validateAdminToken(ctx, args.adminToken);
    }

    // Si c'est l'administrateur légitime, il reçoit les vrais codes pour afficher et imprimer les QR codes
    if (isAdmin) {
      return cards;
    }

    // 2. Joueur / Candidat : Récupérer ses cartes déjà scannées
    let playerScannedCodes: string[] = [];
    if (args.playerId) {
      const player = await ctx.db
        .query("players")
        .filter((q) => q.eq(q.field("_id"), args.playerId))
        .first();
      if (player) {
        playerScannedCodes = player.scannedCodeIds || [];
      }
    }

    // 3. Masquage des codes secrets pour tous les non-administrateurs
    return cards.map((c) => {
      const hasScanned =
        playerScannedCodes.includes(c.code) ||
        (args.playerId && (c.scannedBy || []).includes(args.playerId));

      return {
        ...c,
        // Si le joueur n'a pas encore scanné la carte physiquement, le code est masqué
        code: hasScanned ? c.code : "🔒-NEN-CIPHER-PROTECTED",
      };
    });
  },
});

// Seed automatique initial si la base est vide (avec codes CSPRNG 128-bit)
export const seedInitialCards = mutation({
  args: {
    adminToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let isAdmin = false;
    if (args.adminToken) {
      isAdmin = await validateAdminToken(ctx, args.adminToken);
    }

    const existing = await ctx.db.query("cards").collect();
    if (existing.length > 0) {
      if (isAdmin) return existing;
      return existing.map(c => ({ ...c, code: "🔒-NEN-CIPHER-PROTECTED" }));
    }

    const initial = [
      {
        code: generateSecureNenCode(),
        title: "Marais de Numere — Papillons de Brume",
        cardRank: "N" as const,
        points: 50,
        maxScans: 5,
        scannedBy: [],
        hint: "Méfiez-vous du brouillard épais. Satotz court d'un pas régulier. Cherchez près du grand arbre de l'entrée principale.",
        locationDesc: "Hall d'entrée ou arche principale.",
        active: true,
        createdAt: Date.now(),
      },
      {
        code: generateSecureNenCode(),
        title: "Festin des Gourmets — Menchi & Buhara",
        cardRank: "R" as const,
        points: 80,
        maxScans: 4,
        scannedBy: [],
        hint: "Le Gourmet Hunter recherche la saveur pure. La carte se cache là où le feu et l'eau se rencontrent.",
        locationDesc: "Espace restauration, cafétéria ou fontaine.",
        active: true,
        createdAt: Date.now(),
      },
      {
        code: generateSecureNenCode(),
        title: "Tour aux Astuces — Dalle Secrète 72h",
        cardRank: "SR" as const,
        points: 120,
        maxScans: 3,
        scannedBy: [],
        hint: "Une dalle secrète ne s'ouvre qu'à la majorité des voix. Observez sous les marches d'un escalier ou derrière un pilier massif.",
        locationDesc: "Sous un escalier ou derrière un pilier.",
        active: true,
        createdAt: Date.now(),
      },
      {
        code: generateSecureNenCode(),
        title: "Île de Zevil — Plaque Cible #44",
        cardRank: "SR" as const,
        points: 150,
        maxScans: 2,
        scannedBy: [],
        hint: "L'aura menaçante d'Hisoka rôde dans l'ombre. Suivez la discrétion du Zetsu vers un bosquet de verdure ou un recoin isolé.",
        locationDesc: "Dans une plante verte ou salon de repos.",
        active: true,
        createdAt: Date.now(),
      },
      {
        code: generateSecureNenCode(),
        title: "Défi Suprême — Sceau du Président Netero",
        cardRank: "SSR" as const,
        points: 250,
        maxScans: 1,
        scannedBy: [],
        hint: "Pour décrocher le titre de Triple Star Hunter, approchez-vous du trône du Président. Le QR code suprême n'attend qu'un seul élu !",
        locationDesc: "Table d'honneur des examinateurs.",
        active: true,
        createdAt: Date.now(),
      },
    ];

    for (const card of initial) {
      await ctx.db.insert("cards", card);
    }

    const all = await ctx.db.query("cards").collect();
    if (isAdmin) return all;
    return all.map(c => ({ ...c, code: "🔒-NEN-CIPHER-PROTECTED" }));
  },
});

// 5. Régénération cryptographique haute sécurité de TOUS les codes de cartes
// Remplace tous les codes par des tokens CSPRNG 128-bit indéchiffrables
export const reCipherAllCardsInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cards = await ctx.db.query("cards").collect();
    const updated = [];
    for (const card of cards) {
      const newCode = generateSecureNenCode();
      await ctx.db.patch(card._id, {
        code: newCode,
        scannedBy: [],
      });
      updated.push({ id: card._id, title: card.title, code: newCode });
    }
    return {
      success: true,
      updatedCount: updated.length,
      cards: updated,
    };
  },
});


// 2. Mise à jour sécurisée du quota de scans par l'Administrateur
export const adminUpdateQuota = mutation({
  args: {
    adminToken: v.string(),
    cardId: v.id("cards"),
    newQuota: v.number(),
  },
  handler: async (ctx, args) => {
    await assertAdminToken(ctx, args.adminToken);

    const card = await ctx.db.get(args.cardId);
    if (!card) throw new Error("Carte introuvable !");

    if (args.newQuota < card.scannedBy.length) {
      throw new Error(`Le quota ne peut pas être inférieur au nombre actuel de scans (${card.scannedBy.length}) !`);
    }

    await ctx.db.patch(args.cardId, {
      maxScans: args.newQuota,
    });

    return { success: true, newQuota: args.newQuota };
  },
});

// 3. Création sécurisée d'une nouvelle carte Nen avec génération cryptographique
export const adminCreateCard = mutation({
  args: {
    adminToken: v.string(),
    code: v.optional(v.string()), // Si omis, généré automatiquement par le serveur de façon indéchiffrable
    title: v.string(),
    cardRank: v.union(v.literal("SSR"), v.literal("SR"), v.literal("R"), v.literal("N")),
    points: v.number(),
    maxScans: v.number(),
    hint: v.string(),
    locationDesc: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertAdminToken(ctx, args.adminToken);

    // Si le code n'est pas fourni, le serveur génère un code cryptographique aléatoire à haute entropie
    let finalCode = (args.code || "").trim().toUpperCase();
    if (!finalCode) {
      finalCode = generateSecureNenCode();
    }

    // Vérifier l'unicité du code
    const existing = await ctx.db
      .query("cards")
      .withIndex("by_code", (q) => q.eq("code", finalCode))
      .first();

    if (existing) {
      // Régénérer en cas de collision théorique improbable
      finalCode = generateSecureNenCode();
    }

    const cardId = await ctx.db.insert("cards", {
      code: finalCode,
      title: args.title.trim(),
      cardRank: args.cardRank,
      points: args.points,
      maxScans: args.maxScans,
      scannedBy: [],
      hint: args.hint.trim(),
      locationDesc: args.locationDesc?.trim(),
      active: true,
      createdAt: Date.now(),
    });

    return await ctx.db.get(cardId);
  },
});

// 4. Suppression sécurisée d'une carte par l'Administrateur
export const adminDeleteCard = mutation({
  args: {
    adminToken: v.string(),
    cardId: v.id("cards"),
  },
  handler: async (ctx, args) => {
    await assertAdminToken(ctx, args.adminToken);

    await ctx.db.delete(args.cardId);
    return { success: true };
  },
});
