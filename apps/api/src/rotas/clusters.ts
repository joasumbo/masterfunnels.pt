import type { FastifyInstance } from 'fastify'
import { and, asc, desc, eq, isNotNull } from 'drizzle-orm'
import { normalizar } from '@mf/shared'
import type { DetalheCluster } from '@mf/shared/api'
import { autenticar } from '../auth.js'
import { classificacoes, clusters, db, execucoesAgente, respostas } from '../db/index.js'
import {
  contarClassificadas,
  escaparCsv,
  execucaoParaDTO,
  respostaParaDTO,
  resumoDosClusters,
} from './comum.js'

const CABECALHO_CSV = 'resposta_id,citacao,nivel_consciencia,objecao_principal,confianca'

export async function rotasClusters(servidor: FastifyInstance) {
  servidor.addHook('preHandler', autenticar)

  servidor.get('/clusters', async () => {
    return resumoDosClusters(await contarClassificadas())
  })

  servidor.get('/clusters/:slug', async (pedido, resposta) => {
    const { slug } = pedido.params as { slug: string }

    const lista = await resumoDosClusters(await contarClassificadas())
    const cluster = lista.find((item) => item.slug === slug)
    if (!cluster) {
      return resposta.code(404).send({ erro: 'Cluster não encontrado' })
    }

    const linhas = await db
      .select({ resposta: respostas, classificacao: classificacoes })
      .from(respostas)
      .innerJoin(classificacoes, eq(classificacoes.respostaId, respostas.id))
      .where(eq(classificacoes.clusterDor, slug))
      .orderBy(asc(classificacoes.confianca))

    const detalhe: DetalheCluster = {
      cluster,
      respostas: linhas.map((linha) => respostaParaDTO(linha.resposta, linha.classificacao)),
    }

    return detalhe
  })

  servidor.get('/clusters/:slug/citacoes.csv', async (pedido, resposta) => {
    const { slug } = pedido.params as { slug: string }

    const linhas = await db
      .select({
        respostaId: classificacoes.respostaId,
        citacao: classificacoes.citacao,
        nivelConsciencia: classificacoes.nivelConsciencia,
        objecaoPrincipal: classificacoes.objecaoPrincipal,
        confianca: classificacoes.confianca,
      })
      .from(classificacoes)
      .where(and(eq(classificacoes.clusterDor, slug), isNotNull(classificacoes.citacao)))
      .orderBy(desc(classificacoes.confianca))

    const vistas = new Set<string>()
    const ficheiro = [CABECALHO_CSV]

    for (const linha of linhas) {
      const chave = normalizar(linha.citacao ?? '')
      if (chave === '' || vistas.has(chave)) continue
      vistas.add(chave)
      ficheiro.push(
        [
          escaparCsv(linha.respostaId),
          escaparCsv(linha.citacao),
          escaparCsv(linha.nivelConsciencia),
          escaparCsv(linha.objecaoPrincipal),
          escaparCsv(linha.confianca),
        ].join(','),
      )
    }

    return resposta
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="citacoes-' + slug + '.csv"')
      .send('﻿sep=,\r\n' + ficheiro.join('\r\n') + '\r\n')
  })

  servidor.get('/clusters/:slug/angulos', async (pedido, resposta) => {
    const { slug } = pedido.params as { slug: string }

    const [execucao] = await db
      .select()
      .from(execucoesAgente)
      .where(and(eq(execucoesAgente.clusterSlug, slug), eq(execucoesAgente.estado, 'concluida')))
      .orderBy(desc(execucoesAgente.id))
      .limit(1)

    if (!execucao) {
      return resposta.send(null)
    }

    return execucaoParaDTO(execucao)
  })

  servidor.post('/clusters/:slug/angulos', async (pedido, resposta) => {
    const { slug } = pedido.params as { slug: string }

    const [cluster] = await db
      .select({ slug: clusters.slug })
      .from(clusters)
      .where(eq(clusters.slug, slug))
      .limit(1)

    if (!cluster) {
      return resposta.code(404).send({ erro: 'Cluster não encontrado' })
    }

    const { executarAgente } = await import('../agente/executar.js')

    try {
      return { execucaoId: await executarAgente(slug) }
    } catch (erro) {
      servidor.log.error({ erro: String(erro), cluster: slug }, 'Falhou a execucao do agente')
      return resposta.code(502).send({ erro: 'O agente não conseguiu concluir. Tenta outra vez.' })
    }
  })
}
