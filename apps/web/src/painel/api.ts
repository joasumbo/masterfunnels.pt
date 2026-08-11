import type {
  ClassificacaoDTO,
  DetalheCluster,
  ExecucaoDTO,
  FiltrosRespostas,
  ListaRespostas,
  Resumo,
  ResumoExecucao,
  Utilizador,
} from '@mf/shared/api'

import { BASE_API as BASE } from '../base'

async function pedir<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const resposta = await fetch(`${BASE}/api${caminho}`, {
    ...opcoes,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(opcoes.headers ?? {}) },
  })

  if (resposta.status === 401) throw new NaoAutenticado()

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}))
    throw new Error(corpo.erro ?? corpo.message ?? `Erro ${resposta.status}`)
  }

  return resposta.json() as Promise<T>
}

function comFiltros(filtros: FiltrosRespostas) {
  const parametros = new URLSearchParams()
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor === undefined || valor === '' || valor === null) continue
    parametros.set(chave, String(valor))
  }
  const texto = parametros.toString()
  return texto === '' ? '' : `?${texto}`
}

export class NaoAutenticado extends Error {
  constructor() {
    super('Sessão expirada')
  }
}

export const api = {
  eu: () => pedir<{ utilizador: Utilizador }>('/auth/eu'),
  entrar: (email: string, palavraPasse: string) =>
    pedir<{ utilizador: Utilizador }>('/auth/entrar', {
      method: 'POST',
      body: JSON.stringify({ email, palavraPasse }),
    }),
  sair: () => pedir<unknown>('/auth/sair', { method: 'POST' }),
  resumo: () => pedir<Resumo>('/resumo'),
  respostas: (filtros: FiltrosRespostas) =>
    pedir<ListaRespostas>(`/respostas${comFiltros(filtros)}`),
  cluster: (slug: string) => pedir<DetalheCluster>(`/clusters/${slug}`),
  angulos: (slug: string) => pedir<ExecucaoDTO | null>(`/clusters/${slug}/angulos`),
  gerarAngulos: (slug: string) =>
    pedir<{ execucaoId: number }>(`/clusters/${slug}/angulos`, { method: 'POST' }),
  execucoes: () => pedir<ResumoExecucao[]>('/execucoes'),
  execucao: (id: number) => pedir<ExecucaoDTO>(`/execucoes/${id}`),
  corrigir: (respostaId: string, campos: Partial<ClassificacaoDTO>) =>
    pedir<ClassificacaoDTO>(`/classificacoes/${respostaId}`, {
      method: 'PATCH',
      body: JSON.stringify(campos),
    }),
  urlCitacoes: (slug: string) => `${BASE}/api/clusters/${slug}/citacoes.csv`,
  urlExportacaoTotal: () => `${BASE}/api/exportacao/respostas.csv`,
}
