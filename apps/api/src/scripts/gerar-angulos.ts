import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db, clusters, classificacoes, execucoesAgente, angulos } from '../db/index.js'
import { executarAgente } from '../agente/executar.js'

async function correr() {
  const alvo = process.argv[2]
  let slug = alvo

  if (!slug) {
    const todos = await db.select().from(clusters).orderBy(clusters.ordem)
    const pesos: { slug: string; nome: string; total: number }[] = []
    for (const c of todos) {
      pesos.push({
        slug: c.slug,
        nome: c.nome,
        total: await db.$count(classificacoes, eq(classificacoes.clusterDor, c.slug)),
      })
    }
    pesos.sort((a, b) => b.total - a.total)
    slug = pesos[0].slug
    console.log(`Cluster com mais peso: ${pesos[0].nome} (${pesos[0].total} respostas)`)
  }

  const inicio = Date.now()
  const id = await executarAgente(slug!)
  const [execucao] = await db.select().from(execucoesAgente).where(eq(execucoesAgente.id, id))
  const lista = await db.select().from(angulos).where(eq(angulos.execucaoId, id))

  console.log(`\nExecucao ${id} em ${((Date.now() - inicio) / 1000).toFixed(1)}s`)
  console.log(`${execucao.iteracoes} iteracoes, ${execucao.tokensEntrada} tokens entrada, ${execucao.tokensSaida} saida\n`)

  console.log('O QUE O AGENTE CONSULTOU:')
  for (const passo of execucao.trace as { iteracao: number; ferramenta: string; resumoResultado: string }[]) {
    console.log(`  ${passo.iteracao}. ${passo.ferramenta.padEnd(22)} ${passo.resumoResultado}`)
  }

  console.log(`\nPOR QUE PAROU:\n  ${execucao.criterioParagem}\n`)

  for (const a of lista.sort((x, y) => x.posicao - y.posicao)) {
    console.log(`ANGULO ${a.posicao}`)
    console.log(`  gancho    ${a.gancho}`)
    console.log(`  promessa  ${a.promessa}`)
    console.log(`  prova     ${a.prova}`)
    console.log(`  derruba   ${a.objecaoQueDerruba}`)
    for (const c of a.citacoes as { resposta_id: string; texto: string }[]) {
      console.log(`  citacao   [${c.resposta_id}] "${c.texto}"`)
    }
    console.log('')
  }
}

correr().catch((e) => {
  console.error(e)
  process.exit(1)
})
