import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { validateAdminToken, assertAdminToken } from "./adminAuth";

const NEN_TYPES = [
  "Renforcement",
  "Transmutation",
  "Matérialisation",
  "Émission",
  "Manipulation",
  "Spécialisation"
];

function calculateRank(score: number): string {
  if (score >= 400) return "Triple Star Hunter";
  if (score >= 250) return "Double Star Hunter";
  if (score >= 120) return "Single Star Hunter";
  if (score >= 50) return "Pro Hunter";
  return "Aspirant Hunter";
}

// 1. Obtenir le classement en temps réel (Top 50 par score décroissant)
// PROTECTION VIE PRIVÉE : Les emails ne sont JAMAIS envoyés aux clients publics
export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_score")
      .order("desc")
      .take(50);

    return players.map((p) => ({
      _id: p._id,
      nickname: p.nickname,
      hunterNumber: p.hunterNumber,
      score: p.score,
      rank: p.rank,
      nenType: p.nenType,
      scannedCodesCount: (p.scannedCodeIds || []).length,
      lastActiveAt: p.lastActiveAt,
    }));
  },
});

// 2. Obtenir tous les candidats (Seul l'administrateur a accès aux emails)
export const getAllPlayers = query({
  args: {
    adminToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const players = await ctx.db.query("players").collect();
    let isAdmin = false;
    if (args.adminToken) {
      isAdmin = await validateAdminToken(ctx, args.adminToken);
    }

    if (isAdmin) {
      return players;
    }

    // Vue publique : anonymisation des emails pour empêcher l'usurpation d'identité
    return players.map((p) => ({
      _id: p._id,
      nickname: p.nickname,
      hunterNumber: p.hunterNumber,
      score: p.score,
      rank: p.rank,
      nenType: p.nenType,
      scannedCodeIds: p.scannedCodeIds || [],
      registeredAt: p.registeredAt,
      lastActiveAt: p.lastActiveAt,
      email: "",
    }));
  },
});

// 3. Obtenir un joueur par son email (Pour vérification du propriétaire)
export const getPlayerByEmail = query({
  args: {
    email: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cleanEmail = args.email.trim().toLowerCase();
    const player = await ctx.db
      .query("players")
      .withIndex("by_email", (q) => q.eq("email", cleanEmail))
      .first();

    if (!player) return null;

    // Si le token de session concorde, retourner le profil complet
    if (args.sessionToken && player.sessionToken === args.sessionToken) {
      return player;
    }

    // Sinon, masquer les données sensibles
    return {
      _id: player._id,
      nickname: player.nickname,
      hunterNumber: player.hunterNumber,
      score: player.score,
      rank: player.rank,
      nenType: player.nenType,
    };
  },
});

// 4. Enregistrement ou Connexion officiel par Email
// Le nom du candidat est extrait du profil réel du compte (ex: Google Profile Name) au lieu de l'email
export const registerOrLoginWithEmail = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cleanEmail = args.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("Adresse email invalide pour l'examen Hunter !");
    }

    const cleanName = (args.name || "").trim();
    const fallbackNickname = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "");
    // Utiliser en priorité absolue le vrai nom du propriétaire du compte
    const officialNickname = cleanName || fallbackNickname || "Hunter_Candidat";

    // Génération d'un sessionToken cryptographique fort (CSPRNG 192-bit)
    const randomBytes = new Uint8Array(24);
    crypto.getRandomValues(randomBytes);
    const sessionToken = "hxh_ply_" + Array.from(randomBytes, (b) => b.toString(16).padStart(2, "0")).join("");

    // Vérifier si le candidat existe déjà
    const existing = await ctx.db
      .query("players")
      .withIndex("by_email", (q) => q.eq("email", cleanEmail))
      .first();

    if (existing) {
      const updates: any = {
        lastActiveAt: Date.now(),
        sessionToken,
      };
      // Mettre à jour avec le vrai nom s'il est fourni
      if (cleanName && (!existing.nickname || existing.nickname === fallbackNickname)) {
        updates.nickname = cleanName;
      }
      await ctx.db.patch(existing._id, updates);
      return {
        ...existing,
        ...updates,
      };
    }

    // Nouveau candidat : Génération de la Licence Hunter officielle
    const randomNen = NEN_TYPES[Math.floor(Math.random() * NEN_TYPES.length)];
    const hunterNumber = "HXH-" + Math.floor(Math.random() * 900 + 100);

    const newPlayerId = await ctx.db.insert("players", {
      email: cleanEmail,
      nickname: officialNickname,
      hunterNumber,
      nenType: randomNen,
      score: 0,
      rank: "Aspirant Hunter",
      scannedCodeIds: [],
      registeredAt: Date.now(),
      lastActiveAt: Date.now(),
      sessionToken,
    });

    return await ctx.db.get(newPlayerId);
  },
});

// 5. Modification sécurisée des points d'un joueur par l'Administrateur
// STRICTE : Session valide obligatoire sur la base de données (Aucun secret codé en dur !)
export const adminUpdatePlayerPoints = mutation({
  args: {
    adminToken: v.string(),
    playerId: v.id("players"),
    newScore: v.number(),
  },
  handler: async (ctx, args) => {
    // Vérification stricte sans aucun bypass
    await assertAdminToken(ctx, args.adminToken);

    if (args.newScore < 0) {
      throw new Error("Le score ne peut pas être négatif !");
    }

    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Candidat introuvable dans la base de données !");
    }

    const updatedRank = calculateRank(args.newScore);

    await ctx.db.patch(args.playerId, {
      score: args.newScore,
      rank: updatedRank,
      lastActiveAt: Date.now(),
    });

    return {
      success: true,
      playerId: args.playerId,
      score: args.newScore,
      rank: updatedRank,
    };
  },
});

// 6. Suppression sécurisée d'un candidat spécifique par l'Administrateur
export const adminDeletePlayer = mutation({
  args: {
    adminToken: v.string(),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    await assertAdminToken(ctx, args.adminToken);

    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Candidat introuvable dans la base de données !");
    }

    // Retirer le joueur des cartes qu'il a scannées
    const cards = await ctx.db.query("cards").collect();
    for (const card of cards) {
      if (card.scannedBy.includes(player._id)) {
        await ctx.db.patch(card._id, {
          scannedBy: card.scannedBy.filter((id) => id !== player._id),
        });
      }
    }

    // Supprimer ses scans associés
    const scans = await ctx.db
      .query("scans")
      .withIndex("by_player", (q) => q.eq("playerId", player._id))
      .collect();
    for (const scan of scans) {
      await ctx.db.delete(scan._id);
    }

    // Supprimer le joueur
    await ctx.db.delete(args.playerId);

    return {
      success: true,
      message: `Candidat ${player.nickname} supprimé définitivement.`,
    };
  },
});

// 7. Réinitialisation et suppression définitive de TOUS les candidats par l'Administrateur
export const adminResetAllPlayers = mutation({
  args: {
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdminToken(ctx, args.adminToken);

    // 1. Supprimer tous les joueurs
    const players = await ctx.db.query("players").collect();
    for (const player of players) {
      await ctx.db.delete(player._id);
    }

    // 2. Réinitialiser la liste scannedBy sur toutes les cartes
    const cards = await ctx.db.query("cards").collect();
    for (const card of cards) {
      await ctx.db.patch(card._id, {
        scannedBy: [],
      });
    }

    // 3. Purger l'historique des scans
    const scans = await ctx.db.query("scans").collect();
    for (const scan of scans) {
      await ctx.db.delete(scan._id);
    }

    return {
      success: true,
      deletedCount: players.length,
      message: `Base de données réinitialisée : ${players.length} candidat(s) supprimé(s).`,
    };
  },
});

// 8. Purge interne sécurisée (accessible UNIQUEMENT depuis la CLI du serveur, jamais depuis le client web)
export const purgeAllRecordsInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Supprimer tous les joueurs
    const players = await ctx.db.query("players").collect();
    for (const player of players) {
      await ctx.db.delete(player._id);
    }

    // 2. Réinitialiser la liste scannedBy sur toutes les cartes
    const cards = await ctx.db.query("cards").collect();
    for (const card of cards) {
      await ctx.db.patch(card._id, {
        scannedBy: [],
      });
    }

    // 3. Purger l'historique des scans
    const scans = await ctx.db.query("scans").collect();
    for (const scan of scans) {
      await ctx.db.delete(scan._id);
    }

    return {
      success: true,
      deletedPlayers: players.length,
      deletedScans: scans.length,
    };
  },
});

