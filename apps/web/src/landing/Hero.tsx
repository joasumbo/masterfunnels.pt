import { ArrowRight, Clock, EyeOff, ShieldCheck } from 'lucide-react'

const GARANTIAS = [
  { Icone: Clock, texto: 'Dois minutos. Seis campos, três deles abertos.' },
  { Icone: EyeOff, texto: 'Anónimo. Não pedimos nome, email nem telefone.' },
  { Icone: ShieldCheck, texto: 'É uma pesquisa. Não há nada à venda nesta página.' },
]

export function Hero({ aoComecar, aSair }: { aoComecar: () => void; aSair: boolean }) {
  return (
    <section
      className={`flex min-h-[100dvh] flex-col px-5 py-6 sm:h-[100dvh] sm:min-h-0 sm:px-8 sm:py-7 lg:px-12 ${
        aSair ? 'sai-tudo' : ''
      }`}
    >
      <header className="mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between">
        <img
          src="/marca/logo-wordmark-light.svg"
          alt="Master Funnels"
          className="h-8 w-auto sm:h-9"
        />
        <span className="hidden font-mono text-[0.68rem] uppercase tracking-[0.2em] text-texto-subtil sm:block">
          Porto · Portugal
        </span>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 items-center overflow-y-auto py-8 sm:overflow-hidden">
        <div className="escalonar grid w-full gap-x-14 gap-y-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-ouro sm:text-xs">
              Pesquisa aberta
            </p>

            <h1
              className="mt-4 font-serif leading-[1.05] text-texto sm:mt-5"
              style={{ fontSize: 'clamp(2rem, 1rem + 4.8vh, 4.2rem)' }}
            >
              Antes de construirmos o curso, queremos ouvir-te.
            </h1>

            <div
              className="mt-5 max-w-xl space-y-3 leading-relaxed text-texto-fraco sm:mt-7"
              style={{ fontSize: 'clamp(0.9rem, 0.78rem + 0.55vh, 1.1rem)' }}
            >
              <p>
                Estamos a preparar formação sobre finanças pessoais e investimento para quem começa
                do zero, em Portugal.
              </p>
              <p>
                Três perguntas abertas. Respondes com as tuas palavras e ficamos a saber onde aperta
                de verdade.
              </p>
            </div>

            <button
              type="button"
              onClick={aoComecar}
              className="group mt-7 inline-flex w-full items-center justify-center gap-3 rounded-lg bg-ouro px-7 py-4 text-base font-medium text-fundo outline-none transition-all hover:bg-ouro-claro focus-visible:ring-2 focus-visible:ring-ouro-claro focus-visible:ring-offset-2 focus-visible:ring-offset-fundo sm:mt-9 sm:w-auto sm:text-lg"
            >
              Começar o inquérito
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5"
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="lg:col-span-5 lg:col-start-9">
            <ul className="grid gap-5 border-t border-contorno pt-7 sm:grid-cols-3 lg:grid-cols-1 lg:gap-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
              {GARANTIAS.map(({ Icone, texto }, i) => (
                <li
                  key={texto}
                  className={`flex items-start gap-3 lg:py-5 ${
                    i > 0 ? 'lg:border-t lg:border-contorno' : ''
                  }`}
                >
                  <Icone className="mt-0.5 h-4 w-4 shrink-0 text-ouro" aria-hidden="true" />
                  <span className="text-sm leading-relaxed text-texto-fraco">{texto}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
