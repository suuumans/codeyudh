
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql', // 'mysql' | 'sqlite' | 'turso'
  schema: './src/db/schema',
  out: './drizzle', // Directory to store migration files
  dbCredentials: {
    url: "postgresql://suman:mypassword@localhost:5432/postgres",
  },
  verbose: true,
  strict: true
})
