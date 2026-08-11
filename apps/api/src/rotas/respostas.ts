import type { FastifyInstance } from 'fastify'
import { desc, like } from 'drizzle-orm'
import { ORIGENS, RespostaPublicaSchema } from '@mf/shared'
import type { Origem } from '@mf/shared'
import { db, respostas } from '../db/index.js'

const LIMITE_POR_IP = 5
const JANELA_MS = 60 * 60 * 1000
const TEMPO_MINIMO_MS = 3000

const submissoes = new Map<string, number[]>()

function excedeuLimite(ip: string) {
  const agora = Date.now()
  const recentes = (submissoes.get(ip) ?? []).filter((momento) => agora - momento < JANELA_MS)
  if (recentes.length >= LIMITE_POR_IP) {
    submissoes.set(ip, recentes)
    return true
  }
  recentes.push(agora)
  submissoes.set(ip, recentes)
  return false
}

function lerOrigem(valor: unknown): Origem {
  return ORIGENS.includes(valor as Origem) ? (valor as Origem) : 'organico'
}

async function proximoId() {
  const [ultima] = await db
    .select({ id: respostas.id })
    .from(respostas)
    .where(like(respostas.id, 'L%'))
    .orderBy(desc(respostas.id))
    .limit(1)

  const numero = ultima ? Number(ultima.id.slice(1)) + 1 : 1
  return 'L' + String(numero).padStart(4, '0')
}

export async function rotasRespostas(servidor: FastifyInstance) {
  servidor.post('/respostas', async (pedido, resposta) => {
    if (excedeuLimite(pedido.ip)) {
      return resposta
        .code(429)
        .send({ erro: 'Já recebemos várias respostas tuas. Tenta novamente daqui a uma hora.' })
    }

    const corpo = (pedido.body ?? {}) as Record<string, unknown>

    if (typeof corpo.website === 'string' && corpo.website.trim() !== '') {
      return resposta.code(400).send({ erro: 'Submissão inválida.' })
    }

    const tempo = Number(corpo.tempo_preenchimento ?? 0)
    if (!Number.isFinite(tempo) || tempo < TEMPO_MINIMO_MS) {
      return resposta
        .code(400)
        .send({ erro: 'Preenchimento demasiado rápido. Lê as perguntas e tenta outra vez.' })
    }

    const analise = RespostaPublicaSchema.safeParse(corpo)
    if (!analise.success) {
      const campos: Record<string, string> = {}
      for (const problema of analise.error.issues) {
        const campo = String(problema.path[0] ?? 'geral')
        if (!campos[campo]) campos[campo] = problema.message
      }
      return resposta.code(400).send({ erro: 'Confirma os campos assinalados.', campos })
    }

    const dados = analise.data
    const id = await proximoId()

    await db.insert(respostas).values({
      id,
      fonte: 'landing',
      submetidoEm: new Date(),
      idade: dados.idade,
      rendimento: dados.rendimento,
      jaInvestiu: dados.ja_investiu,
      origem: lerOrigem(corpo.origem),
      r1Dificuldade: dados.r1_dificuldade,
      r2JaTentou: dados.r2_ja_tentou || null,
      r3OQueFariaComprar: dados.r3_o_que_faria_comprar || null,
    })

    return resposta.code(201).send({ ok: true, id })
  })
}
