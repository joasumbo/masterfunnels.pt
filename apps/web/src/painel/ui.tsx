import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { Inbox, LoaderCircle, TriangleAlert } from 'lucide-react'

export function Cartao({
  titulo,
  nota,
  accao,
  semPadding,
  children,
  className = '',
}: {
  titulo?: string
  nota?: string
  accao?: ReactNode
  semPadding?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-xl border border-linha bg-cartao shadow-[0_1px_2px_rgba(22,21,26,0.04)] ${className}`}
    >
      {(titulo || accao) && (
        <header className="flex items-start justify-between gap-4 border-b border-linha px-5 py-4">
          <div className="min-w-0">
            {titulo && <h2 className="text-[0.95rem] font-medium text-tinta">{titulo}</h2>}
            {nota && <p className="mt-0.5 text-xs leading-relaxed text-tinta-fraca">{nota}</p>}
          </div>
          {accao ? <div className="shrink-0">{accao}</div> : null}
        </header>
      )}
      <div className={semPadding ? '' : 'p-5'}>{children}</div>
    </section>
  )
}

export function Indicador({
  valor,
  rotulo,
  nota,
  Icone,
  tom = 'neutro',
}: {
  valor: ReactNode
  rotulo: string
  nota?: string
  Icone?: typeof Inbox
  tom?: 'neutro' | 'ouro' | 'jade' | 'ferrugem'
}) {
  const tintas = {
    neutro: 'text-tinta-fraca',
    ouro: 'text-ouro-escuro',
    jade: 'text-jade',
    ferrugem: 'text-ferrugem',
  }

  return (
    <div className="rounded-xl border border-linha bg-cartao px-5 py-4 shadow-[0_1px_2px_rgba(22,21,26,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.11em] text-tinta-fraca">
          {rotulo}
        </span>
        {Icone ? <Icone className={`h-4 w-4 ${tintas[tom]}`} aria-hidden="true" /> : null}
      </div>
      <div className="mt-3 font-mono text-[2rem] leading-none text-tinta">{valor}</div>
      {nota ? <p className="mt-2 text-xs text-tinta-fraca">{nota}</p> : null}
    </div>
  )
}

const TONS_ETIQUETA = {
  neutro: 'border-linha bg-papel text-tinta-media',
  ouro: 'border-ouro/40 bg-ouro/10 text-ouro-escuro',
  jade: 'border-jade/30 bg-jade/10 text-jade',
  ferrugem: 'border-ferrugem/30 bg-ferrugem/10 text-ferrugem',
  tinta: 'border-tinta/15 bg-tinta/5 text-tinta',
}

export function Etiqueta({
  children,
  tom = 'neutro',
  mono,
}: {
  children: ReactNode
  tom?: keyof typeof TONS_ETIQUETA
  mono?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs whitespace-nowrap ${
        mono ? 'font-mono' : ''
      } ${TONS_ETIQUETA[tom]}`}
    >
      {children}
    </span>
  )
}

const TONS_BOTAO = {
  principal: 'bg-tinta text-papel hover:bg-navio-claro',
  ouro: 'bg-ouro text-navio hover:bg-ouro-claro',
  contorno: 'border border-linha-forte bg-cartao text-tinta-media hover:border-tinta/30 hover:text-tinta',
  fantasma: 'text-tinta-media hover:bg-papel-fundo hover:text-tinta',
}

type PropsBotao = ButtonHTMLAttributes<HTMLButtonElement> & {
  tom?: keyof typeof TONS_BOTAO
  pequeno?: boolean
}

export function Botao({ tom = 'contorno', pequeno, className = '', ...resto }: PropsBotao) {
  return (
    <button
      {...resto}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ouro focus-visible:ring-offset-1 focus-visible:ring-offset-papel disabled:pointer-events-none disabled:opacity-50 ${
        pequeno ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
      } ${TONS_BOTAO[tom]} ${className}`}
    />
  )
}

export function Ligacao({
  href,
  children,
  tom = 'contorno',
  pequeno,
}: {
  href: string
  children: ReactNode
  tom?: keyof typeof TONS_BOTAO
  pequeno?: boolean
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium outline-none transition-colors ${
        pequeno ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
      } ${TONS_BOTAO[tom]}`}
    >
      {children}
    </a>
  )
}

export const CLASSE_CAMPO =
  'w-full rounded-lg border border-linha-forte bg-cartao px-3 py-2 text-sm text-tinta outline-none transition-colors placeholder:text-tinta-fraca focus:border-ouro focus:ring-2 focus:ring-ouro/20'

export function Seleccao({
  rotulo,
  children,
  ...resto
}: SelectHTMLAttributes<HTMLSelectElement> & { rotulo?: string }) {
  return (
    <label className="block">
      {rotulo ? (
        <span className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.08em] text-tinta-fraca">
          {rotulo}
        </span>
      ) : null}
      <select {...resto} className={`${CLASSE_CAMPO} cursor-pointer appearance-none pr-8`}>
        {children}
      </select>
    </label>
  )
}

export function Barra({
  rotulo,
  total,
  percentagem,
  cor,
  activo,
  aoClicar,
}: {
  rotulo: string
  total: number
  percentagem: number
  cor: string
  activo?: boolean
  aoClicar?: () => void
}) {
  const conteudo = (
    <>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className={`truncate text-sm ${activo ? 'text-ouro-escuro' : 'text-tinta'}`}>
          {rotulo}
        </span>
        <span className="shrink-0 font-mono text-xs text-tinta-fraca">
          {total} · {percentagem}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-papel-fundo">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(percentagem, 1.5)}%`, background: cor }}
        />
      </div>
    </>
  )

  if (!aoClicar) return <div className="py-2">{conteudo}</div>

  return (
    <button
      type="button"
      onClick={aoClicar}
      className="w-full cursor-pointer rounded-lg px-2 py-2 text-left transition-colors hover:bg-papel"
    >
      {conteudo}
    </button>
  )
}

export function Carregando({ texto = 'A carregar' }: { texto?: string }) {
  return (
    <div className="flex items-center gap-2.5 py-10 text-sm text-tinta-fraca">
      <LoaderCircle className="h-4 w-4 animate-spin text-ouro-escuro" aria-hidden="true" />
      {texto}
    </div>
  )
}

export function Erro({ mensagem }: { mensagem: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-ferrugem/30 bg-ferrugem/5 px-4 py-3 text-sm text-ferrugem"
    >
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {mensagem}
    </div>
  )
}

export function Vazio({ titulo, nota, accao }: { titulo: string; nota?: string; accao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-linha bg-papel">
        <Inbox className="h-5 w-5 text-tinta-fraca" aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-medium text-tinta">{titulo}</p>
      {nota ? <p className="mt-1 max-w-sm text-xs leading-relaxed text-tinta-fraca">{nota}</p> : null}
      {accao ? <div className="mt-5">{accao}</div> : null}
    </div>
  )
}
