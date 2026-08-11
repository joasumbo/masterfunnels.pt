import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema.js'

if (!process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL no ambiente')
}

export const db = drizzle(neon(process.env.DATABASE_URL), { schema })
export * from './schema.js'
