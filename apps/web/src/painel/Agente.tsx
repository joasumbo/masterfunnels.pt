import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CircleCheck, CircleX, LoaderCircle } from 'lucide-react'
import type { ResumoExecucao } from '@mf/shared/api'
import { api } from './api'
import { Cartao, Carregando, Erro, Etiqueta, Indicador, Vazio } from './ui'
import { dataHora, duracao, numero } from './tema'

const ESTADOS = {
  concluida: { rotulo: 'concluída', tom: 'jade' as const, Icone: CircleCheck },
  a_correr: { rotulo: 'a correr', tom: 'ouro' as const, Icone: LoaderCircle },
  falhou: { rotulo: 'falhou', tom: 'ferrugem' as const, Icone: CircleX },
}

export default function Agente() {
  const [lista, setLista] = useState<ResumoExecucao[] | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api
      .execucoes()
      .then(setLista)
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro'))
  }, [])

  if (erro) return <Erro mensagem={erro} />
  if (!lista) return <Carregando texto="A carregar execuções" />

  const concluidas = lista.filter((e) => e.estado === 'concluida')
  const tokens = lista.reduce((soma, e) => soma + e.tokensEntrada + e.tokensSaida, 0)
  const angulos = lista.reduce((soma, e) => soma + e.totalAngulos, 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Indicador valor={lista.length} rotulo="Execuções" nota="desde o primeiro teste" />
        <Indicador valor={concluidas.length} rotulo="Concluídas" tom="jade" />
        <Indicador valor={angulos} rotulo="Ângulos gerados" tom="ouro" />
        <Indicador valor={numero(tokens)} rotulo="Tokens consumidos" />
      </div>

      <Cartao
        titulo="O que este agente faz"
        nota="Não é um prompt único. Recebe um cluster e decide, iteração a iteração, que ferramenta chamar."
      >
        <div className="grid gap-4 text-sm leading-relaxed text-tinta-media md:grid-cols-2">
          <div>
            <p className="mb-2 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-tinta-fraca">
              Ferramentas que pode consultar
            </p>
            <ul className="space-y-1.5 font-mono text-xs">
              <li>panorama_do_cluster</li>
              <li>ler_respostas</li>
              <li>procurar_citacoes</li>
              <li>respostas_por_objecao</li>
              <li>verificar_citacao</li>
              <li>entregar_angulos</li>
            </ul>
          </div>
          <div>
            <p className="mb-2 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-tinta-fraca">
              Quando para
            </p>
            <p>
              Quando conseguir entregar cinco ângulos com objeções distintas e todas as citações
              verificadas como literais. A entrega é validada no servidor: se falhar, o motivo volta
              para o agente e ele continua a trabalhar, até dez iterações.
            </p>
          </div>
        </div>
      </Cartao>

      <Cartao titulo="Histórico de execuções" semPadding>
        {lista.length === 0 ? (
          <Vazio
            titulo="Ainda não houve execuções"
            nota="Abre um cluster e gera os primeiros ângulos."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-linha bg-papel/60">
                  {['Id', 'Cluster', 'Estado', 'Iterações', 'Ângulos', 'Duração', 'Tokens', ''].map(
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
                {lista.map((e) => {
                  const estado = ESTADOS[e.estado]
                  return (
                    <tr key={e.id} className="border-b border-linha/70 last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-tinta-media">
                        #{e.id}
                        <span className="ml-2 text-tinta-fraca">{dataHora(e.criadoEm)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-tinta">{e.clusterNome}</td>
                      <td className="px-4 py-3">
                        <Etiqueta tom={estado.tom}>
                          <estado.Icone
                            className={`h-3 w-3 ${e.estado === 'a_correr' ? 'animate-spin' : ''}`}
                          />
                          {estado.rotulo}
                        </Etiqueta>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-tinta-media">{e.iteracoes}</td>
                      <td className="px-4 py-3 font-mono text-xs text-tinta-media">
                        {e.totalAngulos}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-tinta-media">
                        {duracao(e.criadoEm, e.concluidoEm)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-tinta-fraca">
                        {numero(e.tokensEntrada)} / {numero(e.tokensSaida)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/painel/clusters/${e.clusterSlug}`}
                          className="inline-flex items-center gap-1 text-xs text-tinta-fraca transition-colors hover:text-ouro-escuro"
                        >
                          abrir
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>

    </div>
  )
}
