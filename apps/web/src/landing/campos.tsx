import type { ReactNode } from 'react'

export const CLASSE_ENTRADA =
  'w-full rounded-lg border bg-superficie px-4 py-3 text-base text-texto outline-none transition-colors placeholder:text-texto-subtil focus:border-ouro focus:ring-1 focus:ring-ouro'

type PropsCampo = {
  nome: string
  rotulo: string
  nota?: string
  ajuda?: string
  erro?: string
  grupo?: boolean
  children: ReactNode
}

export function Campo({ nome, rotulo, nota, ajuda, erro, grupo, children }: PropsCampo) {
  const conteudoRotulo = (
    <>
      <span className="font-serif text-xl leading-snug text-texto sm:text-2xl">{rotulo}</span>
      {nota ? (
        <span className="font-mono text-xs uppercase tracking-widest text-texto-subtil">{nota}</span>
      ) : null}
    </>
  )

  return (
    <div id={`campo-${nome}`} className="scroll-mt-8">
      {grupo ? (
        <div
          id={`${nome}-rotulo`}
          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
        >
          {conteudoRotulo}
        </div>
      ) : (
        <label
          htmlFor={nome}
          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
        >
          {conteudoRotulo}
        </label>
      )}

      {ajuda ? <p className="mt-3 text-sm leading-relaxed text-texto-fraco">{ajuda}</p> : null}

      <div className="mt-5">{children}</div>

      {erro ? (
        <p id={`${nome}-erro`} role="alert" className="mt-3 text-sm text-erro">
          {erro}
        </p>
      ) : null}
    </div>
  )
}

type Opcao = { valor: string; rotulo: string }

type PropsEscolha = {
  nome: string
  opcoes: readonly Opcao[]
  valor: string
  aoEscolher: (valor: string) => void
  erro?: string
  colunas?: number
}

export function EscolhaUnica({ nome, opcoes, valor, aoEscolher, erro, colunas = 2 }: PropsEscolha) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={`${nome}-rotulo`}
      aria-describedby={erro ? `${nome}-erro` : undefined}
      className={colunas === 3 ? 'grid gap-2 sm:grid-cols-3' : 'grid gap-2 sm:grid-cols-2'}
    >
      {opcoes.map((opcao) => (
        <label
          key={opcao.valor}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-superficie px-4 py-3 transition-colors has-[:checked]:border-ouro has-[:focus-visible]:border-ouro-claro ${
            erro ? 'border-erro' : 'border-contorno'
          }`}
        >
          <input
            type="radio"
            name={nome}
            value={opcao.valor}
            checked={valor === opcao.valor}
            onChange={() => aoEscolher(opcao.valor)}
            className="peer sr-only"
          />
          <span className="h-4 w-4 shrink-0 rounded-full border border-contorno-claro transition-colors peer-checked:border-ouro peer-checked:bg-ouro" />
          <span className="text-sm text-texto-fraco transition-colors peer-checked:text-texto">
            {opcao.rotulo}
          </span>
        </label>
      ))}
    </div>
  )
}
