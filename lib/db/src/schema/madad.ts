import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("madad_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  username: text("username").notNull().unique(),
  role: text("role").notNull().default("USER"),
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationStatus: text("verification_status").notNull().default("UNVERIFIED"),
  verificationLevel: text("verification_level").notNull().default("NONE"),
  isRestricted: boolean("is_restricted").notNull().default(false),
  restrictionReason: text("restriction_reason"),
  riskScore: integer("risk_score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("madad_sessions", {
  id: text("id").primaryKey(), tokenHash: text("token_hash").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const posts = pgTable("madad_posts", {
  id: text("id").primaryKey(), authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(), content: text("content").notNull(), category: text("category").notNull(), country: text("country"), city: text("city"),
  status: text("status").notNull().default("PENDING_REVIEW"), riskScore: integer("risk_score").notNull().default(0), moderationNote: text("moderation_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const comments = pgTable("madad_comments", { id: text("id").primaryKey(), postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }), authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }), content: text("content").notNull(), status: text("status").notNull().default("ACTIVE"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() });

export const helpOffers = pgTable("madad_help_offers", { id: text("id").primaryKey(), postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), message: text("message"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() });

export const reports = pgTable("madad_reports", {
  id: text("id").primaryKey(), postId: text("post_id").references(() => posts.id, { onDelete: "cascade" }), reportedUserId: text("reported_user_id").references(() => users.id, { onDelete: "cascade" }), reporterId: text("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(), details: text("details"), status: text("status").notNull().default("OPEN"), severity: text("severity").notNull().default("MEDIUM"), resolution: text("resolution"), reviewedBy: text("reviewed_by").references(() => users.id), reviewedAt: timestamp("reviewed_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verificationRequests = pgTable("madad_verification_requests", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), type: text("type").notNull(), status: text("status").notNull().default("PENDING"), metadata: jsonb("metadata"), decisionNote: text("decision_note"), reviewedBy: text("reviewed_by").references(() => users.id), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

export const moderationCases = pgTable("madad_moderation_cases", {
  id: text("id").primaryKey(), subjectType: text("subject_type").notNull(), subjectId: text("subject_id").notNull(), status: text("status").notNull().default("OPEN"), priority: text("priority").notNull().default("NORMAL"), reason: text("reason").notNull(), evidence: jsonb("evidence"), assignedTo: text("assigned_to").references(() => users.id), resolution: text("resolution"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(), resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const financeTransactions = pgTable("madad_finance_transactions", {
  id: text("id").primaryKey(), userId: text("user_id").references(() => users.id), postId: text("post_id").references(() => posts.id), type: text("type").notNull(), status: text("status").notNull().default("PENDING"), amountMinor: integer("amount_minor").notNull(), currency: text("currency").notNull(), provider: text("provider"), externalReference: text("external_reference"), metadata: jsonb("metadata"), reviewedBy: text("reviewed_by").references(() => users.id), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminAuditLogs = pgTable("madad_admin_audit_logs", {
  id: text("id").primaryKey(), actorId: text("actor_id").references(() => users.id), action: text("action").notNull(), targetType: text("target_type").notNull(), targetId: text("target_id"), metadata: jsonb("metadata"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MadadUser = typeof users.$inferSelect;
export type MadadPost = typeof posts.$inferSelect;
