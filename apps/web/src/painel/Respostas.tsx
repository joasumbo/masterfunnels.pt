import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import {
  NIVEIS_CONSCIENCIA,
  ORIGENS,
  ROTULO_CONSCIENCIA,
  ROTULO_ORIGEM,
  type NivelConsciencia,
  type Origem,
} from '@mf/shared'
import type { ClassificacaoDTO, ListaRespostas, RespostaDTO } from '@mf/shared/api'
import { api } from './api'
import { Botao, Cartao, Carregando, CLASSE_CAMPO, Erro, Etiqueta, Vazio } from './ui'
import { CORES_CONSCIENCIA, dataHora, encurtar, haQuanto } from './tema'
import { Correccao } from './Correccao'

function Confianca({ valor }: { valor: number }) {
  const tom = valor >= 80 ? '#0f7a5a' : valor >= 60 ? '#b8891f' : '#b4522a'
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-10 overflow-hidden rounded-full bg-papel-fundo">
        <span className="block h-full rounded-full" style={{ width: `${valor}%`, background: tom }} />
      </span>
      <span className="font-mono text-xs" style={{ color: tom }}>
        {valor}
      </span>
    </span>
  )
}

function Gaveta({
  resposta,
  clusters,
  aoFechar,
  aoActualizar,
}: {
  resposta: RespostaDTO
  clusters: { slug: string; nome: string }[]
  aoFechar: () => void
  aoActualizar: (id: string, c: ClassificacaoDTO) => void
}) {
  const [aEditar, setAEditar] = useState(false)
  const c = resposta.classificacao
  const nomeCluster = clusters.find((x) => x.slug === c?.clusterDor)?.nome ?? c?.clusterDor

  useEffect(() => {
    function fechar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') aoFechar()
    }
    window.addEventListener('keydown', fechar)
    return () => window.removeEventListener('keydown', fechar)
  }, [aoFechar])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Fechar" onClick={aoFechar} className="absolute inset-0 bg-navio/40" />

      <aside className="entra-lado relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-linha bg-cartao">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-linha bg-cartao px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-tinta">{resposta.id}</span>
              <Etiqueta tom={resposta.fonte === 'landing' ? 'jade' : 'neutro'}>
                {resposta.fonte === 'landing' ? 'landing' : 'importada do CSV'}
              </Etiqueta>
            </div>
            <p className="mt-1 text-xs text-tinta-fraca">
              {dataHora(resposta.submetidoEm)} · {haQuanto(resposta.submetidoEm)}
            </p>
          </div>
          <button
            onClick={aoFechar}
            className="rounded-lg p-1.5 text-tinta-fraca transition-colors hover:bg-papel hover:text-tinta"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-6 px-6 py-6">
          {c?.citacao ? (
            <blockquote className="border-l-2 border-ouro bg-ouro/5 py-3 pl-4 font-serif text-lg leading-snug text-tinta">
              {c.citacao}
            </blockquote>
          ) : null}

          {c ? (
            <div className="flex flex-wrap items-center gap-2">
              <Etiqueta tom="ouro">{nomeCluster}</Etiqueta>
              <Etiqueta>{ROTULO_CONSCIENCIA[c.nivelConsciencia]}</Etiqueta>
              <Etiqueta>{c.objecaoPrincipal}</Etiqueta>
              {c.revistoPorHumano ? <Etiqueta tom="jade">revisto por uma pessoa</Etiqueta> : null}
              <span className="ml-auto">
                <Confianca valor={c.confianca} />
              </span>
            </div>
          ) : (
            <Etiqueta tom="ferrugem">ainda por classificar</Etiqueta>
          )}

          {aEditar && c ? (
            <Correccao
              resposta={resposta}
              clusters={clusters}
              aoCancelar={() => setAEditar(false)}
              aoGuardar={(nova) => {
                aoActualizar(resposta.id, nova)
                setAEditar(false)
              }}
            />
          ) : (
            <Botao onClick={() => setAEditar(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Corrigir classificação
            </Botao>
          )}

          <dl className="space-y-5 border-t border-linha pt-6">
            <div>
              <dt className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-tinta-fraca">
                Maior dificuldade
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-tinta">
                {resposta.r1Dificuldade}
              </dd>
            </div>
            <div>
              <dt className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-tinta-fraca">
                Já tentou
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-tinta-media">
                {resposta.r2JaTentou || <span className="text-tinta-fraca">sem resposta</span>}
              </dd>
            </div>
            <div>
              <dt className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-tinta-fraca">
                O que o faria avançar
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-tinta-media">
                {resposta.r3OQueFariaComprar || (
                  <span className="text-tinta-fraca">sem resposta</span>
                )}
              </dd>
            </div>
          </dl>

          <div className="grid grid-cols-2 gap-4 border-t border-linha pt-6 text-sm sm:grid-cols-4">
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.1em] text-tinta-fraca">Idade</p>
              <p className="mt-1 font-mono text-tinta">{resposta.idade ?? '—'}</p>
            </div>
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.1em] text-tinta-fraca">Rendimento</p>
              <p className="mt-1 text-tinta">{resposta.rendimento ?? '—'}</p>
            </div>
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.1em] text-tinta-fraca">
                Já investiu
              </p>
              <p className="mt-1 text-tinta">{resposta.jaInvestiu ?? '—'}</p>
            </div>
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.1em] text-tinta-fraca">Origem</p>
              <p className="mt-1 text-tinta">{ROTULO_ORIGEM[resposta.origem] ?? resposta.origem}</p>
            </div>
          </div>

          {c ? (
            <p className="border-t border-linha pt-4 font-mono text-[0.7rem] text-tinta-fraca">
              classificada por {c.modelo}
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  )
}

export default function Respostas({ clusters }: { clusters: { slug: string; nome: string }[] }) {
  const [parametros, setParametros] = useSearchParams()
  const [lista, setLista] = useState<ListaRespostas | null>(null)
  const [erro, setErro] = useState('')
  const [aCarregar, setACarregar] = useState(true)
  const [aberta, setAberta] = useState<string | null>(null)
  const [texto, setTexto] = useState(parametros.get('q') ?? '')

  const chave = parametros.toString()

  const filtros = useMemo(() => {
    const p = new URLSearchParams(chave)
    return {
      q: p.get('q') ?? '',
      cluster: p.get('cluster') ?? '',
      nivel: p.get('nivel') ?? '',
      origem: p.get('origem') ?? '',
      fonte: p.get('fonte') ?? '',
      duvidosas: p.get('duvidosas') ?? '',
      ordem: p.get('ordem') ?? 'recentes',
      pagina: Number(p.get('pagina') ?? 1),
    }
  }, [chave])

  useEffect(() => {
    const relogio = window.setTimeout(() => {
      if (texto === filtros.q) return
      const seguintes = new URLSearchParams(chave)
      if (texto === '') seguintes.delete('q')
      else seguintes.set('q', texto)
      seguintes.delete('pagina')
      setParametros(seguintes, { replace: true })
    }, 320)
    return () => window.clearTimeout(relogio)
  }, [texto, filtros.q, chave, setParametros])

  useEffect(() => {
    let vivo = true
    setACarregar(true)
    api
      .respostas({
        q: filtros.q || undefined,
        cluster: filtros.cluster || undefined,
        nivel: filtros.nivel || undefined,
        origem: filtros.origem || undefined,
        fonte: filtros.fonte || undefined,
        duvidosas: filtros.duvidosas === 'sim' ? 'sim' : undefined,
        ordem: filtros.ordem as 'recentes',
        pagina: filtros.pagina,
        porPagina: 25,
      })
      .then((dados) => vivo && setLista(dados))
      .catch((e) => vivo && setErro(e instanceof Error ? e.message : 'Erro'))
      .finally(() => vivo && setACarregar(false))
    return () => {
      vivo = false
    }
  }, [filtros])

  function definir(campo: string, valor: string) {
    const seguintes = new URLSearchParams(chave)
    if (valor === '') seguintes.delete(campo)
    else seguintes.set(campo, valor)
    if (campo !== 'pagina') seguintes.delete('pagina')
    setParametros(seguintes, { replace: true })
  }

  function limpar() {
    setTexto('')
    setParametros(new URLSearchParams(), { replace: true })
  }

  function actualizar(id: string, nova: ClassificacaoDTO) {
    setLista((anterior) =>
      anterior
        ? {
            ...anterior,
            respostas: anterior.respostas.map((r) =>
              r.id === id ? { ...r, classificacao: nova } : r,
            ),
          }
        : anterior,
    )
  }

  const activos = ['q', 'cluster', 'nivel', 'origem', 'fonte', 'duvidosas'].filter((c) =>
    parametros.get(c),
  ).length

  const paginas = lista ? Math.max(1, Math.ceil(lista.total / lista.porPagina)) : 1
  const seleccionada = lista?.respostas.find((r) => r.id === aberta) ?? null

  return (
    <div className="space-y-5">
      <Cartao semPadding>
        <div className="flex flex-wrap items-end gap-3 p-4">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-tinta-fraca" />
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Procurar no texto das respostas, no id ou na objeção"
              className={`${CLASSE_CAMPO} pl-9`}
            />
          </div>

          <select
            value={filtros.cluster}
            onChange={(e) => definir('cluster', e.target.value)}
            className={`${CLASSE_CAMPO} w-auto cursor-pointer`}
          >
            <option value="">Todos os clusters</option>
            {clusters.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nome}
              </option>
            ))}
          </select>

          <select
            value={filtros.nivel}
            onChange={(e) => definir('nivel', e.target.value)}
            className={`${CLASSE_CAMPO} w-auto cursor-pointer`}
          >
            <option value="">Toda a consciência</option>
            {NIVEIS_CONSCIENCIA.map((n) => (
              <option key={n} value={n}>
                {ROTULO_CONSCIENCIA[n]}
              </option>
            ))}
          </select>

          <select
            value={filtros.origem}
            onChange={(e) => definir('origem', e.target.value)}
            className={`${CLASSE_CAMPO} w-auto cursor-pointer`}
          >
            <option value="">Todas as origens</option>
            {ORIGENS.map((o) => (
              <option key={o} value={o}>
                {ROTULO_ORIGEM[o as Origem]}
              </option>
            ))}
          </select>

          <select
            value={filtros.ordem}
            onChange={(e) => definir('ordem', e.target.value)}
            className={`${CLASSE_CAMPO} w-auto cursor-pointer`}
          >
            <option value="recentes">Mais recentes</option>
            <option value="antigas">Mais antigas</option>
            <option value="confianca">Menor confiança</option>
            <option value="identificador">Por identificador</option>
          </select>

          <Botao
            tom={filtros.duvidosas === 'sim' ? 'ouro' : 'contorno'}
            onClick={() => definir('duvidosas', filtros.duvidosas === 'sim' ? '' : 'sim')}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Só as duvidosas
          </Botao>

          {activos > 0 ? (
            <Botao tom="fantasma" onClick={limpar}>
              <RotateCcw className="h-3.5 w-3.5" />
              Limpar
            </Botao>
          ) : null}
        </div>

        <div className="border-t border-linha">
          {erro ? (
            <div className="p-5">
              <Erro mensagem={erro} />
            </div>
          ) : aCarregar && !lista ? (
            <div className="px-5">
              <Carregando texto="A carregar respostas" />
            </div>
          ) : lista && lista.respostas.length === 0 ? (
            <Vazio
              titulo="Nenhuma resposta com estes filtros"
              nota="Experimenta alargar a procura ou limpar os filtros."
              accao={
                <Botao onClick={limpar}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Limpar filtros
                </Botao>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-linha bg-papel/60">
                    {['Id', 'Recebida', 'Dor', 'Consciência', 'Objeção', 'Confiança', ''].map(
                      (coluna) => (
                        <th
                          key={coluna}
                          className="px-4 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.1em] text-tinta-fraca"
                        >
                          {coluna}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {lista?.respostas.map((r) => {
                    const c = r.classificacao
                    const nome = clusters.find((x) => x.slug === c?.clusterDor)?.nome
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setAberta(r.id)}
                        className="cursor-pointer border-b border-linha/70 transition-colors last:border-0 hover:bg-papel"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-tinta-media">{r.id}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap text-tinta-fraca">
                          {dataHora(r.submetidoEm)}
                        </td>
                        <td className="px-4 py-3 text-sm text-tinta">
                          {nome ?? <span className="text-tinta-fraca">por classificar</span>}
                        </td>
                        <td className="px-4 py-3">
                          {c ? (
                            <span className="flex items-center gap-2 text-xs text-tinta-media">
                              <span
                                className="h-2 w-2 shrink-0 rounded-sm"
                                style={{ background: CORES_CONSCIENCIA[c.nivelConsciencia] }}
                              />
                              {ROTULO_CONSCIENCIA[c.nivelConsciencia as NivelConsciencia]}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-tinta-media">
                          {c ? encurtar(c.objecaoPrincipal, 30) : '—'}
                        </td>
                        <td className="px-4 py-3">{c ? <Confianca valor={c.confianca} /> : '—'}</td>
                        <td className="px-4 py-3 text-right">
                          {c?.revistoPorHumano ? <Etiqueta tom="jade">revisto</Etiqueta> : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {lista && lista.respostas.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-linha px-4 py-3">
            <p className="text-xs text-tinta-fraca">
              {lista.total} respostas · página {lista.pagina} de {paginas}
            </p>
            <div className="flex gap-2">
              <Botao
                pequeno
                disabled={filtros.pagina <= 1}
                onClick={() => definir('pagina', String(filtros.pagina - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </Botao>
              <Botao
                pequeno
                disabled={filtros.pagina >= paginas}
                onClick={() => definir('pagina', String(filtros.pagina + 1))}
              >
                Seguinte
                <ChevronRight className="h-3.5 w-3.5" />
              </Botao>
            </div>
          </div>
        ) : null}
      </Cartao>

      {seleccionada ? (
        <Gaveta
          resposta={seleccionada}
          clusters={clusters}
          aoFechar={() => setAberta(null)}
          aoActualizar={actualizar}
        />
      ) : null}
    </div>
  )
}
