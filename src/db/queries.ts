import { db } from './index';
import { posters } from './schema';
import { eq } from 'drizzle-orm';

// Type for inserting a new poster
export type NewPoster = typeof posters.$inferInsert;

// Save a new poster design
export async function savePoster(data: NewPoster) {
  const [result] = await db.insert(posters).values(data).returning();
  return result;
}

// Fetch a poster by its ID
export async function getPosterById(id: number) {
  const [poster] = await db.select().from(posters).where(eq(posters.id, id));
  return poster;
}