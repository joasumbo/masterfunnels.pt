import type { FastifyInstance } from 'fastify'
import { count, desc, eq, sql } from 'drizzle-orm'
import { NIVEIS_CONSCIENCIA, ROTULO_CONSCIENCIA } from '@mf/shared'
import type { NivelConsciencia } from '@mf/shared'
import type { CelulaCruzamento, FatiaContagem, Resumo } from '@mf/shared/api'
import { autenticar } from '../auth.js'
import { classificacoes, db, respostas } from '../db/index.js'
import { percentagem, resumoDosClusters } from './comum.js'

const SEM_RENDIMENTO = 'sem indicação'

export async function rotasResumo(servidor: FastifyInstance) {
  servidor.addHook('preHandler', autenticar)

  servidor.get('/resumo', async () => {
    const [totais] = await db.select({ total: count() }).from(respostas)

    const [agregado] = await db
      .select({
        total: count(),
        media: sql<number>`coalesce(avg(${classificacoes.confianca}), 0)`.mapWith(Number),
        porRever: sql<number>`count(*) filter (where ${classificacoes.confianca} < 60 and ${classificacoes.revistoPorHumano} = false)`.mapWith(
          Number,
        ),
      })
      .from(classificacoes)

    const totalClassificadas = agregado?.total ?? 0

    const clusters = await resumoDosClusters(totalClassificadas)
    clusters.sort((a, b) => b.total - a.total)

    const porNivel = await db
      .select({
        chave: classificacoes.nivelConsciencia,
        total: count(),
      })
      .from(classificacoes)
      .groupBy(classificacoes.nivelConsciencia)

    const consciencia: FatiaContagem[] = NIVEIS_CONSCIENCIA.map((nivel) => {
      const total = porNivel.find((linha) => linha.chave === nivel)?.total ?? 0
      return {
        chave: nivel,
        rotulo: ROTULO_CONSCIENCIA[nivel as NivelConsciencia],
        total,
        percentagem: percentagem(total, totalClassificadas),
      }
    })

    const porObjecao = await db
      .select({ chave: classificacoes.objecaoPrincipal, total: count() })
      .from(classificacoes)
      .groupBy(classificacoes.objecaoPrincipal)
      .orderBy(desc(count()))

    const objecoes: FatiaContagem[] = porObjecao.map((linha) => ({
      chave: linha.chave,
      rotulo: linha.chave,
      total: linha.total,
      percentagem: percentagem(linha.total, totalClassificadas),
    }))

    const porRendimento = await db
      .select({
        cluster: classificacoes.clusterDor,
        categoria: sql<string>`coalesce(${respostas.rendimento}, ${SEM_RENDIMENTO})`,
        total: count(),
      })
      .from(classificacoes)
      .innerJoin(respostas, eq(respostas.id, classificacoes.respostaId))
      .groupBy(classificacoes.clusterDor, respostas.rendimento)
      .orderBy(desc(count()))

    const cruzamentoRendimento: CelulaCruzamento[] = porRendimento.map((linha) => ({
      cluster: linha.cluster,
      categoria: linha.categoria,
      total: linha.total,
    }))

    const porConsciencia = await db
      .select({
        cluster: classificacoes.clusterDor,
        categoria: classificacoes.nivelConsciencia,
        total: count(),
      })
      .from(classificacoes)
      .groupBy(classificacoes.clusterDor, classificacoes.nivelConsciencia)
      .orderBy(desc(count()))

    const cruzamentoConsciencia: CelulaCruzamento[] = porConsciencia.map((linha) => ({
      cluster: linha.cluster,
      categoria: linha.categoria,
      total: linha.total,
    }))

    const resumo: Resumo = {
      totalRespostas: totais?.total ?? 0,
      totalClassificadas,
      porRever: agregado?.porRever ?? 0,
      confiancaMedia: Math.round(agregado?.media ?? 0),
      clusters,
      consciencia,
      objecoes,
      cruzamentoRendimento,
      cruzamentoConsciencia,
    }

    return resumo
  })
}
