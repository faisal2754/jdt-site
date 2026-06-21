import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit does not auto-load .env.local, so load it explicitly here.
config({ path: '.env.local' })

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
