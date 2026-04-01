import { pgTable, text, serial, timestamp, boolean, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  categorySlug: text("category_slug").notNull(),
  imageUrl: text("image_url"),
  basePrice: real("base_price").notNull(),
  discountPrice: real("discount_price"),
  minNegotiationPrice: real("min_negotiation_price"),
  isNegotiable: boolean("is_negotiable").notNull().default(false),
  isVisible: boolean("is_visible").notNull().default(true),
  stockStatus: text("stock_status").notNull().default("in_stock"),
  notes: text("notes"),
  bulkPricingNotes: text("bulk_pricing_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
