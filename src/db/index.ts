import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Vite exposes env variables via import.meta.env
const connectionString = import.meta.env.VITE_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Database URL is missing from environment variables.');
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });