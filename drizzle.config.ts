import * as dotenv from 'dotenv';

dotenv.config();

export default {
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.VITE_DATABASE_URL!,
  },
};