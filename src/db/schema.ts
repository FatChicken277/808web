import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const tickets = sqliteTable("tickets", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  full_name: text("full_name").notNull(),
  id_type: text("id_type").notNull().default("CC"),
  cedula: text("cedula").notNull().unique(),
  phone: text("phone").notNull(),
  email: text("email").notNull().unique(),
  qr_token: text("qr_token").notNull().unique(),
  attended: integer("attended", { mode: "boolean" }).notNull().default(false),
  ref_code: text("ref_code"),
  created_at: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const artists = sqliteTable("artists", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  created_at: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
