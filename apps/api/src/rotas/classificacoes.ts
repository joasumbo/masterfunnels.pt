import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { NIVEIS_CONSCIENCIA } from '@mf/shared'
import { autenticar } from '../auth.js'
import { classificacoes, db } from '../db/index.js'
import { classificacaoParaDTO } from './comum.js'

const CorrecaoSchema = z.object({
  clusterDor: z.string().trim().min(1).optional(),
  nivelConsciencia: z.enum(NIVEIS_CONSCIENCIA).optional(),
  objecaoPrincipal: z.string().trim().min(1).optional(),
  citacao: z.string().trim().nullable().optional(),
})

export async function rotasClassificacoes(servidor: FastifyInstance) {
  servidor.addHook('preHandler', autenticar)

  servidor.patch('/classificacoes/:respostaId', async (pedido, resposta) => {
    const { respostaId } = pedido.params as { respostaId: string }

    const analise = CorrecaoSchema.safeParse(pedido.body ?? {})
    if (!analise.success) {
      const campos: Record<string, string> = {}
      for (const problema of analise.error.issues) {
        const campo = String(problema.path[0] ?? 'geral')
        if (!campos[campo]) campos[campo] = problema.message
      }
      return resposta.code(400).send({ erro: 'Correção inválida.', campos })
    }

    const alteracoes = analise.data
    if (Object.keys(alteracoes).length === 0) {
      return resposta.code(400).send({ erro: 'Não indicaste nada para corrigir.' })
    }

    const [atualizada] = await db
      .update(classificacoes)
      .set({
        ...alteracoes,
        citacao: alteracoes.citacao === '' ? null : alteracoes.citacao,
        revistoPorHumano: true,
        revistoEm: new Date(),
      })
      .where(eq(classificacoes.respostaId, respostaId))
      .returning()

    if (!atualizada) {
      return resposta.code(404).send({ erro: 'Classificação não encontrada' })
    }

    return classificacaoParaDTO(atualizada)
  })
}
