import { and, eq } from 'drizzle-orm'
import { db, respostas, classificacoes, clusters } from '../db/index.js'
import { normalizar } from '@mf/shared'
import type { Ferramenta } from '../lib/ia.js'

export type Contexto = {
  clusterSlug: string
  linhas: {
    id: string
    r1: string
    r2: string | null
    r3: string | null
    citacao: string | null
    confianca: number
    nivelConsciencia: string
    objecaoPrincipal: string
    rendimento: string | null
    origem: string
  }[]
  nome: string
  descricao: string
}

export async function carregarContexto(clusterSlug: string): Promise<Contexto> {
  const [cluster] = await db.select().from(clusters).where(eq(clusters.slug, clusterSlug))
  if (!cluster) throw new Error(`Cluster desconhecido: ${clusterSlug}`)

  const linhas = await db
    .select({
      id: respostas.id,
      r1: respostas.r1Dificuldade,
      r2: respostas.r2JaTentou,
      r3: respostas.r3OQueFariaComprar,
      rendimento: respostas.rendimento,
      origem: respostas.origem,
      citacao: classificacoes.citacao,
      confianca: classificacoes.confianca,
      nivelConsciencia: classificacoes.nivelConsciencia,
      objecaoPrincipal: classificacoes.objecaoPrincipal,
    })
    .from(classificacoes)
    .innerJoin(respostas, eq(respostas.id, classificacoes.respostaId))
    .where(eq(classificacoes.clusterDor, clusterSlug))

  if (linhas.length === 0) throw new Error(`O cluster ${clusterSlug} nao tem respostas`)

  return { clusterSlug, linhas, nome: cluster.nome, descricao: cluster.descricao }
}

export const DEFINICOES: Ferramenta[] = [
  {
    name: 'panorama_do_cluster',
    description:
      'Devolve o tamanho do cluster, como se distribui pelos niveis de consciencia e pelas objecoes, e o peso dele face aos outros clusters. Comeca por aqui.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'ler_respostas',
    description:
      'Le as respostas do cluster na integra, com os tres campos de texto e a citacao ja extraida. Ordena da confianca mais alta para a mais baixa.',
    parameters: {
      type: 'OBJECT',
      properties: {
        limite: { type: 'INTEGER', description: 'Quantas respostas ler, entre 1 e 40' },
        desvio: { type: 'INTEGER', description: 'Quantas saltar, para ler o resto' },
      },
      required: ['limite'],
    },
  },
  {
    name: 'procurar_citacoes',
    description:
      'Procura nas respostas deste cluster os excertos que contem um termo. Usa para encontrar frases sobre um medo, um numero ou uma situacao concreta.',
    parameters: {
      type: 'OBJECT',
      properties: { termo: { type: 'STRING' } },
      required: ['termo'],
    },
  },
  {
    name: 'respostas_por_objecao',
    description:
      'Devolve as respostas do cluster cuja objecao principal e a indicada, para fundamentar o angulo que derruba essa objecao.',
    parameters: {
      type: 'OBJECT',
      properties: { objecao: { type: 'STRING' } },
      required: ['objecao'],
    },
  },
  {
    name: 'verificar_citacao',
    description:
      'Confirma se um excerto existe letra a letra numa resposta deste cluster. Verifica todas as citacoes antes de as usares num angulo.',
    parameters: {
      type: 'OBJECT',
      properties: { texto: { type: 'STRING' } },
      required: ['texto'],
    },
  },
  {
    name: 'entregar_angulos',
    description:
      'Entrega os cinco angulos finais e termina. So podes chamar esta ferramenta quando cada angulo tiver pelo menos uma citacao ja confirmada por verificar_citacao e as cinco objecoes forem distintas.',
    parameters: {
      type: 'OBJECT',
      properties: {
        angulos: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              gancho: { type: 'STRING' },
              promessa: { type: 'STRING' },
              prova: { type: 'STRING' },
              objecao_que_derruba: { type: 'STRING' },
              citacoes: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    resposta_id: { type: 'STRING' },
                    texto: { type: 'STRING' },
                  },
                  required: ['resposta_id', 'texto'],
                },
              },
            },
            required: ['gancho', 'promessa', 'prova', 'objecao_que_derruba', 'citacoes'],
          },
        },
        criterio_paragem: {
          type: 'STRING',
          description:
            'Porque paraste: o que verificaste e que te deu confianca para entregar em vez de continuar a consultar.',
        },
      },
      required: ['angulos', 'criterio_paragem'],
    },
  },
]

function contar(valores: string[]): { chave: string; total: number }[] {
  const mapa = new Map<string, number>()
  valores.forEach((v) => mapa.set(v, (mapa.get(v) ?? 0) + 1))
  return [...mapa.entries()]
    .map(([chave, total]) => ({ chave, total }))
    .sort((a, b) => b.total - a.total)
}

export function localizarCitacao(ctx: Contexto, texto: string): string | null {
  const alvo = normalizar(texto)
  if (alvo.length < 8) return null
  const encontrada = ctx.linhas.find((l) =>
    [l.r1, l.r2, l.r3].filter(Boolean).some((c) => normalizar(c as string).includes(alvo)),
  )
  return encontrada ? encontrada.id : null
}

export async function executarFerramenta(
  ctx: Contexto,
  nome: string,
  args: Record<string, unknown>,
): Promise<{ texto: string; resumo: string }> {
  if (nome === 'panorama_do_cluster') {
    const todos = await db.select().from(clusters).orderBy(clusters.ordem)
    const totalGeral = await db.$count(classificacoes)
    const pesos: { nome: string; total: number }[] = []
    for (const c of todos) {
      pesos.push({
        nome: c.nome,
        total: await db.$count(classificacoes, eq(classificacoes.clusterDor, c.slug)),
      })
    }

    const dados = {
      cluster: ctx.nome,
      descricao: ctx.descricao,
      respostas_no_cluster: ctx.linhas.length,
      peso_no_total: `${Math.round((ctx.linhas.length / totalGeral) * 100)}%`,
      niveis_de_consciencia: contar(ctx.linhas.map((l) => l.nivelConsciencia)),
      objecoes: contar(ctx.linhas.map((l) => l.objecaoPrincipal)),
      citacoes_disponiveis: ctx.linhas.filter((l) => l.citacao).length,
      todos_os_clusters: pesos.sort((a, b) => b.total - a.total),
    }
    return {
      texto: JSON.stringify(dados),
      resumo: `${ctx.linhas.length} respostas, ${dados.objecoes.length} objecoes distintas`,
    }
  }

  if (nome === 'ler_respostas') {
    const limite = Math.min(Math.max(Number(args.limite) || 10, 1), 40)
    const desvio = Math.max(Number(args.desvio) || 0, 0)
    const ordenadas = [...ctx.linhas].sort((a, b) => b.confianca - a.confianca)
    const fatia = ordenadas.slice(desvio, desvio + limite)
    const dados = fatia.map((l) => ({
      id: l.id,
      dificuldade: l.r1,
      ja_tentou: l.r2,
      o_que_faria_comprar: l.r3,
      citacao: l.citacao,
      objecao: l.objecaoPrincipal,
      consciencia: l.nivelConsciencia,
    }))
    return {
      texto: JSON.stringify(dados),
      resumo: `${fatia.length} respostas lidas (de ${ctx.linhas.length})`,
    }
  }

  if (nome === 'procurar_citacoes') {
    const termo = normalizar(String(args.termo ?? ''))
    const achados = ctx.linhas
      .flatMap((l) =>
        [l.r1, l.r2, l.r3]
          .filter(Boolean)
          .filter((c) => normalizar(c as string).includes(termo))
          .map((c) => ({ resposta_id: l.id, texto: c as string, objecao: l.objecaoPrincipal })),
      )
      .slice(0, 25)
    return {
      texto: JSON.stringify(achados),
      resumo: `"${args.termo}": ${achados.length} excerto(s)`,
    }
  }

  if (nome === 'respostas_por_objecao') {
    const alvo = normalizar(String(args.objecao ?? ''))
    const fatia = ctx.linhas.filter((l) => normalizar(l.objecaoPrincipal).includes(alvo))
    const dados = fatia.map((l) => ({
      id: l.id,
      dificuldade: l.r1,
      o_que_faria_comprar: l.r3,
      citacao: l.citacao,
    }))
    return {
      texto: JSON.stringify(dados),
      resumo: `objecao "${args.objecao}": ${fatia.length} resposta(s)`,
    }
  }

  if (nome === 'verificar_citacao') {
    const texto = String(args.texto ?? '')
    const respostaId = localizarCitacao(ctx, texto)
    return {
      texto: JSON.stringify(
        respostaId
          ? { valida: true, resposta_id: respostaId }
          : {
              valida: false,
              motivo:
                'Este excerto nao existe letra a letra em nenhuma resposta deste cluster. Usa ler_respostas ou procurar_citacoes e copia o texto tal e qual.',
            },
      ),
      resumo: respostaId ? `citacao valida em ${respostaId}` : 'citacao rejeitada',
    }
  }

  throw new Error(`Ferramenta desconhecida: ${nome}`)
}
