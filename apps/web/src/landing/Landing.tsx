import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { origemDoUtm } from '@mf/shared'
import { Fundo } from './Fundo'
import { Hero } from './Hero'
import { Formulario } from './Formulario'
import { Agradecimento } from './Agradecimento'
import { Avisos, avisar } from './Avisos'
import { Carregador } from './Carregador'

type Fase = 'hero' | 'a-sair' | 'inquerito' | 'feito'

export default function Landing() {
  const [parametros] = useSearchParams()
  const [fase, setFase] = useState<Fase>('hero')
  const [aCarregar, setACarregar] = useState(true)
  const [carregadorVisivel, setCarregadorVisivel] = useState(true)
  const origem = useMemo(() => origemDoUtm(parametros.get('utm_source')), [parametros])
  const iniciadoEm = useRef(Date.now())

  useEffect(() => {
    document.body.classList.add('sem-scroll')
    return () => document.body.classList.remove('sem-scroll')
  }, [])

  useEffect(() => {
    let vivo = true
    const espera = new Promise((resolver) => window.setTimeout(resolver, 900))
    const fontes = document.fonts ? document.fonts.ready : Promise.resolve()

    Promise.all([espera, fontes]).then(() => {
      if (!vivo) return
      setACarregar(false)
      window.setTimeout(() => vivo && setCarregadorVisivel(false), 520)
    })

    return () => {
      vivo = false
    }
  }, [])

  function comecar() {
    setFase('a-sair')
    window.setTimeout(() => setFase('inquerito'), 260)
  }

  function concluir() {
    setFase('feito')
    avisar('A tua informação foi enviada com sucesso.', 'sucesso')
  }

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden">
      <Fundo />
      <Avisos />
      {carregadorVisivel ? <Carregador aSair={!aCarregar} /> : null}

      {fase === 'hero' || fase === 'a-sair' ? (
        <Hero aoComecar={comecar} aSair={fase === 'a-sair'} />
      ) : null}

      {fase === 'inquerito' ? (
        <div className="entra-frente">
          <Formulario
            origem={origem}
            iniciadoEm={iniciadoEm.current}
            aoConcluir={concluir}
            aoDesistir={() => setFase('hero')}
          />
        </div>
      ) : null}

      {fase === 'feito' ? (
        <section className="flex min-h-[100dvh] flex-col px-5 py-6 sm:h-[100dvh] sm:min-h-0 sm:px-8 sm:py-7">
          <header className="mx-auto w-full max-w-3xl shrink-0">
            <img
              src="/marca/logo-wordmark-light.svg"
              alt="Master Funnels"
              className="h-8 w-auto sm:h-9"
            />
          </header>
          <div className="mx-auto flex w-full max-w-3xl flex-1 items-center overflow-y-auto py-8 sm:overflow-hidden">
            <div className="entra-frente w-full">
              <Agradecimento />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
