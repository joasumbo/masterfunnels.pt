import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Clock, EyeOff, ShieldCheck } from 'lucide-react'
import { origemDoUtm } from '@mf/shared'
import { Formulario } from './Formulario'
import { Agradecimento } from './Agradecimento'

const GARANTIAS = [
  { Icone: Clock, texto: 'Dois minutos. Seis campos, três deles abertos.' },
  { Icone: EyeOff, texto: 'Anónimo. Não pedimos nome, email nem telefone.' },
  { Icone: ShieldCheck, texto: 'É uma pesquisa. Não há nada à venda nesta página.' },
]

export default function Landing() {
  const [parametros] = useSearchParams()
  const [enviado, setEnviado] = useState(false)
  const origem = useMemo(() => origemDoUtm(parametros.get('utm_source')), [parametros])

  useEffect(() => {
    if (enviado) window.scrollTo({ top: 0 })
  }, [enviado])

  return (
    <div className="min-h-screen bg-fundo">
      <div className="mx-auto w-full max-w-2xl px-5 pb-24 pt-10 sm:px-8 sm:pb-32 sm:pt-14">
        <header>
          <img
            src="/marca/logo-wordmark-light.svg"
            alt="Master Funnels"
            className="h-9 w-auto sm:h-11"
          />
        </header>

        {enviado ? (
          <main>
            <Agradecimento />
          </main>
        ) : (
          <main>
            <section className="pt-14 sm:pt-20">
              <p className="font-mono text-xs uppercase tracking-widest text-ouro">
                Pesquisa aberta
              </p>

              <h1 className="mt-6 font-serif text-4xl leading-tight text-texto sm:text-6xl">
                Antes de construirmos o curso, queremos ouvir-te.
              </h1>

              <div className="mt-8 max-w-xl space-y-4 text-base leading-relaxed text-texto-fraco sm:text-lg">
                <p>
                  Estamos a preparar formação sobre finanças pessoais e investimento para quem
                  começa do zero, em Portugal.
                </p>
                <p>
                  Três perguntas abertas. Respondes com as tuas palavras e ficamos a saber onde
                  aperta de verdade.
                </p>
              </div>

              <ul className="mt-12 space-y-4 border-t border-contorno pt-8">
                {GARANTIAS.map(({ Icone, texto }) => (
                  <li key={texto} className="flex items-start gap-3">
                    <Icone className="mt-0.5 h-4 w-4 shrink-0 text-ouro" aria-hidden="true" />
                    <span className="text-sm leading-relaxed text-texto-fraco">{texto}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-16 sm:mt-24">
              <Formulario origem={origem} aoConcluir={() => setEnviado(true)} />
            </div>
          </main>
        )}

        <footer className="mt-24 border-t border-contorno pt-8 sm:mt-32">
          <p className="text-xs text-texto-subtil">
            Master Funnels — as respostas são usadas apenas para desenhar o curso.
          </p>
        </footer>
      </div>
    </div>
  )
}
