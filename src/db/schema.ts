import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const tickets = sqliteTable("tickets", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  full_name: text("full_name").notNull(),
  cedula: text("cedula").notNull().unique(),
  phone: text("phone").notNull(),
  email: text("email").notNull().unique(),
  qr_token: text("qr_token").notNull().unique(),
  attended: integer("attended", { mode: "boolean" }).notNull().default(false),
  created_at: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
