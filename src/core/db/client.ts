import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Safe initialization for client-side or serverless environments
const connectionString = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DATABASE_URL) || 
  (typeof process !== 'undefined' ? process.env.DATABASE_URL : '') || '';

export const db = connectionString
  ? drizzle(neon(connectionString), { schema })
  : (null as unknown as ReturnType<typeof drizzle>);