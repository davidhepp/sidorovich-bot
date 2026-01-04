import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const killaKills = pgTable("killa_kills", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  timestamp: timestamp("timestamp", { mode: "date" }).notNull(),
});

export const killaResets = pgTable("killa_resets", {
  userId: varchar("user_id", { length: 64 }).primaryKey(),
  resetAfter: timestamp("reset_after", { mode: "date" }).notNull(),
});
