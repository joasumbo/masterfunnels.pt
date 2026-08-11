import { asc, count, eq, sql } from 'drizzle-orm'
import type {
  AnguloDTO,
  ClassificacaoDTO,
  ClusterResumo,
  ExecucaoDTO,
  PassoTrace,
  RespostaDTO,
} from '@mf/shared/api'
import type { NivelConsciencia, Origem, Rendimento } from '@mf/shared'
import { angulos, classificacoes, clusters, db, execucoesAgente, respostas } from '../db/index.js'

type LinhaClassificacao = typeof classificacoes.$inferSelect
type LinhaResposta = typeof respostas.$inferSelect
type LinhaExecucao = typeof execucoesAgente.$inferSelect

export function percentagem(parte: number, total: number) {
  if (total <= 0) return 0
  return Math.round((parte / total) * 1000) / 10
}

export async function contarClassificadas() {
  const [linha] = await db.select({ total: count() }).from(classificacoes)
  return linha?.total ?? 0
}

export async function resumoDosClusters(totalClassificadas: number): Promise<ClusterResumo[]> {
  const linhas = await db
    .select({
      slug: clusters.slug,
      nome: clusters.nome,
      descricao: clusters.descricao,
      ordem: clusters.ordem,
      total: sql<number>`count(${classificacoes.id})`.mapWith(Number),
    })
    .from(clusters)
    .leftJoin(classificacoes, eq(classificacoes.clusterDor, clusters.slug))
    .groupBy(clusters.slug, clusters.nome, clusters.descricao, clusters.ordem)
    .orderBy(asc(clusters.ordem), asc(clusters.slug))

  return linhas.map((linha) => ({
    slug: linha.slug,
    nome: linha.nome,
    descricao: linha.descricao,
    total: linha.total,
    percentagem: percentagem(linha.total, totalClassificadas),
  }))
}

export function classificacaoParaDTO(linha: LinhaClassificacao): ClassificacaoDTO {
  return {
    clusterDor: linha.clusterDor,
    nivelConsciencia: linha.nivelConsciencia as NivelConsciencia,
    objecaoPrincipal: linha.objecaoPrincipal,
    citacao: linha.citacao,
    confianca: linha.confianca,
    modelo: linha.modelo,
    revistoPorHumano: linha.revistoPorHumano,
  }
}

export function respostaParaDTO(
  linha: LinhaResposta,
  classificacao: LinhaClassificacao | null,
): RespostaDTO {
  return {
    id: linha.id,
    fonte: linha.fonte,
    submetidoEm: linha.submetidoEm.toISOString(),
    idade: linha.idade,
    rendimento: linha.rendimento as Rendimento | null,
    jaInvestiu: linha.jaInvestiu,
    origem: linha.origem as Origem,
    r1Dificuldade: linha.r1Dificuldade,
    r2JaTentou: linha.r2JaTentou,
    r3OQueFariaComprar: linha.r3OQueFariaComprar,
    classificacao: classificacao ? classificacaoParaDTO(classificacao) : null,
  }
}

export async function execucaoParaDTO(execucao: LinhaExecucao): Promise<ExecucaoDTO> {
  const linhas = await db
    .select()
    .from(angulos)
    .where(eq(angulos.execucaoId, execucao.id))
    .orderBy(asc(angulos.posicao))

  const lista: AnguloDTO[] = linhas.map((linha) => ({
    posicao: linha.posicao,
    gancho: linha.gancho,
    promessa: linha.promessa,
    prova: linha.prova,
    objecaoQueDerruba: linha.objecaoQueDerruba,
    citacoes: (linha.citacoes ?? []) as { resposta_id: string; texto: string }[],
  }))

  return {
    id: execucao.id,
    clusterSlug: execucao.clusterSlug,
    estado: execucao.estado as ExecucaoDTO['estado'],
    modelo: execucao.modelo,
    iteracoes: execucao.iteracoes,
    trace: (execucao.trace ?? []) as PassoTrace[],
    criterioParagem: execucao.criterioParagem,
    erro: execucao.erro,
    tokensEntrada: execucao.tokensEntrada,
    tokensSaida: execucao.tokensSaida,
    criadoEm: execucao.criadoEm.toISOString(),
    concluidoEm: execucao.concluidoEm ? execucao.concluidoEm.toISOString() : null,
    angulos: lista,
  }
}

export function escaparCsv(valor: string | number | null) {
  const texto = valor === null || valor === undefined ? '' : String(valor)
  if (/["\n\r,]/.test(texto)) {
    return '"' + texto.replace(/"/g, '""') + '"'
  }
  return texto
}
