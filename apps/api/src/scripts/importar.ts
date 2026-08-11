import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { db, respostas } from '../db/index.js'
import { lerCsv } from '../lib/csv.js'
import { ORIGENS, RENDIMENTOS, JA_INVESTIU, type Origem } from '@mf/shared'

const CAMINHO_CSV = resolve(process.cwd(), '../../pesquisa-respostas.csv')

function limpar(valor: string | undefined): string | null {
  const v = (valor ?? '').trim()
  if (v === '' || v === '-') return null
  return v
}

async function correr() {
  const registos = lerCsv(readFileSync(CAMINHO_CSV, 'utf-8'))
  console.log(`${registos.length} linhas lidas do CSV`)

  const problemas: string[] = []
  const linhas = registos.map((r) => {
    if (!ORIGENS.includes(r.origem as Origem)) problemas.push(`${r.id}: origem "${r.origem}"`)
    if (r.rendimento && !RENDIMENTOS.includes(r.rendimento as never))
      problemas.push(`${r.id}: rendimento "${r.rendimento}"`)
    if (r.ja_investiu && !JA_INVESTIU.includes(r.ja_investiu as never))
      problemas.push(`${r.id}: ja_investiu "${r.ja_investiu}"`)

    const idade = Number.parseInt(r.idade, 10)

    return {
      id: r.id,
      fonte: 'csv',
      submetidoEm: new Date(r.submetido_em),
      idade: Number.isFinite(idade) ? idade : null,
      rendimento: limpar(r.rendimento),
      jaInvestiu: limpar(r.ja_investiu),
      origem: r.origem,
      r1Dificuldade: r.r1_dificuldade.trim(),
      r2JaTentou: limpar(r.r2_ja_tentou),
      r3OQueFariaComprar: limpar(r.r3_o_que_faria_comprar),
    }
  })

  if (problemas.length) {
    console.log(`\nValores fora dos enums do contrato (${problemas.length}):`)
    problemas.forEach((p) => console.log('   ' + p))
    console.log('')
  }

  await db.delete(respostas)
  for (let i = 0; i < linhas.length; i += 40) {
    await db.insert(respostas).values(linhas.slice(i, i + 40))
  }

  const total = await db.$count(respostas)
  const semR2 = linhas.filter((l) => l.r2JaTentou === null).length
  const semR3 = linhas.filter((l) => l.r3OQueFariaComprar === null).length

  console.log(`${total} respostas na base de dados`)
  console.log(`   ${semR2} sem resposta a "ja tentou"`)
  console.log(`   ${semR3} sem resposta a "o que faria comprar"`)
}

correr()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
