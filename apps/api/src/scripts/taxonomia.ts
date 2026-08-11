import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { db, clusters } from '../db/index.js'
import { lerCsv } from '../lib/csv.js'
import { pedirJson, MODELO_AGENTE, type Esquema } from '../lib/ia.js'
import { normalizar } from '@mf/shared'

const CAMINHO_CSV = resolve(process.cwd(), '../../pesquisa-respostas.csv')

const SISTEMA = `És analista de pesquisa de mercado numa agência de marketing de resposta direta em Portugal.

Recebes a lista das dificuldades distintas que apareceram numa pesquisa ao público sobre um curso de finanças pessoais e investimento para iniciantes, cada uma com o número de vezes que apareceu.

A tua tarefa é propor a taxonomia canónica de clusters de dor que melhor organiza estas respostas para efeitos de escrita de anúncios.

Critérios:
- Entre 8 e 10 clusters. Menos do que isso funde dores que exigem anúncios diferentes; mais do que isso fragmenta demais para o volume de respostas que existe.
- Cada cluster agrupa pessoas a quem se venderia com o mesmo argumento. Duas respostas ficam no mesmo cluster se o mesmo anúncio as convencesse.
- Separa a dor da situação. "Não tenho dinheiro" e "tenho dinheiro parado" são dores opostas mesmo que ambas falem de dinheiro.
- O nome é curto, em português de Portugal, e nomeia a dor pelas palavras da própria pessoa, não por jargão de marketing.
- A descrição tem uma frase e diz quem é esta pessoa e o que a bloqueia.
- O slug é minúsculo, sem acentos, com underscores.
- Ordena do cluster com mais respostas para o com menos.
- Todas as dificuldades da lista têm de caber em exatamente um cluster. Não deixes nenhuma de fora e não inventes clusters vazios.`

const ESQUEMA: Esquema = {
  type: 'OBJECT',
  properties: {
    raciocinio: {
      type: 'STRING',
      description: 'Como chegaste a este agrupamento, em duas ou tres frases',
    },
    clusters: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          slug: { type: 'STRING' },
          nome: { type: 'STRING' },
          descricao: { type: 'STRING' },
          dificuldades_abrangidas: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['slug', 'nome', 'descricao', 'dificuldades_abrangidas'],
        propertyOrdering: ['slug', 'nome', 'descricao', 'dificuldades_abrangidas'],
      },
    },
  },
  required: ['raciocinio', 'clusters'],
  propertyOrdering: ['raciocinio', 'clusters'],
}

type Saida = {
  raciocinio: string
  clusters: { slug: string; nome: string; descricao: string; dificuldades_abrangidas: string[] }[]
}

async function correr() {
  const registos = lerCsv(readFileSync(CAMINHO_CSV, 'utf-8'))

  const contagem = new Map<string, { texto: string; total: number }>()
  for (const r of registos) {
    const chave = normalizar(r.r1_dificuldade)
    if (!chave) continue
    const existente = contagem.get(chave)
    if (existente) existente.total++
    else contagem.set(chave, { texto: r.r1_dificuldade.trim(), total: 1 })
  }

  const distintas = [...contagem.values()].sort((a, b) => b.total - a.total)
  console.log(`${registos.length} respostas, ${distintas.length} dificuldades distintas`)

  const lista = distintas.map((d) => `${d.total}x  ${d.texto}`).join('\n')

  const { dados, uso } = await pedirJson<Saida>({
    modelo: MODELO_AGENTE,
    sistema: SISTEMA,
    utilizador: lista,
    esquema: ESQUEMA,
  })

  console.log(`\n${dados.raciocinio}\n`)

  const cobertas = new Set(dados.clusters.flatMap((c) => c.dificuldades_abrangidas.map(normalizar)))
  const fora = distintas.filter((d) => !cobertas.has(normalizar(d.texto)))
  if (fora.length) {
    console.log(`Aviso: ${fora.length} dificuldade(s) sem cluster atribuido:`)
    fora.forEach((d) => console.log('   ' + d.texto.slice(0, 80)))
  }

  await db.delete(clusters)
  await db.insert(clusters).values(
    dados.clusters.map((c, i) => ({
      slug: c.slug,
      nome: c.nome,
      descricao: c.descricao,
      ordem: i,
    })),
  )

  console.log(`\n${dados.clusters.length} clusters gravados:\n`)
  dados.clusters.forEach((c, i) => {
    console.log(`${String(i + 1).padStart(2)}. ${c.nome}`)
    console.log(`    ${c.slug}`)
    console.log(`    ${c.descricao}`)
    console.log(`    ${c.dificuldades_abrangidas.length} dificuldade(s)\n`)
  })

  console.log(`tokens: ${uso.entrada} entrada, ${uso.saida} saida`)
}

correr().catch((e) => {
  console.error(e)
  process.exit(1)
})
