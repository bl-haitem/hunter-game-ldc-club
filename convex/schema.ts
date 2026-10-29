import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * HUNTER × HUNTER EXAM & GREED ISLAND — CONVEX DATABASE SCHEMA
 * Association Hunter & LDC Club Official System
 */
export default defineSchema({
  // Table 1 : Les Candidats / Licences Hunter
  players: defineTable({
    email: v.string(), // Email d'enregistrement officiel (Unique)
    nickname: v.string(), // Extrait directement de l'email (ex: "killua" de "killua@zoldyck.org")
    hunterNumber: v.string(), // ex: "HXH-404"
    nenType: v.string(), // Renforcement, Transmutation, etc.
    score: v.number(), // Points Nen accumulés
    rank: v.string(), // Aspirant, Pro Hunter, Double Star, Triple Star
    scannedCodeIds: v.array(v.string()), // Codes des cartes déjà validées par ce joueur
    registeredAt: v.number(), // Timestamp Unix
    lastActiveAt: v.number(), // Dernière activité
    isDisqualified: v.optional(v.boolean()),
    sessionToken: v.optional(v.string()), // Token de session cryptographique pour authentifier les requêtes
    lastScanAt: v.optional(v.number()), // Anti-spam / Anti-bot rate limiter
  })
    .index("by_email", ["email"])
    .index("by_score", ["score"])
    .index("by_hunter_number", ["hunterNumber"])
    .index("by_session_token", ["sessionToken"]),

  // Table 2 : Les Cartes Greed Island & Cibles d'Examen (QR Codes)
  cards: defineTable({
    code: v.string(), // Identifiant unique (ex: "HXH-NUMERE-01")
    title: v.string(), // Titre de la carte Nen
    cardRank: v.union(v.literal("SSR"), v.literal("SR"), v.literal("R"), v.literal("N")),
    points: v.number(), // Points accordés
    maxScans: v.number(), // Quota strict de scans autorisés
    scannedBy: v.array(v.string()), // Liste des IDs de candidats ayant déjà scanné
    hint: v.string(), // Énigme de localisation / Indice Nen
    locationDesc: v.optional(v.string()), // Emplacement secret réservé aux examinateurs
    active: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_code", ["code"]),

  // Table 3 : Historique des Scans en temps réel (Flux Live Feed)
  scans: defineTable({
    playerId: v.string(),
    playerNickname: v.string(),
    hunterId: v.string(),
    cardCode: v.string(),
    cardTitle: v.string(),
    points: v.number(),
    timestamp: v.number(),
    timeStr: v.string(),
  })
    .index("by_player", ["playerId"])
    .index("by_timestamp", ["timestamp"]),

  // Table 4 : Configuration & Sécurité du Jeu
  gameConfig: defineTable({
    adminPasswordHash: v.string(), // Hash SHA-256 du mot de passe admin (Pas de texte brut !)
    examPhase: v.string(),
    isGameActive: v.boolean(),
  }),

  // Table 5 : Sessions d'Administrateur Sécurisées (Tokens cryptographiques éphémères)
  adminSessions: defineTable({
    token: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"]),

  // Table 6 : Anti Brute-Force & Rate Limiting
  adminAttempts: defineTable({
    failedCount: v.number(),
    lastAttemptAt: v.number(),
    lockedUntil: v.number(),
  }),
});
