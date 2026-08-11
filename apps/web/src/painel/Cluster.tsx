import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Pencil, Quote, Sparkles, Wrench } from 'lucide-react'
import { ROTULO_CONSCIENCIA, ROTULO_ORIGEM } from '@mf/shared'
import type { ClassificacaoDTO, DetalheCluster, ExecucaoDTO, RespostaDTO } from '@mf/shared/api'
import { api } from './api'
import { Botao, Cartao, Carregando, Erro, Etiqueta, Ligacao, Vazio } from './ui'
import { dataHora, duracao } from './tema'
import { Correccao } from './Correccao'

function CartaoResposta({
  resposta,
  clusters,
  aoActualizar,
}: {
  resposta: RespostaDTO
  clusters: { slug: string; nome: string }[]
  aoActualizar: (id: string, c: ClassificacaoDTO) => void
}) {
  const [aEditar, setAEditar] = useState(false)
  const c = resposta.classificacao
  if (!c) return null

  const duvidosa = c.confianca < 60

  return (
    <article className="rounded-xl border border-linha bg-cartao p-5 shadow-[0_1px_2px_rgba(22,21,26,0.04)]">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-tinta-fraca">{resposta.id}</span>
        <Etiqueta>{ROTULO_CONSCIENCIA[c.nivelConsciencia]}</Etiqueta>
        <Etiqueta>{c.objecaoPrincipal}</Etiqueta>
        <Etiqueta tom={duvidosa ? 'ferrugem' : 'neutro'} mono>
          confiança {c.confianca}
        </Etiqueta>
        {c.revistoPorHumano ? <Etiqueta tom="jade">revisto por uma pessoa</Etiqueta> : null}
        <button
          onClick={() => setAEditar(!aEditar)}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-tinta-fraca transition-colors hover:bg-papel hover:text-tinta"
        >
          <Pencil className="h-3.5 w-3.5" />
          Corrigir
        </button>
      </header>

      {c.citacao ? (
        <blockquote className="mb-5 flex gap-3 rounded-lg border-l-2 border-ouro bg-ouro/5 py-3 pr-4 pl-4">
          <Quote className="mt-1 h-4 w-4 shrink-0 text-ouro-escuro" aria-hidden="true" />
          <p className="font-serif text-lg leading-snug text-tinta">{c.citacao}</p>
        </blockquote>
      ) : (
        <p className="mb-5 text-xs text-tinta-fraca">
          Sem citação — o excerto proposto não era literal e foi recusado na verificação.
        </p>
      )}

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-[0.7rem] uppercase tracking-[0.1em] text-tinta-fraca">
            Maior dificuldade
          </dt>
          <dd className="mt-1 leading-relaxed text-tinta-media">{resposta.r1Dificuldade}</dd>
        </div>
        {resposta.r2JaTentou ? (
          <div>
            <dt className="text-[0.7rem] uppercase tracking-[0.1em] text-tinta-fraca">Já tentou</dt>
            <dd className="mt-1 leading-relaxed text-tinta-media">{resposta.r2JaTentou}</dd>
          </div>
        ) : null}
        {resposta.r3OQueFariaComprar ? (
          <div>
            <dt className="text-[0.7rem] uppercase tracking-[0.1em] text-tinta-fraca">
              O que o faria avançar
            </dt>
            <dd className="mt-1 leading-relaxed text-tinta-media">
              {resposta.r3OQueFariaComprar}
            </dd>
          </div>
        ) : null}
      </dl>

      <footer className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-linha pt-3 font-mono text-[0.7rem] text-tinta-fraca">
        <span>{resposta.idade ?? '—'} anos</span>
        <span>{resposta.rendimento ?? 'sem resposta'}</span>
        <span>já investiu: {resposta.jaInvestiu ?? '—'}</span>
        <span>{ROTULO_ORIGEM[resposta.origem] ?? resposta.origem}</span>
        <span>{dataHora(resposta.submetidoEm)}</span>
      </footer>

      {aEditar ? (
        <div className="mt-4">
          <Correccao
            resposta={resposta}
            clusters={clusters}
            aoCancelar={() => setAEditar(false)}
            aoGuardar={(nova) => {
              aoActualizar(resposta.id, nova)
              setAEditar(false)
            }}
          />
        </div>
      ) : null}
    </article>
  )
}

export function Angulos({ slug }: { slug: string }) {
  const [execucao, setExecucao] = useState<ExecucaoDTO | null>(null)
  const [aCarregar, setACarregar] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    setACarregar(true)
    api
      .angulos(slug)
      .then(setExecucao)
      .catch((e) => setErro(e.message))
      .finally(() => setACarregar(false))
  }, [slug])

  useEffect(() => {
    if (execucao?.estado !== 'a_correr') return
    const relogio = setInterval(() => {
      api
        .execucao(execucao.id)
        .then(setExecucao)
        .catch(() => {})
    }, 2000)
    return () => clearInterval(relogio)
  }, [execucao])

  async function gerar() {
    setErro('')
    try {
      const { execucaoId } = await api.gerarAngulos(slug)
      setExecucao(await api.execucao(execucaoId))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível iniciar')
    }
  }

  if (aCarregar) return <Carregando texto="A procurar ângulos" />

  if (!execucao) {
    return (
      <Cartao>
        {erro ? <Erro mensagem={erro} /> : null}
        <Vazio
          titulo="Ainda não há ângulos para este cluster"
          nota="O agente vai consultar o panorama, ler respostas, procurar e verificar citações antes de entregar cinco ângulos."
          accao={
            <Botao tom="ouro" onClick={gerar}>
              <Sparkles className="h-3.5 w-3.5" />
              Gerar ângulos
            </Botao>
          }
        />
      </Cartao>
    )
  }

  const aCorrer = execucao.estado === 'a_correr'

  return (
    <div className="space-y-5">
      <Cartao
        titulo="Como o agente chegou aqui"
        nota={
          aCorrer
            ? 'A consultar os dados neste momento.'
            : `${execucao.iteracoes} iterações · ${execucao.modelo} · ${duracao(execucao.criadoEm, execucao.concluidoEm)} · ${execucao.tokensEntrada + execucao.tokensSaida} tokens`
        }
        accao={
          aCorrer ? null : (
            <Botao pequeno onClick={gerar}>
              <Sparkles className="h-3.5 w-3.5" />
              Gerar de novo
            </Botao>
          )
        }
      >
        {execucao.trace.length > 0 ? (
          <ol className="space-y-2.5">
            {execucao.trace.map((passo, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-papel font-mono text-[0.68rem] text-tinta-fraca">
                  {passo.iteracao}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="flex items-center gap-1.5 font-mono text-xs text-ouro-escuro">
                      <Wrench className="h-3 w-3" />
                      {passo.ferramenta}
                    </span>
                    <span className="font-mono text-[0.68rem] text-tinta-fraca">{passo.ms} ms</span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-tinta-media">
                    {passo.resumoResultado}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : null}

        {aCorrer ? <Carregando texto="A trabalhar" /> : null}
        {execucao.erro ? (
          <div className="mt-4">
            <Erro mensagem={execucao.erro} />
          </div>
        ) : null}

        {execucao.criterioParagem ? (
          <div className="mt-5 rounded-lg border border-linha bg-papel/60 p-4">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.1em] text-tinta-fraca">
              Critério de paragem
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-tinta-media">
              {execucao.criterioParagem}
            </p>
          </div>
        ) : null}
      </Cartao>

      <div className="grid gap-4 2xl:grid-cols-2">
        {execucao.angulos.map((a) => (
          <article
            key={a.posicao}
            className="rounded-xl border border-linha bg-cartao p-5 shadow-[0_1px_2px_rgba(22,21,26,0.04)]"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="font-mono text-xs text-tinta-fraca">
                {String(a.posicao).padStart(2, '0')}
              </span>
              <Etiqueta tom="ferrugem">derruba: {a.objecaoQueDerruba}</Etiqueta>
            </div>

            <h3 className="mb-4 font-serif text-xl leading-snug text-tinta">{a.gancho}</h3>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[0.7rem] uppercase tracking-[0.1em] text-tinta-fraca">
                  Promessa
                </dt>
                <dd className="mt-1 leading-relaxed text-tinta-media">{a.promessa}</dd>
              </div>
              <div>
                <dt className="text-[0.7rem] uppercase tracking-[0.1em] text-tinta-fraca">Prova</dt>
                <dd className="mt-1 leading-relaxed text-tinta-media">{a.prova}</dd>
              </div>
            </dl>

            <div className="mt-4 space-y-2 border-t border-linha pt-4">
              <p className="text-[0.7rem] uppercase tracking-[0.1em] text-tinta-fraca">
                Ancorado em
              </p>
              {a.citacoes.map((c, i) => (
                <div key={i} className="flex gap-2 text-xs leading-relaxed">
                  <span className="shrink-0 font-mono text-tinta-fraca">{c.resposta_id}</span>
                  <span className="text-tinta-media italic">{c.texto}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default function Cluster({
  clusters,
  aoMudar,
}: {
  clusters: { slug: string; nome: string }[]
  aoMudar: () => void
}) {
  const { slug = '' } = useParams()
  const [detalhe, setDetalhe] = useState<DetalheCluster | null>(null)
  const [erro, setErro] = useState('')
  const [aba, setAba] = useState<'respostas' | 'angulos'>('respostas')

  useEffect(() => {
    setDetalhe(null)
    setErro('')
    setAba('respostas')
    api
      .cluster(slug)
      .then(setDetalhe)
      .catch((e) => setErro(e.message))
  }, [slug])

  function actualizar(id: string, nova: ClassificacaoDTO) {
    setDetalhe((d) =>
      d
        ? { ...d, respostas: d.respostas.map((r) => (r.id === id ? { ...r, classificacao: nova } : r)) }
        : d,
    )
    aoMudar()
  }

  if (erro) return <Erro mensagem={erro} />
  if (!detalhe) return <Carregando />

  return (
    <div className="space-y-5">
      <Link
        to="/painel/clusters"
        className="inline-flex items-center gap-2 text-sm text-tinta-fraca transition-colors hover:text-tinta"
      >
        <ArrowLeft className="h-4 w-4" />
        Todos os clusters
      </Link>

      <Cartao>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-2xl">
            <h2 className="font-serif text-2xl text-tinta">{detalhe.cluster.nome}</h2>
            <p className="mt-2 text-sm leading-relaxed text-tinta-media">
              {detalhe.cluster.descricao}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Etiqueta tom="ouro" mono>
                {detalhe.cluster.total} respostas
              </Etiqueta>
              <Etiqueta mono>{detalhe.cluster.percentagem}% do total</Etiqueta>
            </div>
          </div>
          <Ligacao href={api.urlCitacoes(slug)}>
            <Download className="h-3.5 w-3.5" />
            Exportar citações
          </Ligacao>
        </div>
      </Cartao>

      <div className="flex gap-1 border-b border-linha">
        {(['respostas', 'angulos'] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm transition-colors ${
              aba === a
                ? 'border-ouro font-medium text-tinta'
                : 'border-transparent text-tinta-fraca hover:text-tinta'
            }`}
          >
            {a === 'respostas' ? `Respostas (${detalhe.respostas.length})` : 'Ângulos de anúncio'}
          </button>
        ))}
      </div>

      {aba === 'respostas' ? (
        <div className="space-y-4">
          <p className="text-xs text-tinta-fraca">
            Ordenadas da menor confiança para a maior, para o que o modelo provavelmente errou
            aparecer primeiro.
          </p>
          {detalhe.respostas.map((r) => (
            <CartaoResposta key={r.id} resposta={r} clusters={clusters} aoActualizar={actualizar} />
          ))}
        </div>
      ) : (
        <Angulos slug={slug} />
      )}
    </div>
  )
}
