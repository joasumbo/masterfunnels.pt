import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db, utilizadores } from '../db/index.js'

async function correr() {
  const email = process.env.ADMIN_EMAIL
  const palavraPasse = process.env.ADMIN_PASSWORD

  if (!email || !palavraPasse) {
    throw new Error('Falta ADMIN_EMAIL ou ADMIN_PASSWORD no ambiente')
  }

  const hash = await bcrypt.hash(palavraPasse, 10)
  const [existente] = await db.select().from(utilizadores).where(eq(utilizadores.email, email))

  if (existente) {
    await db
      .update(utilizadores)
      .set({ palavraPasseHash: hash })
      .where(eq(utilizadores.email, email))
    console.log(`Palavra-passe atualizada para ${email}`)
    return
  }

  await db.insert(utilizadores).values({
    email,
    palavraPasseHash: hash,
    nome: 'Equipa Master Funnels',
  })
  console.log(`Utilizador ${email} criado`)
}

correr()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
