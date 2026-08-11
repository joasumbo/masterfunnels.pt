import 'dotenv/config'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema.js'

if (!process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL no ambiente')
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
})

pool.on('error', (erro) => {
  console.error('Erro na ligacao a base de dados:', erro.message)
})

export const db = drizzle(pool, { schema })
export * from './schema.js'
