import { useState, type FormEvent } from 'react'
import { ArrowRight, Lock } from 'lucide-react'
import { api } from './api'
import { CLASSE_CAMPO, Erro } from './ui'

export default function Entrada({ aoEntrar }: { aoEntrar: () => void }) {
  const [email, setEmail] = useState('')
  const [palavraPasse, setPalavraPasse] = useState('')
  const [erro, setErro] = useState('')
  const [aEnviar, setAEnviar] = useState(false)

  async function submeter(evento: FormEvent) {
    evento.preventDefault()
    setErro('')
    setAEnviar(true)
    try {
      await api.entrar(email, palavraPasse)
      aoEntrar()
    } catch {
      setErro('Credenciais inválidas.')
      setAEnviar(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-papel">
      <aside className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-navio p-10 lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,168,67,0.16),transparent_60%)]" />

        <img
          src="/marca/logo-wordmark-light.svg"
          alt="Master Funnels"
          className="relative h-9 w-auto"
        />

        <div className="relative max-w-md">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-ouro">
            Pesquisa ao público
          </p>
          <p className="mt-5 font-serif text-3xl leading-tight text-texto">
            112 respostas lidas uma a uma, agrupadas por dor e por aquilo que ainda as trava.
          </p>
          <p className="mt-5 text-sm leading-relaxed text-texto-fraco">
            Dez clusters, quatro estados de consciência e as citações que aguentam ir para um
            anúncio sem serem reescritas.
          </p>
        </div>

        <p className="relative text-xs text-texto-subtil">
          Acesso reservado à equipa. Curso de finanças pessoais e investimento para iniciantes.
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <form onSubmit={submeter} className="w-full max-w-sm">
          <img
            src="/marca/logo-wordmark-dark.svg"
            alt="Master Funnels"
            className="mb-10 h-8 w-auto lg:hidden"
          />

          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-linha bg-cartao">
            <Lock className="h-4 w-4 text-ouro-escuro" aria-hidden="true" />
          </span>

          <h1 className="mt-6 text-2xl font-medium tracking-tight text-tinta">
            Painel da pesquisa
          </h1>
          <p className="mt-1.5 text-sm text-tinta-fraca">
            Entra para ver os clusters, corrigir classificações e gerar ângulos.
          </p>

          <label className="mt-8 block">
            <span className="mb-1.5 block text-xs font-medium text-tinta-media">Email</span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={CLASSE_CAMPO}
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-medium text-tinta-media">Palavra-passe</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={palavraPasse}
              onChange={(e) => setPalavraPasse(e.target.value)}
              className={CLASSE_CAMPO}
            />
          </label>

          {erro ? (
            <div className="mt-4">
              <Erro mensagem={erro} />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={aEnviar}
            className="group mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-tinta px-4 py-2.5 text-sm font-medium text-papel outline-none transition-colors hover:bg-navio-claro focus-visible:ring-2 focus-visible:ring-ouro focus-visible:ring-offset-2 focus-visible:ring-offset-papel disabled:opacity-60"
          >
            {aEnviar ? 'A entrar' : 'Entrar'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </form>
      </main>
    </div>
  )
}
