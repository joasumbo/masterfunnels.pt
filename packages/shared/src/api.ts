import type { NivelConsciencia, Origem, Rendimento } from './index.js'

export type Utilizador = { email: string; nome: string }

export type ClusterResumo = {
  slug: string
  nome: string
  descricao: string
  total: number
  percentagem: number
}

export type FatiaContagem = {
  chave: string
  rotulo: string
  total: number
  percentagem: number
}

export type CelulaCruzamento = {
  cluster: string
  categoria: string
  total: number
}

export type Resumo = {
  totalRespostas: number
  totalClassificadas: number
  porRever: number
  confiancaMedia: number
  clusters: ClusterResumo[]
  consciencia: FatiaContagem[]
  objecoes: FatiaContagem[]
  cruzamentoRendimento: CelulaCruzamento[]
  cruzamentoConsciencia: CelulaCruzamento[]
}

export type ClassificacaoDTO = {
  clusterDor: string
  nivelConsciencia: NivelConsciencia
  objecaoPrincipal: string
  citacao: string | null
  confianca: number
  modelo: string
  revistoPorHumano: boolean
}

export type RespostaDTO = {
  id: string
  fonte: string
  submetidoEm: string
  idade: number | null
  rendimento: Rendimento | null
  jaInvestiu: string | null
  origem: Origem
  r1Dificuldade: string
  r2JaTentou: string | null
  r3OQueFariaComprar: string | null
  classificacao: ClassificacaoDTO | null
}

export type DetalheCluster = {
  cluster: ClusterResumo
  respostas: RespostaDTO[]
}

export type ListaRespostas = {
  total: number
  pagina: number
  porPagina: number
  respostas: RespostaDTO[]
}

export type FiltrosRespostas = {
  q?: string
  cluster?: string
  nivel?: string
  origem?: string
  fonte?: string
  revisto?: 'sim' | 'nao'
  duvidosas?: 'sim'
  ordem?: 'recentes' | 'antigas' | 'confianca' | 'identificador'
  pagina?: number
  porPagina?: number
}

export type ResumoExecucao = {
  id: number
  clusterSlug: string
  clusterNome: string
  estado: 'a_correr' | 'concluida' | 'falhou'
  modelo: string
  iteracoes: number
  criterioParagem: string | null
  tokensEntrada: number
  tokensSaida: number
  criadoEm: string
  concluidoEm: string | null
  totalAngulos: number
}

export type PassoTrace = {
  iteracao: number
  ferramenta: string
  argumentos: Record<string, unknown>
  resumoResultado: string
  ms: number
}

export type AnguloDTO = {
  posicao: number
  gancho: string
  promessa: string
  prova: string
  objecaoQueDerruba: string
  citacoes: { resposta_id: string; texto: string }[]
}

export type ExecucaoDTO = {
  id: number
  clusterSlug: string
  estado: 'a_correr' | 'concluida' | 'falhou'
  modelo: string
  iteracoes: number
  trace: PassoTrace[]
  criterioParagem: string | null
  erro: string | null
  tokensEntrada: number
  tokensSaida: number
  criadoEm: string
  concluidoEm: string | null
  angulos: AnguloDTO[]
}

export const ENDPOINTS = {
  entrar: 'POST /api/auth/entrar',
  sair: 'POST /api/auth/sair',
  eu: 'GET /api/auth/eu',
  resumo: 'GET /api/resumo',
  clusters: 'GET /api/clusters',
  detalheCluster: 'GET /api/clusters/:slug',
  citacoesCsv: 'GET /api/clusters/:slug/citacoes.csv',
  corrigir: 'PATCH /api/classificacoes/:respostaId',
  angulosDoCluster: 'GET /api/clusters/:slug/angulos',
  gerarAngulos: 'POST /api/clusters/:slug/angulos',
  execucao: 'GET /api/execucoes/:id',
  execucoes: 'GET /api/execucoes',
  respostas: 'GET /api/respostas',
  exportarTudo: 'GET /api/exportacao/respostas.csv',
  submeterResposta: 'POST /api/respostas',
} as const
