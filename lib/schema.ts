import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "athlete"] }).notNull().default("athlete"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const athletes = sqliteTable("athletes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  birthDate: text("birth_date"),
  gender: text("gender", { enum: ["male", "female"] }),
  phone: text("phone"),
  club: text("club"),
  licenseNo: text("license_no"),
  nationalId: text("national_id"),
  level: text("level", {
    enum: ["beginner", "intermediate", "advanced", "professional"],
  }).default("beginner"),
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const tournamentRegistrations = sqliteTable("tournament_registrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  athleteId: integer("athlete_id")
    .notNull()
    .references(() => athletes.id, { onDelete: "cascade" }),
  tournamentType: text("tournament_type", {
    enum: ["normal", "doubles"],
  })
    .notNull()
    .default("normal"),
  hasPartner: integer("has_partner", { mode: "boolean" }).notNull().default(false),
  partnerName: text("partner_name"),
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Athlete = typeof athletes.$inferSelect;
export type NewAthlete = typeof athletes.$inferInsert;
export type TournamentRegistration = typeof tournamentRegistrations.$inferSelect;
export type NewTournamentRegistration = typeof tournamentRegistrations.$inferInsert;
