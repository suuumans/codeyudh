
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql', // 'mysql' | 'sqlite' | 'turso'
  schema: './src/db/schema',
  out: './drizzle', // Directory to store migration files
  dbCredentials: {
    url: process.env.DB_URI!,
  },
  verbose: true,
  strict: true
})
