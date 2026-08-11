import { NIVEIS_CONSCIENCIA, normalizar, semSinal } from '@mf/shared'
import { clusters, db } from '../db/index.js'
import { MODELO_CLASSIFICACAO, pedirJson, type Esquema } from './ia.js'

export type Entrada = {
  id: string
  r1: string
  r2: string | null
  r3: string | null
}

export type LinhaClassificada = {
  respostaId: string
  clusterDor: string
  nivelConsciencia: string
  objecaoPrincipal: string
  citacao: string | null
  confianca: number
  modelo: string
}

type Saida = {
  classificacoes: {
    resposta_id: string
    cluster_dor: string
    nivel_consciencia: string
    objecao_principal: string
    citacao: string | null
    confianca: number
  }[]
}

type Cluster = { slug: string; nome: string; descricao: string }

export function construirSistema(taxonomia: Cluster[]) {
  const lista = taxonomia.map((c) => `- ${c.slug} — ${c.nome}: ${c.descricao}`).join('\n')

  return `És analista de pesquisa numa agência de marketing de resposta direta em Portugal. Classificas respostas de uma pesquisa sobre um curso de finanças pessoais e investimento para iniciantes.

Recebes respostas com três campos de texto:
- dificuldade: a maior dificuldade da pessoa neste momento
- ja_tentou: o que já tentou antes e como correu
- o_que_faria_comprar: o que teria de acontecer para avançar

CLASSIFICA APENAS PELO TEXTO. Nunca uses idade, rendimento, origem ou qualquer outro campo de perfil — neste conjunto de dados os campos de perfil foram atribuídos de forma aleatória e contradizem o que a pessoa escreve. Um texto que diz "sou reformado, tenho 68 anos" aparece associado a idades de 24 e 26 anos.

CLUSTER DE DOR. Escolhe exatamente um destes slugs, pelo que a dificuldade revela:
${lista}

NÍVEL DE CONSCIÊNCIA. Um de: inconsciente, consciente_do_problema, consciente_da_solucao, consciente_do_produto.
- inconsciente: fala em termos vagos de querer mais, sem nomear um problema concreto nem uma solução
- consciente_do_problema: nomeia o problema com clareza mas não sabe que categoria de solução o resolve
- consciente_da_solucao: sabe que existe uma categoria de solução e já andou à volta dela, mas ainda não escolheu
- consciente_do_produto: já comprou, contratou ou experimentou algo deste género e fala com base nessa experiência
O campo ja_tentou é o melhor sinal para este nível. Quem diz "nada, é a primeira vez" está abaixo de quem diz "contratei um PPR" ou "fiz um curso gratuito".

OBJEÇÃO PRINCIPAL. Etiqueta curta, minúscula, duas a quatro palavras, em português de Portugal, que nomeia o que trava a compra. Sai sobretudo do campo o_que_faria_comprar. Reutiliza formulações consistentes entre respostas: se duas pessoas dizem a mesma coisa por outras palavras, dá-lhes a mesma etiqueta. Exemplos de forma: "medo de esquema", "preço acima do orçamento", "falta de tempo", "quer prova de pares".

CITAÇÃO. Um excerto COPIADO LETRA A LETRA de um dos três campos daquela resposta, que sirva tal e qual num anúncio. Não corrijas ortografia, não juntes frases de campos diferentes, não parafraseies. Se nenhum excerto servir, devolve null. Prefere frases com emoção, número concreto ou imagem forte.

CONFIANÇA. De 0 a 100. Baixa quando a resposta é curta, genérica ou os campos estão vazios. Abaixo de 60 sinaliza que uma pessoa deve rever.`
}

export function construirEsquema(slugs: string[]): Esquema {
  const campos = [
    'resposta_id',
    'cluster_dor',
    'nivel_consciencia',
    'objecao_principal',
    'citacao',
    'confianca',
  ]

  return {
    type: 'OBJECT',
    properties: {
      classificacoes: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            resposta_id: { type: 'STRING' },
            cluster_dor: { type: 'STRING', enum: slugs },
            nivel_consciencia: { type: 'STRING', enum: [...NIVEIS_CONSCIENCIA] },
            objecao_principal: { type: 'STRING' },
            citacao: { type: 'STRING', nullable: true },
            confianca: { type: 'INTEGER' },
          },
          required: campos,
          propertyOrdering: campos,
        },
      },
    },
    required: ['classificacoes'],
    propertyOrdering: ['classificacoes'],
  }
}

export function citacaoELiteral(citacao: string, entrada: Entrada): boolean {
  const alvo = normalizar(citacao)
  if (alvo.length < 8) return false
  return [entrada.r1, entrada.r2, entrada.r3]
    .filter(Boolean)
    .some((campo) => normalizar(campo as string).includes(alvo))
}

export function corpoDoPedido(lote: Entrada[]) {
  return lote
    .map(
      (e) =>
        `[${e.id}]\ndificuldade: ${e.r1}\nja_tentou: ${e.r2 ?? '(em branco)'}\no_que_faria_comprar: ${e.r3 ?? '(em branco)'}`,
    )
    .join('\n\n')
}

export function consolidar(
  bruto: Saida['classificacoes'],
  entradas: Entrada[],
): { linhas: LinhaClassificada[]; citacoesRejeitadas: number } {
  const porId = new Map(entradas.map((e) => [e.id, e]))
  let citacoesRejeitadas = 0

  const linhas = bruto.map((c) => {
    const entrada = porId.get(c.resposta_id)
    let citacao = c.citacao
    let confianca = Math.max(0, Math.min(100, Math.round(c.confianca)))

    if (citacao && entrada && !citacaoELiteral(citacao, entrada)) {
      citacao = null
      confianca = Math.min(confianca, 45)
      citacoesRejeitadas++
    }

    if (entrada && semSinal(entrada.r2) && semSinal(entrada.r3)) {
      confianca = Math.min(confianca, 55)
    }

    return {
      respostaId: c.resposta_id,
      clusterDor: c.cluster_dor,
      nivelConsciencia: c.nivel_consciencia,
      objecaoPrincipal: c.objecao_principal.trim().toLowerCase(),
      citacao,
      confianca,
      modelo: MODELO_CLASSIFICACAO,
    }
  })

  return { linhas, citacoesRejeitadas }
}

export async function taxonomiaActual(): Promise<Cluster[]> {
  const lista = await db
    .select({ slug: clusters.slug, nome: clusters.nome, descricao: clusters.descricao })
    .from(clusters)
    .orderBy(clusters.ordem)

  if (lista.length === 0) {
    throw new Error('Nao ha clusters. Corre primeiro o script da taxonomia.')
  }

  return lista
}

export async function classificarLote(lote: Entrada[], taxonomia: Cluster[]) {
  const resultado = await pedirJson<Saida>({
    modelo: MODELO_CLASSIFICACAO,
    sistema: construirSistema(taxonomia),
    utilizador: `Classifica cada uma das ${lote.length} respostas seguintes.\n\n${corpoDoPedido(lote)}`,
    esquema: construirEsquema(taxonomia.map((c) => c.slug)),
  })

  return {
    ...consolidar(resultado.dados.classificacoes, lote),
    uso: resultado.uso,
  }
}
