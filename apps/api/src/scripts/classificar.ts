import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { classificacoes, db, respostas } from '../db/index.js'
import { MODELO_CLASSIFICACAO } from '../lib/ia.js'
import {
  classificarLote,
  taxonomiaActual,
  type Entrada,
  type LinhaClassificada,
} from '../lib/classificador.js'

const POR_LOTE = 10
const EM_PARALELO = 2

async function correr() {
  const taxonomia = await taxonomiaActual()

  const todas = await db
    .select({ resposta: respostas, classificacao: classificacoes })
    .from(respostas)
    .leftJoin(classificacoes, eq(classificacoes.respostaId, respostas.id))

  const protegidas = todas.filter((l) => l.classificacao?.revistoPorHumano).length

  const entradas: Entrada[] = todas
    .filter((l) => !l.classificacao?.revistoPorHumano)
    .map((l) => ({
      id: l.resposta.id,
      r1: l.resposta.r1Dificuldade,
      r2: l.resposta.r2JaTentou,
      r3: l.resposta.r3OQueFariaComprar,
    }))

  console.log(
    `${entradas.length} respostas a classificar, ${protegidas} preservadas por terem revisao humana, ${taxonomia.length} clusters, modelo ${MODELO_CLASSIFICACAO}`,
  )

  if (entradas.length === 0) return

  const lotes: Entrada[][] = []
  for (let i = 0; i < entradas.length; i += POR_LOTE) lotes.push(entradas.slice(i, i + POR_LOTE))

  const linhas: LinhaClassificada[] = []
  let tokensEntrada = 0
  let tokensSaida = 0
  let citacoesRejeitadas = 0

  for (let i = 0; i < lotes.length; i += EM_PARALELO) {
    const grupo = lotes.slice(i, i + EM_PARALELO)
    const feitos = await Promise.all(grupo.map((lote) => classificarLote(lote, taxonomia)))

    for (const feito of feitos) {
      linhas.push(...feito.linhas)
      citacoesRejeitadas += feito.citacoesRejeitadas
      tokensEntrada += feito.uso.entrada
      tokensSaida += feito.uso.saida
    }

    console.log(`   ${Math.min(i + EM_PARALELO, lotes.length)}/${lotes.length} lotes`)
  }

  for (const linha of linhas) {
    await db
      .insert(classificacoes)
      .values(linha)
      .onConflictDoUpdate({ target: classificacoes.respostaId, set: linha })
  }

  const total = await db.$count(classificacoes)
  const porRever = linhas.filter((l) => l.confianca < 60).length
  const media = Math.round(linhas.reduce((s, l) => s + l.confianca, 0) / linhas.length)

  console.log(`\n${total} classificacoes na base`)
  console.log(`   confianca media ${media} nas que correram agora`)
  console.log(`   ${porRever} por rever (confianca abaixo de 60)`)
  console.log(`   ${citacoesRejeitadas} citacoes rejeitadas por nao serem literais`)
  console.log(`   tokens: ${tokensEntrada} entrada, ${tokensSaida} saida`)
}

correr()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
