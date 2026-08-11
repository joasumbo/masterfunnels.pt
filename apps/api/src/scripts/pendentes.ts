import 'dotenv/config'
import { isNull, eq } from 'drizzle-orm'
import { classificacoes, db, respostas } from '../db/index.js'
import { classificarLote, taxonomiaActual, type Entrada } from '../lib/classificador.js'

async function correr() {
  const porFazer = await db
    .select({ resposta: respostas })
    .from(respostas)
    .leftJoin(classificacoes, eq(classificacoes.respostaId, respostas.id))
    .where(isNull(classificacoes.id))

  if (porFazer.length === 0) {
    console.log('Nao ha respostas por classificar.')
    return
  }

  const entradas: Entrada[] = porFazer.map(({ resposta }) => ({
    id: resposta.id,
    r1: resposta.r1Dificuldade,
    r2: resposta.r2JaTentou,
    r3: resposta.r3OQueFariaComprar,
  }))

  console.log(`${entradas.length} por classificar: ${entradas.map((e) => e.id).join(', ')}`)

  const taxonomia = await taxonomiaActual()
  const { linhas, citacoesRejeitadas } = await classificarLote(entradas, taxonomia)

  for (const linha of linhas) {
    await db.insert(classificacoes).values(linha).onConflictDoNothing()
    console.log(`   ${linha.respostaId} -> ${linha.clusterDor}, confianca ${linha.confianca}`)
  }

  console.log(`${linhas.length} gravadas, ${citacoesRejeitadas} citacoes rejeitadas`)
}

correr()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
