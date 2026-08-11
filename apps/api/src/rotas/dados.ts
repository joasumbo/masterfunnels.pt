import type { FastifyInstance } from 'fastify'
import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import type { ListaRespostas, ResumoExecucao } from '@mf/shared/api'
import { autenticar } from '../auth.js'
import { angulos, classificacoes, clusters, db, execucoesAgente, respostas } from '../db/index.js'
import { escaparCsv, execucaoParaDTO, respostaParaDTO } from './comum.js'

const COLUNAS_CSV = [
  'id',
  'submetido_em',
  'idade',
  'rendimento',
  'ja_investiu',
  'origem',
  'r1_dificuldade',
  'r2_ja_tentou',
  'r3_o_que_faria_comprar',
  'cluster_dor',
  'cluster_nome',
  'nivel_consciencia',
  'objecao_principal',
  'citacao',
  'confianca',
  'revisto_por_humano',
  'modelo',
]

const POR_PAGINA = 25

export async function rotasDados(servidor: FastifyInstance) {
  servidor.addHook('preHandler', autenticar)

  servidor.get('/respostas', async (pedido) => {
    const consulta = pedido.query as Record<string, string | undefined>

    const filtros: SQL[] = []

    const termo = (consulta.q ?? '').trim()
    if (termo !== '') {
      const padrao = `%${termo}%`
      const procura = or(
        ilike(respostas.r1Dificuldade, padrao),
        ilike(respostas.r2JaTentou, padrao),
        ilike(respostas.r3OQueFariaComprar, padrao),
        ilike(respostas.id, padrao),
        ilike(classificacoes.objecaoPrincipal, padrao),
        ilike(classificacoes.citacao, padrao),
      )
      if (procura) filtros.push(procura)
    }

    if (consulta.cluster) filtros.push(eq(classificacoes.clusterDor, consulta.cluster))
    if (consulta.nivel) filtros.push(eq(classificacoes.nivelConsciencia, consulta.nivel))
    if (consulta.origem) filtros.push(eq(respostas.origem, consulta.origem))
    if (consulta.fonte) filtros.push(eq(respostas.fonte, consulta.fonte))
    if (consulta.revisto === 'sim') filtros.push(eq(classificacoes.revistoPorHumano, true))
    if (consulta.revisto === 'nao') filtros.push(eq(classificacoes.revistoPorHumano, false))
    if (consulta.duvidosas === 'sim') filtros.push(sql`${classificacoes.confianca} < 60`)

    const condicao = filtros.length > 0 ? and(...filtros) : undefined

    const ordenacoes: Record<string, SQL> = {
      recentes: desc(respostas.submetidoEm),
      antigas: asc(respostas.submetidoEm),
      confianca: asc(classificacoes.confianca),
      identificador: asc(respostas.id),
    }
    const ordem = ordenacoes[consulta.ordem ?? 'recentes'] ?? ordenacoes.recentes

    const porPagina = Math.min(Math.max(Number(consulta.porPagina ?? POR_PAGINA), 5), 200)
    const pagina = Math.max(Number(consulta.pagina ?? 1), 1)

    const [totais] = await db
      .select({ total: count() })
      .from(respostas)
      .leftJoin(classificacoes, eq(classificacoes.respostaId, respostas.id))
      .where(condicao)

    const linhas = await db
      .select({ resposta: respostas, classificacao: classificacoes })
      .from(respostas)
      .leftJoin(classificacoes, eq(classificacoes.respostaId, respostas.id))
      .where(condicao)
      .orderBy(ordem)
      .limit(porPagina)
      .offset((pagina - 1) * porPagina)

    const lista: ListaRespostas = {
      total: totais?.total ?? 0,
      pagina,
      porPagina,
      respostas: linhas.map((linha) => respostaParaDTO(linha.resposta, linha.classificacao)),
    }

    return lista
  })

  servidor.get('/exportacao/respostas.csv', async (_pedido, resposta) => {
    const linhas = await db
      .select({ resposta: respostas, classificacao: classificacoes, cluster: clusters })
      .from(respostas)
      .leftJoin(classificacoes, eq(classificacoes.respostaId, respostas.id))
      .leftJoin(clusters, eq(clusters.slug, classificacoes.clusterDor))
      .orderBy(asc(respostas.id))

    const ficheiro = [COLUNAS_CSV.join(',')]

    for (const { resposta: r, classificacao: c, cluster } of linhas) {
      ficheiro.push(
        [
          escaparCsv(r.id),
          escaparCsv(r.submetidoEm.toISOString()),
          escaparCsv(r.idade),
          escaparCsv(r.rendimento),
          escaparCsv(r.jaInvestiu),
          escaparCsv(r.origem),
          escaparCsv(r.r1Dificuldade),
          escaparCsv(r.r2JaTentou),
          escaparCsv(r.r3OQueFariaComprar),
          escaparCsv(c?.clusterDor ?? null),
          escaparCsv(cluster?.nome ?? null),
          escaparCsv(c?.nivelConsciencia ?? null),
          escaparCsv(c?.objecaoPrincipal ?? null),
          escaparCsv(c?.citacao ?? null),
          escaparCsv(c?.confianca ?? null),
          escaparCsv(c ? (c.revistoPorHumano ? 'sim' : 'não') : null),
          escaparCsv(c?.modelo ?? null),
        ].join(','),
      )
    }

    return resposta
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="pesquisa-respostas-classificadas.csv"')
      .send('﻿sep=,\r\n' + ficheiro.join('\r\n') + '\r\n')
  })

  servidor.get('/execucoes', async () => {
    const linhas = await db
      .select({
        id: execucoesAgente.id,
        clusterSlug: execucoesAgente.clusterSlug,
        clusterNome: clusters.nome,
        estado: execucoesAgente.estado,
        modelo: execucoesAgente.modelo,
        iteracoes: execucoesAgente.iteracoes,
        criterioParagem: execucoesAgente.criterioParagem,
        tokensEntrada: execucoesAgente.tokensEntrada,
        tokensSaida: execucoesAgente.tokensSaida,
        criadoEm: execucoesAgente.criadoEm,
        concluidoEm: execucoesAgente.concluidoEm,
        totalAngulos: sql<number>`count(${angulos.id})`.mapWith(Number),
      })
      .from(execucoesAgente)
      .leftJoin(clusters, eq(clusters.slug, execucoesAgente.clusterSlug))
      .leftJoin(angulos, eq(angulos.execucaoId, execucoesAgente.id))
      .groupBy(execucoesAgente.id, clusters.nome)
      .orderBy(desc(execucoesAgente.id))

    const lista: ResumoExecucao[] = linhas.map((linha) => ({
      id: linha.id,
      clusterSlug: linha.clusterSlug,
      clusterNome: linha.clusterNome ?? linha.clusterSlug,
      estado: linha.estado as ResumoExecucao['estado'],
      modelo: linha.modelo,
      iteracoes: linha.iteracoes,
      criterioParagem: linha.criterioParagem,
      tokensEntrada: linha.tokensEntrada,
      tokensSaida: linha.tokensSaida,
      criadoEm: linha.criadoEm.toISOString(),
      concluidoEm: linha.concluidoEm ? linha.concluidoEm.toISOString() : null,
      totalAngulos: linha.totalAngulos,
    }))

    return lista
  })

  servidor.get('/execucoes/:id', async (pedido, resposta) => {
    const { id } = pedido.params as { id: string }

    const [execucao] = await db
      .select()
      .from(execucoesAgente)
      .where(eq(execucoesAgente.id, Number(id)))
      .limit(1)

    if (!execucao) {
      return resposta.code(404).send({ erro: 'Execução não encontrada' })
    }

    return execucaoParaDTO(execucao)
  })
}
