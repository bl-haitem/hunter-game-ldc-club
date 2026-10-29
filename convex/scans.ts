import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function calculateRank(score: number): string {
  if (score >= 400) return "Triple Star Hunter";
  if (score >= 250) return "Double Star Hunter";
  if (score >= 120) return "Single Star Hunter";
  if (score >= 50) return "Pro Hunter";
  return "Aspirant Hunter";
}

// 1. Obtenir le flux des scans en direct (Live Feed temps réel)
export const getLiveScans = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("scans")
      .withIndex("by_timestamp")
      .order("desc")
      .take(50);
  },
});

// 2. Traiter et valider un scan de QR Code CÔTÉ SERVEUR (Anti-Triche & Anti-Piratage)
// SÉCURITÉ RENFORCÉE :
// - Vérification d'authenticité de session (empêche de scanner pour le compte d'un autre joueur)
// - Rate Limiting strict (Anti-Bot et anti-scripts rapides)
// - Quotas stricts et vérification d'unicité
export const claimScan = mutation({
  args: {
    playerId: v.id("players"),
    rawCode: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Vérification de l'existence du joueur
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      return {
        success: false,
        points: 0,
        title: "CANDIDAT INTROUVABLE",
        message: "Votre licence de Hunter n'est pas reconnue par le serveur.",
      };
    }

    if (player.isDisqualified) {
      return {
        success: false,
        points: 0,
        title: "DISQUALIFIÉ",
        message: "Vous avez été exclu de l'Examen Hunter par le Game Master.",
      };
    }

    // 2. Vérification cryptographique de la session (Anti-Usurpation)
    if (player.sessionToken && (!args.sessionToken || args.sessionToken !== player.sessionToken)) {
      return {
        success: false,
        points: 0,
        title: "SESSION INVALIDE",
        message: "Échec de validation de la session. Veuillez ré-enregistrer votre licence Hunter.",
      };
    }

    // 3. Anti-Bot / Anti-Rapid-Fire Rate Limiting (Minimum 4 secondes entre scans)
    const SCAN_COOLDOWN_MS = 4000;
    if (player.lastScanAt && Date.now() - player.lastScanAt < SCAN_COOLDOWN_MS) {
      const remainingSec = Math.ceil((SCAN_COOLDOWN_MS - (Date.now() - player.lastScanAt)) / 1000);
      return {
        success: false,
        points: 0,
        title: "CADENCE TROP RAPIDE",
        message: `Veuillez patienter ${remainingSec} seconde(s) avant de scanner à nouveau.`,
      };
    }

    // 4. Extraction et nettoyage du code scanné
    function extractCode(raw: string): string {
      if (!raw) return "";
      let str = raw.trim();

      // Si le code contient le marqueur masqué temporaire
      if (str.includes("NEN-CIPHER-PROTECTED")) {
        return "CIPHER_MASKED_ERROR";
      }

      // Extraction depuis URL param (?code=..., ?card=..., ?c=...)
      const paramMatch = str.match(/[?&](?:code|card|c)=([A-Za-z0-9-_]+)/i);
      if (paramMatch && paramMatch[1]) {
        return paramMatch[1].trim().toUpperCase();
      }

      // Extraction motif officiel Hunter (ex: HXH-NUMERE-01, HXH-XXXX-XXXX)
      const hxhMatch = str.match(/HXH-[A-Za-z0-9-_]+/i);
      if (hxhMatch) {
        return hxhMatch[0].trim().toUpperCase();
      }

      return str.trim().toUpperCase();
    }

    const cleanCode = extractCode(args.rawCode);

    if (cleanCode === "CIPHER_MASKED_ERROR") {
      return {
        success: false,
        points: 0,
        title: "QR CODE EXPIRÉ / MASQUÉ",
        message: "Ce QR code a été affiché sans les droits d'examinateur. Veuillez ré-afficher le QR code depuis le panneau Admin après connexion.",
      };
    }

    // Recherche de la carte dans la base
    let card = await ctx.db
      .query("cards")
      .withIndex("by_code", (q) => q.eq("code", cleanCode))
      .first();

    if (!card) {
      const allActiveCards = await ctx.db
        .query("cards")
        .filter((q) => q.eq(q.field("active"), true))
        .collect();
      card = allActiveCards.find(
        (c) => c.code.trim().toUpperCase() === cleanCode
      ) || null;
    }

    if (!card || !card.active) {
      return {
        success: false,
        points: 0,
        title: "FRÉQUENCE NEN INCONNUE",
        message: "Ce QR code ne correspond à aucune carte active de l'Examen Hunter.",
      };
    }

    // 5. Vérification si déjà scanné par ce joueur
    const alreadyScanned =
      card.scannedBy.includes(player._id) ||
      player.scannedCodeIds.includes(card.code);

    if (alreadyScanned) {
      return {
        success: false,
        points: 0,
        title: "CARTE DÉJÀ ACQUISE",
        message: `Vous possédez déjà "${card.title}" dans vos archives Greed Island. Aucun point supplémentaire attribué.`,
        hint: card.hint,
      };
    }

    // 6. Vérification stricte du Quota maximal de scans
    if (card.scannedBy.length >= card.maxScans) {
      return {
        success: false,
        points: 0,
        title: "QUOTA ATTEINT (CARTE ÉPUISÉE)",
        message: `Cette carte avait un quota strict de ${card.maxScans} scan(s). D'autres candidats ont été plus rapides !`,
      };
    }

    // 7. Validation et attribution atomique
    const newScore = player.score + card.points;
    const newRank = calculateRank(newScore);
    const nowTimestamp = Date.now();

    // Mettre à jour la carte avec le nouveau scanner
    await ctx.db.patch(card._id, {
      scannedBy: [...card.scannedBy, player._id],
    });

    // Mettre à jour le profil du joueur
    await ctx.db.patch(player._id, {
      score: newScore,
      rank: newRank,
      scannedCodeIds: [...player.scannedCodeIds, card.code],
      lastActiveAt: nowTimestamp,
      lastScanAt: nowTimestamp,
    });

    // Enregistrer dans le flux en direct
    const now = new Date(nowTimestamp);
    const timeStr =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");

    await ctx.db.insert("scans", {
      playerId: player._id,
      playerNickname: player.nickname,
      hunterId: player.hunterNumber,
      cardCode: card.code,
      cardTitle: card.title,
      points: card.points,
      timestamp: nowTimestamp,
      timeStr,
    });

    return {
      success: true,
      points: card.points,
      title: card.title,
      message: `Félicitations ! Vous avez réclamé cette carte avec succès (+${card.points} PTS).`,
      hint: card.hint,
    };
  },
});
