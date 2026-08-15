import { pgTable, serial, text, doublePrecision, jsonb, timestamp } from 'drizzle-orm/pg-core';

// Represents a user's saved poster design
export const posters = pgTable('posters', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  
  // Text & Typography
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  fontFamily: text('font_family').notNull(),
  
  // Map State
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  zoom: doublePrecision('zoom').notNull(),
  themeUrl: text('theme_url').notNull(),
  
  // Layout Dimensions
  layoutId: text('layout_id').notNull(), 
  
  // JSONB is perfect for storing an array of dropped marker coordinates
  markers: jsonb('markers').default([]).notNull(),

  imageUrl: text('image_url'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});