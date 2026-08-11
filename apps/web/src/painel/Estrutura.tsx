import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BotMessageSquare,
  ChartPie,
  Download,
  LayoutGrid,
  LogOut,
  Menu,
  MessagesSquare,
  X,
} from 'lucide-react'
import type { Utilizador } from '@mf/shared/api'
import { api } from './api'

const SECCOES = [
  { para: '/painel', rotulo: 'Visão geral', Icone: ChartPie, exacto: true },
  { para: '/painel/respostas', rotulo: 'Respostas', Icone: MessagesSquare, exacto: false },
  { para: '/painel/clusters', rotulo: 'Clusters de dor', Icone: LayoutGrid, exacto: false },
  { para: '/painel/agente', rotulo: 'Agente de ângulos', Icone: BotMessageSquare, exacto: false },
]

function Navegacao({ aoNavegar }: { aoNavegar?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {SECCOES.map(({ para, rotulo, Icone, exacto }) => (
        <NavLink
          key={para}
          to={para}
          end={exacto}
          onClick={aoNavegar}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              isActive
                ? 'bg-ouro/12 font-medium text-ouro'
                : 'text-texto-fraco hover:bg-white/5 hover:text-texto'
            }`
          }
        >
          <Icone className="h-4 w-4 shrink-0" aria-hidden="true" />
          {rotulo}
        </NavLink>
      ))}
    </nav>
  )
}

function Interior({
  utilizador,
  aoSair,
  aoNavegar,
}: {
  utilizador: Utilizador
  aoSair: () => void
  aoNavegar?: () => void
}) {
  return (
    <div className="flex h-full flex-col bg-navio px-4 py-5">
      <div className="px-2 pb-7">
        <img src="/marca/logo-wordmark-light.svg" alt="Master Funnels" className="h-11 w-auto" />
        <p className="mt-3.5 text-[0.68rem] uppercase tracking-[0.16em] text-texto-subtil">
          Painel da pesquisa
        </p>
      </div>

      <Navegacao aoNavegar={aoNavegar} />

      <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
        <a
          href={api.urlExportacaoTotal()}
          className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2.5 text-sm text-texto-fraco transition-colors hover:border-ouro/40 hover:text-ouro"
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
          Exportar tudo em CSV
        </a>

        <div className="flex items-center gap-3 px-1">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-texto">{utilizador.nome}</p>
            <p className="truncate text-[0.68rem] text-texto-subtil">{utilizador.email}</p>
          </div>
          <button
            onClick={aoSair}
            aria-label="Sair"
            className="rounded p-1.5 text-texto-subtil transition-colors hover:bg-white/5 hover:text-texto"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function Estrutura({
  utilizador,
  aoSair,
  titulo,
  nota,
  accoes,
  children,
}: {
  utilizador: Utilizador
  aoSair: () => void
  titulo: string
  nota?: string
  accoes?: ReactNode
  children: ReactNode
}) {
  const [aberto, setAberto] = useState(false)
  const local = useLocation()

  useEffect(() => setAberto(false), [local.pathname])

  return (
    <div className="min-h-screen bg-papel text-tinta">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">
        <Interior utilizador={utilizador} aoSair={aoSair} />
      </aside>

      {aberto ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Fechar menu"
            onClick={() => setAberto(false)}
            className="absolute inset-0 bg-navio/60 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 w-64 shadow-2xl">
            <Interior utilizador={utilizador} aoSair={aoSair} aoNavegar={() => setAberto(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-linha bg-papel/85 backdrop-blur">
          <div className="flex items-center gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
            <button
              onClick={() => setAberto(true)}
              aria-label="Abrir menu"
              className="rounded-lg border border-linha-forte p-2 text-tinta-media lg:hidden"
            >
              {aberto ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-medium tracking-tight text-tinta">{titulo}</h1>
              {nota ? <p className="truncate text-xs text-tinta-fraca">{nota}</p> : null}
            </div>

            {accoes ? <div className="flex shrink-0 items-center gap-2">{accoes}</div> : null}
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
