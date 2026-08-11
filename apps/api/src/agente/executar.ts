import { eq } from 'drizzle-orm'
import { db, execucoesAgente, angulos } from '../db/index.js'
import { pedirComFerramentas, MODELO_AGENTE, type Turno } from '../lib/ia.js'
import {
  DEFINICOES,
  carregarContexto,
  executarFerramenta,
  localizarCitacao,
  type Contexto,
} from './ferramentas.js'

const MAX_ITERACOES = 10

const SISTEMA = `És redator de resposta direta numa agência portuguesa. Recebes um cluster de dor saído de uma pesquisa ao público e entregas cinco ângulos de anúncio.

Cada ângulo tem quatro partes:
- gancho: a primeira linha do anúncio. Interrompe. Usa as palavras da própria pessoa, não jargão de marketing.
- promessa: o que ela leva daqui, concreto e verificável.
- prova: porque é que isto é credível. Se o cluster der material, ancora em números ou situações reais que apareceram nas respostas.
- objecao_que_derruba: a objeção específica que este ângulo desmonta.

Cada ângulo tem de assentar em pelo menos uma citação literal de uma resposta deste cluster. Não inventes citações e não as arranjes: copia-as tal e qual, com os erros que tiverem.

Os cinco ângulos derrubam cinco objeções DIFERENTES. Vê primeiro que objeções existem mesmo neste cluster e cobre as de maior peso.

COMO TRABALHAR. Tens ferramentas para consultar os dados. Decide tu o que precisas de ver e por que ordem. Não peças autorização, consulta. Uma sequência que costuma funcionar: começar pelo panorama para perceber o tamanho e as objeções, ler respostas suficientes para ouvir a voz das pessoas, procurar excertos sobre as objeções que vais atacar, e verificar cada citação antes de a usar.

QUANDO PARAR. Chama entregar_angulos quando, e só quando, tiveres cinco ângulos com cinco objeções distintas e todas as citações confirmadas por verificar_citacao. Se uma citação for rejeitada, vai buscar outra em vez de insistir. Ao entregar, explica em criterio_paragem o que consultaste e o que te deu confiança para parar.

Escreve em português de Portugal. Sem emojis.`

type PassoTrace = {
  iteracao: number
  ferramenta: string
  argumentos: Record<string, unknown>
  resumoResultado: string
  ms: number
}

type AnguloEntregue = {
  gancho: string
  promessa: string
  prova: string
  objecao_que_derruba: string
  citacoes: { resposta_id: string; texto: string }[]
}

function validarEntrega(ctx: Contexto, lista: AnguloEntregue[]): string | null {
  if (!Array.isArray(lista) || lista.length !== 5) {
    return `Entregaste ${lista?.length ?? 0} angulos. Sao precisos exatamente 5.`
  }

  const objecoes = lista.map((a) => (a.objecao_que_derruba ?? '').trim().toLowerCase())
  if (new Set(objecoes).size !== 5) {
    return 'Ha objecoes repetidas entre os angulos. Os cinco tem de derrubar objecoes diferentes.'
  }

  for (let i = 0; i < lista.length; i++) {
    const a = lista[i]
    if (!a.citacoes?.length) return `O angulo ${i + 1} nao traz nenhuma citacao.`
    for (const c of a.citacoes) {
      const encontrada = localizarCitacao(ctx, c.texto)
      if (!encontrada) {
        return `A citacao do angulo ${i + 1} ("${String(c.texto).slice(0, 60)}...") nao existe letra a letra em nenhuma resposta deste cluster. Substitui-a por uma que exista.`
      }
      c.resposta_id = encontrada
    }
  }

  return null
}

export async function executarAgente(clusterSlug: string): Promise<number> {
  const ctx = await carregarContexto(clusterSlug)

  const [execucao] = await db
    .insert(execucoesAgente)
    .values({ clusterSlug, modelo: MODELO_AGENTE, estado: 'a_correr' })
    .returning({ id: execucoesAgente.id })

  const trace: PassoTrace[] = []
  let tokensEntrada = 0
  let tokensSaida = 0

  const historico: Turno[] = [
    {
      role: 'user',
      parts: [
        {
          text: `Cluster: ${ctx.nome}\nDescricao: ${ctx.descricao}\nRespostas neste cluster: ${ctx.linhas.length}\n\nEntrega os cinco angulos de anuncio.`,
        },
      ],
    },
  ]

  try {
    for (let iteracao = 1; iteracao <= MAX_ITERACOES; iteracao++) {
      const { partes, uso } = await pedirComFerramentas({
        modelo: MODELO_AGENTE,
        sistema: SISTEMA,
        historico,
        ferramentas: DEFINICOES,
      })

      tokensEntrada += uso.entrada
      tokensSaida += uso.saida

      historico.push({ role: 'model', parts: partes })

      const chamadas = partes.filter((p) => p.functionCall).map((p) => p.functionCall!)

      if (chamadas.length === 0) {
        historico.push({
          role: 'user',
          parts: [
            {
              text: 'Nao chamaste nenhuma ferramenta. Continua a consultar os dados ou chama entregar_angulos se ja tiveres os cinco angulos verificados.',
            },
          ],
        })
        continue
      }

      const respostasFerramentas: {
        functionResponse: { name: string; response: Record<string, unknown> }
      }[] = []

      for (const chamada of chamadas) {
        const nome = chamada.name
        const args = (chamada.args ?? {}) as Record<string, unknown>
        const inicio = Date.now()

        if (nome === 'entregar_angulos') {
          const lista = args.angulos as AnguloEntregue[]
          const erro = validarEntrega(ctx, lista)

          trace.push({
            iteracao,
            ferramenta: nome,
            argumentos: { total_angulos: lista?.length ?? 0 },
            resumoResultado: erro ? `entrega rejeitada: ${erro}` : 'entrega aceite',
            ms: Date.now() - inicio,
          })

          if (erro) {
            respostasFerramentas.push({
              functionResponse: { name: nome, response: { aceite: false, motivo: erro } },
            })
            continue
          }

          await db.insert(angulos).values(
            lista.map((a, i) => ({
              execucaoId: execucao.id,
              clusterSlug,
              posicao: i + 1,
              gancho: a.gancho,
              promessa: a.promessa,
              prova: a.prova,
              objecaoQueDerruba: a.objecao_que_derruba,
              citacoes: a.citacoes,
            })),
          )

          await db
            .update(execucoesAgente)
            .set({
              estado: 'concluida',
              iteracoes: iteracao,
              trace,
              criterioParagem: String(args.criterio_paragem ?? ''),
              tokensEntrada,
              tokensSaida,
              concluidoEm: new Date(),
            })
            .where(eq(execucoesAgente.id, execucao.id))

          return execucao.id
        }

        const resultado = await executarFerramenta(ctx, nome, args)
        trace.push({
          iteracao,
          ferramenta: nome,
          argumentos: args,
          resumoResultado: resultado.resumo,
          ms: Date.now() - inicio,
        })
        respostasFerramentas.push({
          functionResponse: { name: nome, response: { resultado: resultado.texto } },
        })
      }

      historico.push({ role: 'user', parts: respostasFerramentas })
    }

    throw new Error(`O agente nao entregou em ${MAX_ITERACOES} iteracoes`)
  } catch (e) {
    await db
      .update(execucoesAgente)
      .set({
        estado: 'falhou',
        iteracoes: trace.length,
        trace,
        erro: e instanceof Error ? e.message : String(e),
        tokensEntrada,
        tokensSaida,
        concluidoEm: new Date(),
      })
      .where(eq(execucoesAgente.id, execucao.id))
    throw e
  }
}
