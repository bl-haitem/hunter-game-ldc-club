import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Hash SHA-256 par défaut (protégé côté serveur, JAMAIS visible dans le bundle client)
const DEFAULT_ADMIN_HASH = "374178899457b69c8f2d4686578df70a65b733c12d408f6525bee9be4f4f1a49";
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes de blocage en cas d'attaque brute-force
const SESSION_DURATION_MS = 3 * 60 * 60 * 1000; // Session active 3 heures

// Helper sécurisé pour valider une session Admin dans n'importe quel handler Convex
export async function validateAdminToken(ctx: any, token: string): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();

  if (!session) return false;
  if (Date.now() > session.expiresAt) return false;
  return true;
}

export async function assertAdminToken(ctx: any, token: string): Promise<void> {
  const isValid = await validateAdminToken(ctx, token);
  if (!isValid) {
    throw new Error("ACCÈS REFUSÉ : Session administrateur non autorisée ou expirée !");
  }
}

// 1. Connexion Sécurisée de l'Administrateur (Vérification Cryptographique & Anti Brute-Force)
export const loginAdmin = mutation({
  args: {
    passwordHash: v.string(), // Le client envoie uniquement le HASH SHA-256 calculé en local
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. Vérification Anti Brute-Force
    let attemptRecord = await ctx.db.query("adminAttempts").first();
    if (attemptRecord) {
      if (now < attemptRecord.lockedUntil) {
        const remainingMinutes = Math.ceil((attemptRecord.lockedUntil - now) / 60000);
        return {
          success: false,
          isLocked: true,
          message: `SYSTÈME VERROUILLÉ : Trop de tentatives erronées détectées. Réessayez dans ${remainingMinutes} minute(s).`,
        };
      }
    }

    // 2. Récupérer le Hash officiel stocké
    const config = await ctx.db.query("gameConfig").first();
    const targetHash = config?.adminPasswordHash || DEFAULT_ADMIN_HASH;

    // 3. Comparaison stricte
    if (args.passwordHash.toLowerCase() !== targetHash.toLowerCase()) {
      // Échec : incrémenter le compteur de tentatives suspectes
      const currentFailed = (attemptRecord?.failedCount || 0) + 1;
      const isNowLocked = currentFailed >= MAX_FAILED_ATTEMPTS;
      const lockUntil = isNowLocked ? now + LOCKOUT_DURATION_MS : 0;

      if (attemptRecord) {
        await ctx.db.patch(attemptRecord._id, {
          failedCount: isNowLocked ? 0 : currentFailed,
          lastAttemptAt: now,
          lockedUntil: lockUntil,
        });
      } else {
        await ctx.db.insert("adminAttempts", {
          failedCount: isNowLocked ? 0 : currentFailed,
          lastAttemptAt: now,
          lockedUntil: lockUntil,
        });
      }

      if (isNowLocked) {
        return {
          success: false,
          isLocked: true,
          message: "ALERTE SÉCURITÉ : 5 tentatives échouées. Le panel administrateur est bloqué pendant 15 minutes.",
        };
      }

      return {
        success: false,
        isLocked: false,
        message: `Mot de passe incorrect ! (${MAX_FAILED_ATTEMPTS - currentFailed} tentative(s) restante(s))`,
      };
    }

    // 4. Succès : Réinitialiser les tentatives échouées
    if (attemptRecord) {
      await ctx.db.patch(attemptRecord._id, {
        failedCount: 0,
        lastAttemptAt: now,
        lockedUntil: 0,
      });
    }

    // 5. Générer un Token de Session Cryptographique Unique et Éphémère (CSPRNG 256-bit)
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const randomHex = Array.from(randomBytes, (b) => b.toString(16).padStart(2, "0")).join("");
    const sessionToken = `adm_sec_${now}_${randomHex}`;
    const expiresAt = now + SESSION_DURATION_MS;

    await ctx.db.insert("adminSessions", {
      token: sessionToken,
      createdAt: now,
      expiresAt,
    });

    return {
      success: true,
      token: sessionToken,
      expiresAt,
      message: "Accès Game Master autorisé. Session sécurisée activée.",
    };
  },
});

// 2. Vérification de la validité d'une session Admin
export const checkAdminSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return await validateAdminToken(ctx, args.token);
  },
});

// 3. Déconnexion et révocation immédiate du token
export const logoutAdmin = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
    return { success: true };
  },
});

// 4. Changement du mot de passe Admin (Nécessite une session valide)
export const changeAdminPassword = mutation({
  args: {
    token: v.string(),
    newPasswordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || Date.now() > session.expiresAt) {
      throw new Error("ACCÈS REFUSÉ : Session administrateur invalide ou expirée !");
    }

    const config = await ctx.db.query("gameConfig").first();
    if (config) {
      await ctx.db.patch(config._id, {
        adminPasswordHash: args.newPasswordHash.toLowerCase(),
      });
    } else {
      await ctx.db.insert("gameConfig", {
        adminPasswordHash: args.newPasswordHash.toLowerCase(),
        examPhase: "Phase 1 - Examen Hunter 2026",
        isGameActive: true,
      });
    }

    return { success: true, message: "Mot de passe administrateur mis à jour avec succès !" };
  },
});
