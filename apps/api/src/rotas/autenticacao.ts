import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { apagarSessao, assinarSessao, autenticar, guardarSessao } from '../auth.js'
import { db, utilizadores } from '../db/index.js'

const EntrarSchema = z.object({
  email: z.string().trim().min(1),
  palavraPasse: z.string().min(1),
})

const CREDENCIAIS_INVALIDAS = { erro: 'Email ou palavra-passe incorretos' }

export async function rotasAutenticacao(servidor: FastifyInstance) {
  servidor.post('/auth/entrar', async (pedido, resposta) => {
    const analise = EntrarSchema.safeParse(pedido.body)
    if (!analise.success) {
      return resposta.code(401).send(CREDENCIAIS_INVALIDAS)
    }

    const email = analise.data.email.toLowerCase()
    const [utilizador] = await db
      .select()
      .from(utilizadores)
      .where(eq(utilizadores.email, email))
      .limit(1)

    if (!utilizador) {
      return resposta.code(401).send(CREDENCIAIS_INVALIDAS)
    }

    const confere = await bcrypt.compare(analise.data.palavraPasse, utilizador.palavraPasseHash)
    if (!confere) {
      return resposta.code(401).send(CREDENCIAIS_INVALIDAS)
    }

    const dados = { email: utilizador.email, nome: utilizador.nome }
    guardarSessao(resposta, await assinarSessao(dados))
    return { utilizador: dados }
  })

  servidor.post('/auth/sair', async (_pedido, resposta) => {
    apagarSessao(resposta)
    return { ok: true }
  })

  servidor.get('/auth/eu', { preHandler: autenticar }, async (pedido) => {
    return { utilizador: pedido.utilizador }
  })
}
