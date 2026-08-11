import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ArrowLeft, ArrowRight, CornerDownLeft, Send } from 'lucide-react'
import { JA_INVESTIU, RENDIMENTOS, RespostaPublicaSchema } from '@mf/shared'
import type { JaInvestiu, Origem } from '@mf/shared'
import { CLASSE_ENTRADA, EscolhaUnica } from './campos'
import { enviarResposta } from './enviar'
import { avisar } from './Avisos'

type Chave =
  | 'r1_dificuldade'
  | 'r2_ja_tentou'
  | 'r3_o_que_faria_comprar'
  | 'idade'
  | 'rendimento'
  | 'ja_investiu'

type Valores = Record<Chave, string> & { website: string }

type Passo = {
  chave: Chave
  tipo: 'texto' | 'numero' | 'escolha'
  rotulo: string
  nota: string
  ajuda?: string
  exemplo?: string
  vazio?: string
  opcoes?: { valor: string; rotulo: string }[]
  colunas?: number
}

const ROTULOS_JA_INVESTIU: Record<JaInvestiu, string> = {
  sim: 'Sim',
  'não': 'Não',
  'não sei': 'Não tenho a certeza',
}

const PASSOS: Passo[] = [
  {
    chave: 'r1_dificuldade',
    tipo: 'texto',
    rotulo: 'Qual é a maior dificuldade que tens com dinheiro ou investimento neste momento?',
    nota: 'Obrigatória',
    ajuda: 'Escreve como falarias com um amigo. Quanto mais concreto, mais nos ajuda.',
    exemplo: 'Por exemplo: não sobra nada ao fim do mês e não sei por onde começar.',
    vazio: 'Falta a resposta a esta pergunta. É a única obrigatória do inquérito.',
  },
  {
    chave: 'r2_ja_tentou',
    tipo: 'texto',
    rotulo: 'Já tentaste alguma coisa antes? O que foi e como correu?',
    nota: 'Opcional',
    ajuda: 'Vale tudo: uma app, ações, cripto, um PPR, um curso que não chegaste a acabar.',
  },
  {
    chave: 'r3_o_que_faria_comprar',
    tipo: 'texto',
    rotulo: 'O que teria de acontecer para avançares?',
    nota: 'Opcional',
    ajuda: 'O que precisavas de saber, ver ou ter garantido antes de dares o passo.',
  },
  {
    chave: 'idade',
    tipo: 'numero',
    rotulo: 'Que idade tens?',
    nota: 'Sobre ti',
    ajuda: 'Serve para cruzar as respostas por perfil, mais nada.',
    vazio: 'Falta a idade para continuarmos.',
  },
  {
    chave: 'rendimento',
    tipo: 'escolha',
    rotulo: 'Quanto entra em casa por mês?',
    nota: 'Sobre ti',
    ajuda: 'Valor líquido, por alto. Se preferires não dizer, também é uma resposta.',
    vazio: 'Escolhe um dos intervalos. Há uma opção para não dizer.',
    opcoes: RENDIMENTOS.map((valor) => ({ valor, rotulo: valor })),
    colunas: 2,
  },
  {
    chave: 'ja_investiu',
    tipo: 'escolha',
    rotulo: 'Já investiste alguma vez?',
    nota: 'Sobre ti',
    vazio: 'Escolhe uma das três opções para fecharmos.',
    opcoes: JA_INVESTIU.map((valor) => ({ valor, rotulo: ROTULOS_JA_INVESTIU[valor] })),
    colunas: 3,
  },
]

const VALORES_INICIAIS: Valores = {
  r1_dificuldade: '',
  r2_ja_tentou: '',
  r3_o_que_faria_comprar: '',
  idade: '',
  rendimento: '',
  ja_investiu: '',
  website: '',
}

const TAMANHO_ROTULO = 'clamp(1.3rem, 0.9rem + 2.3vh, 2.5rem)'
const TAMANHO_AJUDA = 'clamp(0.85rem, 0.76rem + 0.45vh, 1.05rem)'
const ALTURA_TEXTO = 'clamp(96px, 24vh, 200px)'

function validarCampo(passo: Passo, valor: string): string | undefined {
  if (passo.tipo === 'escolha') {
    return valor === '' ? passo.vazio : undefined
  }

  if (passo.tipo === 'numero') {
    if (valor.trim() === '') return passo.vazio
    const resultado = RespostaPublicaSchema.shape.idade.safeParse(valor)
    return resultado.success ? undefined : resultado.error.issues[0]?.message
  }

  const forma = RespostaPublicaSchema.shape[passo.chave]
  const resultado = forma.safeParse(valor)
  if (resultado.success) return undefined
  return valor.trim() === '' && passo.vazio ? passo.vazio : resultado.error.issues[0]?.message
}

export function Formulario({
  origem,
  iniciadoEm,
  aoConcluir,
  aoDesistir,
}: {
  origem: Origem
  iniciadoEm: number
  aoConcluir: () => void
  aoDesistir: () => void
}) {
  const [valores, setValores] = useState<Valores>(VALORES_INICIAIS)
  const [indice, setIndice] = useState(0)
  const [animacao, setAnimacao] = useState('entra-frente')
  const [aEnviar, setAEnviar] = useState(false)

  const caixa = useRef<HTMLDivElement>(null)
  const emTransicao = useRef(false)
  const agendado = useRef<number | undefined>(undefined)

  const passo = PASSOS[indice]
  const ultimo = indice === PASSOS.length - 1

  useEffect(() => {
    const alvo = caixa.current?.querySelector<HTMLElement>('textarea, input:not([type="radio"])')
    if (alvo && window.matchMedia('(min-width: 640px)').matches) alvo.focus()
  }, [indice])

  useEffect(() => () => window.clearTimeout(agendado.current), [])

  function actualizar(chave: Chave | 'website', valor: string) {
    setValores((anteriores) => ({ ...anteriores, [chave]: valor }))
  }

  function transitar(destino: number, sentido: 'frente' | 'tras') {
    emTransicao.current = true
    setAnimacao(sentido === 'frente' ? 'sai-frente' : 'sai-tras')
    agendado.current = window.setTimeout(() => {
      setIndice(destino)
      setAnimacao(sentido === 'frente' ? 'entra-frente' : 'entra-tras')
      emTransicao.current = false
    }, 230)
  }

  function avancar() {
    if (emTransicao.current || aEnviar) return
    const problema = validarCampo(passo, valores[passo.chave])
    if (problema) {
      avisar(problema)
      return
    }
    if (ultimo) {
      submeter()
      return
    }
    transitar(indice + 1, 'frente')
  }

  function recuar() {
    if (emTransicao.current || aEnviar) return
    if (indice === 0) {
      aoDesistir()
      return
    }
    transitar(indice - 1, 'tras')
  }

  function escolher(valor: string) {
    actualizar(passo.chave, valor)
    if (ultimo) return
    window.clearTimeout(agendado.current)
    agendado.current = window.setTimeout(() => transitar(indice + 1, 'frente'), 300)
  }

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key !== 'Enter') return
    const alvo = evento.target as HTMLElement
    if (alvo.tagName === 'TEXTAREA' && !(evento.ctrlKey || evento.metaKey)) return
    evento.preventDefault()
    avancar()
  }

  async function submeter() {
    const resultado = RespostaPublicaSchema.safeParse({
      idade: valores.idade.trim() === '' ? undefined : valores.idade,
      rendimento: valores.rendimento === '' ? undefined : valores.rendimento,
      ja_investiu: valores.ja_investiu === '' ? undefined : valores.ja_investiu,
      r1_dificuldade: valores.r1_dificuldade,
      r2_ja_tentou: valores.r2_ja_tentou,
      r3_o_que_faria_comprar: valores.r3_o_que_faria_comprar,
      website: valores.website,
      tempo_preenchimento: Date.now() - iniciadoEm,
    })

    if (!resultado.success) {
      const problema = resultado.error.issues[0]
      const chave = problema?.path[0] as string | undefined

      if (chave === 'website' || chave === 'tempo_preenchimento') {
        avisar('Não conseguimos aceitar esta submissão.')
        return
      }

      const regresso = PASSOS.findIndex((p) => p.chave === chave)
      if (regresso >= 0 && regresso !== indice) {
        setIndice(regresso)
        setAnimacao('entra-tras')
      }
      avisar(problema?.message ?? 'Falta rever uma resposta.')
      return
    }

    setAEnviar(true)
    try {
      await enviarResposta({ ...resultado.data, origem })
      aoConcluir()
    } catch {
      avisar('Não conseguimos enviar a tua resposta. Verifica a ligação e tenta outra vez.')
      setAEnviar(false)
    }
  }

  const progresso = ((indice + (valores[passo.chave] ? 1 : 0)) / PASSOS.length) * 100

  return (
    <section className="flex h-[100dvh] flex-col px-5 py-5 sm:px-8 sm:py-6">
      <div className="fixed inset-x-0 top-0 z-20 h-0.5 bg-contorno">
        <div
          className="h-full bg-ouro transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(progresso, 3)}%` }}
        />
      </div>

      <header className="mx-auto flex w-full max-w-3xl shrink-0 items-center justify-between gap-4">
        <img
          src="/marca/logo-wordmark-light.svg"
          alt="Master Funnels"
          className="h-7 w-auto sm:h-8"
        />
        <span className="font-mono text-xs tracking-widest text-texto-subtil">
          {String(indice + 1).padStart(2, '0')} / {String(PASSOS.length).padStart(2, '0')}
        </span>
      </header>

      <div
        ref={caixa}
        onKeyDown={aoTeclar}
        className="mx-auto flex w-full max-w-3xl flex-1 items-center overflow-y-auto py-6 sm:overflow-hidden sm:py-8"
      >
        <div key={indice} className={`w-full ${animacao}`}>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-ouro sm:text-xs">
            {passo.nota}
          </p>

          <label
            htmlFor={passo.chave}
            className="mt-3 block font-serif leading-[1.15] text-texto sm:mt-4"
            style={{ fontSize: TAMANHO_ROTULO }}
          >
            {passo.rotulo}
          </label>

          {passo.ajuda ? (
            <p
              className="mt-3 max-w-2xl leading-relaxed text-texto-fraco"
              style={{ fontSize: TAMANHO_AJUDA }}
            >
              {passo.ajuda}
            </p>
          ) : null}

          <div className="mt-5 sm:mt-6">
            {passo.tipo === 'texto' ? (
              <textarea
                id={passo.chave}
                name={passo.chave}
                maxLength={2000}
                value={valores[passo.chave]}
                onChange={(evento) => actualizar(passo.chave, evento.target.value)}
                placeholder={passo.exemplo}
                style={{ height: ALTURA_TEXTO }}
                className={`${CLASSE_ENTRADA} border-contorno resize-none text-base leading-relaxed sm:text-lg`}
              />
            ) : null}

            {passo.tipo === 'numero' ? (
              <input
                id={passo.chave}
                name={passo.chave}
                type="number"
                inputMode="numeric"
                min={16}
                max={100}
                value={valores[passo.chave]}
                onChange={(evento) => actualizar(passo.chave, evento.target.value)}
                placeholder="34"
                className={`${CLASSE_ENTRADA} border-contorno max-w-40 text-lg`}
              />
            ) : null}

            {passo.tipo === 'escolha' ? (
              <EscolhaUnica
                nome={passo.chave}
                opcoes={passo.opcoes ?? []}
                valor={valores[passo.chave]}
                aoEscolher={escolher}
                colunas={passo.colunas}
              />
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8 sm:gap-4">
            <button
              type="button"
              onClick={avancar}
              disabled={aEnviar}
              className="group inline-flex items-center justify-center gap-2.5 rounded-lg bg-ouro px-6 py-3.5 text-base font-medium text-fundo outline-none transition-all hover:bg-ouro-claro focus-visible:ring-2 focus-visible:ring-ouro-claro focus-visible:ring-offset-2 focus-visible:ring-offset-fundo disabled:opacity-60"
            >
              {ultimo ? (aEnviar ? 'A enviar' : 'Enviar as respostas') : 'Continuar'}
              {ultimo ? (
                <Send className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              )}
            </button>

            <button
              type="button"
              onClick={recuar}
              disabled={aEnviar}
              className="inline-flex items-center gap-2 rounded-lg border border-contorno px-4 py-3.5 text-sm text-texto-fraco outline-none transition-colors hover:border-contorno-claro hover:text-texto focus-visible:border-ouro disabled:opacity-60"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Voltar
            </button>

            {passo.nota === 'Opcional' && !valores[passo.chave] ? (
              <span className="text-sm text-texto-subtil">Podes saltar esta.</span>
            ) : null}
          </div>

          <p className="mt-5 hidden items-center gap-2 font-mono text-xs text-texto-subtil sm:flex">
            <CornerDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {passo.tipo === 'texto' ? 'Ctrl + Enter para continuar' : 'Enter para continuar'}
          </p>
        </div>
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={valores.website}
          onChange={(evento) => actualizar('website', evento.target.value)}
        />
      </div>
    </section>
  )
}
