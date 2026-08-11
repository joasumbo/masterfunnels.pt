import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowUpRight, CircleCheck, MessagesSquare, ShieldQuestion, Sparkles } from 'lucide-react'
import { ROTULO_CONSCIENCIA, type NivelConsciencia } from '@mf/shared'
import type { CelulaCruzamento, Resumo } from '@mf/shared/api'
import { Cartao, Etiqueta, Indicador } from './ui'
import { CORES_CONSCIENCIA, corDoCluster, encurtar } from './tema'

type Fatia = { name?: string; completo?: string }

function Dica({ active, payload }: { active?: boolean; payload?: unknown[] }) {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0] as { value?: number; name?: string; payload?: Fatia }
  const nome = item.payload?.completo ?? item.payload?.name ?? item.name ?? ''

  return (
    <div className="rounded-lg border border-linha bg-cartao px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-tinta">{nome}</p>
      <p className="mt-0.5 font-mono text-tinta-fraca">{item.value} respostas</p>
    </div>
  )
}

function Mapa({
  celulas,
  clusters,
  ordemCategorias,
  rotulos,
}: {
  celulas: CelulaCruzamento[]
  clusters: { slug: string; nome: string }[]
  ordemCategorias?: string[]
  rotulos?: Record<string, string>
}) {
  const presentes = [...new Set(celulas.map((c) => c.categoria))]
  const categorias = ordemCategorias
    ? ordemCategorias.filter((c) => presentes.includes(c))
    : presentes
  const maximo = Math.max(1, ...celulas.map((c) => c.total))

  const valor = (cluster: string, categoria: string) =>
    celulas.find((c) => c.cluster === cluster && c.categoria === categoria)?.total ?? 0

  const colunas = `minmax(9.5rem, 1.3fr) repeat(${categorias.length}, minmax(4.5rem, 1fr))`

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: `${11 + categorias.length * 5.5}rem` }}>
        <div className="grid items-end gap-1 pb-2" style={{ gridTemplateColumns: colunas }}>
          <span />
          {categorias.map((c) => (
            <span
              key={c}
              className="px-1 text-center text-[0.68rem] leading-tight text-tinta-fraca"
            >
              {rotulos?.[c] ?? c}
            </span>
          ))}
        </div>

        <div className="space-y-1">
          {clusters.map((cl) => (
            <div key={cl.slug} className="grid items-center gap-1" style={{ gridTemplateColumns: colunas }}>
              <span className="truncate pr-3 text-sm text-tinta" title={cl.nome}>
                {cl.nome}
              </span>
              {categorias.map((cat) => {
                const n = valor(cl.slug, cat)
                const intensidade = n === 0 ? 0 : 0.12 + (n / maximo) * 0.68
                return (
                  <div
                    key={cat}
                    className="flex h-9 items-center justify-center rounded-md font-mono text-xs transition-colors"
                    style={{
                      background: n ? `rgba(184, 137, 31, ${intensidade})` : '#f4f3ef',
                      color: n && intensidade > 0.5 ? '#ffffff' : n ? '#16151a' : '#cfcac0',
                    }}
                  >
                    {n || '·'}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function VisaoGeral({ resumo }: { resumo: Resumo }) {
  const navegar = useNavigate()
  const clustersSimples = resumo.clusters.map((c) => ({ slug: c.slug, nome: c.nome }))

  const dadosDonut = resumo.clusters.map((c, i) => ({
    name: c.nome,
    value: c.total,
    slug: c.slug,
    cor: corDoCluster(i),
    percentagem: c.percentagem,
  }))

  const dadosConsciencia = resumo.consciencia.map((n) => ({
    name: n.rotulo,
    value: n.total,
    cor: CORES_CONSCIENCIA[n.chave] ?? '#7a6a5c',
  }))

  const dadosObjecoes = resumo.objecoes.slice(0, 10).map((o, i) => ({
    name: encurtar(o.rotulo, 26),
    completo: o.rotulo,
    value: o.total,
    cor: corDoCluster(i + 2),
  }))

  const dominante = resumo.clusters[0]
  const objeccaoTopo = resumo.objecoes[0]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Indicador
          valor={resumo.totalRespostas}
          rotulo="Respostas"
          nota="importadas do CSV e recebidas na landing"
          Icone={MessagesSquare}
        />
        <Indicador
          valor={resumo.totalClassificadas}
          rotulo="Classificadas"
          nota={`${resumo.totalRespostas - resumo.totalClassificadas} por classificar`}
          Icone={Sparkles}
          tom="ouro"
        />
        <Indicador
          valor={resumo.confiancaMedia}
          rotulo="Confiança média"
          nota="numa escala de 0 a 100"
          Icone={CircleCheck}
          tom="jade"
        />
        <Indicador
          valor={resumo.porRever}
          rotulo="A precisar de revisão"
          nota="abaixo de 60 de confiança"
          Icone={ShieldQuestion}
          tom="ferrugem"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <Cartao
          titulo="Distribuição das dores"
          nota="Peso de cada cluster no total classificado. Clica para abrir."
          className="xl:col-span-3"
        >
          <div className="flex flex-col items-center gap-6 lg:flex-row">
            <div className="relative h-56 w-56 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosDonut}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={1.5}
                    stroke="#ffffff"
                    strokeWidth={2}
                    onClick={(fatia) => {
                      const slug = (fatia as unknown as { slug?: string }).slug
                      if (slug) navegar(`/painel/clusters/${slug}`)
                    }}
                  >
                    {dadosDonut.map((d) => (
                      <Cell key={d.slug} fill={d.cor} className="cursor-pointer outline-none" />
                    ))}
                  </Pie>
                  <Tooltip content={<Dica />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-2xl text-tinta">{resumo.clusters.length}</span>
                <span className="text-[0.68rem] uppercase tracking-[0.12em] text-tinta-fraca">
                  clusters
                </span>
              </div>
            </div>

            <ul className="w-full flex-1 space-y-0.5">
              {dadosDonut.map((d) => (
                <li key={d.slug}>
                  <button
                    onClick={() => navegar(`/painel/clusters/${d.slug}`)}
                    className="group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-papel"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ background: d.cor }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-tinta">{d.name}</span>
                    <span className="shrink-0 font-mono text-xs text-tinta-fraca">
                      {d.value} · {d.percentagem}%
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-linha-forte transition-colors group-hover:text-ouro-escuro" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Cartao>

        <Cartao
          titulo="Estado de consciência"
          nota="Escala de Schwartz aplicada ao texto livre."
          className="xl:col-span-2"
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosConsciencia} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#86828f' }}
                  tickFormatter={(v: string) => v.replace('Consciente ', '')}
                  axisLine={{ stroke: '#e4e1d9' }}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#86828f' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<Dica />} cursor={{ fill: 'rgba(22,21,26,0.04)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={54}>
                  {dadosConsciencia.map((d) => (
                    <Cell key={d.name} fill={d.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-1 border-t border-linha pt-4">
            {resumo.consciencia.map((n) => (
              <div key={n.chave} className="flex items-center justify-between gap-3 text-xs">
                <span className="flex items-center gap-2 text-tinta-media">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ background: CORES_CONSCIENCIA[n.chave] }}
                  />
                  {n.rotulo}
                </span>
                <span className="font-mono text-tinta-fraca">
                  {n.total} · {n.percentagem}%
                </span>
              </div>
            ))}
          </div>
        </Cartao>
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <Cartao
          titulo="Objeções mais repetidas"
          nota="As dez com mais peso entre as 112 respostas."
          className="xl:col-span-3"
        >
          <div className="h-[19rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dadosObjecoes}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={148}
                  tick={{ fontSize: 11, fill: '#55525e' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<Dica />} cursor={{ fill: 'rgba(22,21,26,0.04)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {dadosObjecoes.map((d) => (
                    <Cell key={d.completo} fill={d.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Cartao>

        <Cartao titulo="O que o conjunto está a dizer" className="xl:col-span-2">
          <div className="space-y-5 text-sm leading-relaxed text-tinta-media">
            <div>
              <Etiqueta tom="ouro">dor dominante</Etiqueta>
              <p className="mt-2.5">
                <span className="font-medium text-tinta">{dominante?.nome}</span> leva{' '}
                <span className="font-mono">{dominante?.percentagem}%</span> das respostas
                classificadas. É por aqui que um funil novo deve entrar.
              </p>
            </div>

            <div className="border-t border-linha pt-5">
              <Etiqueta tom="ferrugem">travão principal</Etiqueta>
              <p className="mt-2.5">
                <span className="font-medium text-tinta">{objeccaoTopo?.rotulo}</span> aparece em{' '}
                <span className="font-mono">{objeccaoTopo?.total}</span> respostas. Qualquer criativo
                que não a responda perde essa fatia.
              </p>
            </div>

            <div className="border-t border-linha pt-5">
              <Etiqueta tom="jade">onde há sinal</Etiqueta>
              <p className="mt-2.5">
                {resumo.consciencia.find((n) => n.chave === 'consciente_da_solucao')?.percentagem ??
                  0}
                % já está consciente da solução. Não precisam de ser educados sobre o problema,
                precisam de prova.
              </p>
            </div>
          </div>
        </Cartao>
      </div>

      <Cartao
        titulo="Dor contra estado de consciência"
        nota="O cruzamento com sinal real: as duas dimensões saem do texto que a pessoa escreveu."
      >
        <Mapa
          celulas={resumo.cruzamentoConsciencia}
          clusters={clustersSimples}
          ordemCategorias={Object.keys(ROTULO_CONSCIENCIA)}
          rotulos={Object.fromEntries(
            Object.entries(ROTULO_CONSCIENCIA).map(([k, v]) => [
              k,
              v.replace('Consciente ', '').replace('do ', '').replace('da ', ''),
            ]),
          ) as Record<NivelConsciencia, string>}
        />
      </Cartao>

      <Cartao
        titulo="Dor contra faixa de rendimento"
        nota="Mantido como referência, mas ler com reservas — ver a nota em baixo."
      >
        <Mapa celulas={resumo.cruzamentoRendimento} clusters={clustersSimples} />
        <p className="mt-5 border-t border-linha pt-4 text-xs leading-relaxed text-tinta-fraca">
          Neste conjunto de dados os campos de perfil foram atribuídos de forma aleatória e
          contradizem o texto livre — encontrámos 16 respostas em que a idade declarada não bate
          certo com o que a pessoa escreve. Este cruzamento fica como referência, mas o que tem
          sinal real é o de cima, porque tanto a dor como o estado de consciência saem do texto.
        </p>
      </Cartao>
    </div>
  )
}
