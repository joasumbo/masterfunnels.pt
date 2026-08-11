import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { Resumo } from '@mf/shared/api'
import { Cartao } from './ui'
import { corDoCluster } from './tema'

export default function Clusters({ resumo }: { resumo: Resumo }) {
  return (
    <div className="space-y-5">
      <Cartao
        titulo="Dez clusters de dor"
        nota="Saíram dos 33 textos distintos da primeira pergunta, não de uma lista escrita à mão. Duas respostas ficam no mesmo cluster se o mesmo anúncio as convencesse."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {resumo.clusters.map((c, i) => (
            <Link
              key={c.slug}
              to={`/painel/clusters/${c.slug}`}
              className="group rounded-xl border border-linha bg-papel/40 p-4 transition-colors hover:border-ouro/50 hover:bg-ouro/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: corDoCluster(i) }}
                  />
                  <h3 className="truncate text-sm font-medium text-tinta">{c.nome}</h3>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-linha-forte transition-colors group-hover:text-ouro-escuro" />
              </div>

              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-tinta-fraca">
                {c.descricao}
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-papel-fundo">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.percentagem}%`, background: corDoCluster(i) }}
                  />
                </div>
                <span className="shrink-0 font-mono text-xs text-tinta-media">
                  {c.total} · {c.percentagem}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Cartao>
    </div>
  )
}
