import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, TriangleAlert } from 'lucide-react'
import { JA_INVESTIU, RENDIMENTOS, RespostaPublicaSchema } from '@mf/shared'
import type { JaInvestiu, Origem } from '@mf/shared'
import { Campo, CLASSE_ENTRADA, EscolhaUnica } from './campos'
import { enviarResposta } from './enviar'

type Valores = {
  r1_dificuldade: string
  r2_ja_tentou: string
  r3_o_que_faria_comprar: string
  idade: string
  rendimento: string
  ja_investiu: string
  website: string
}

type Erros = Partial<Record<keyof Valores, string>>

const VALORES_INICIAIS: Valores = {
  r1_dificuldade: '',
  r2_ja_tentou: '',
  r3_o_que_faria_comprar: '',
  idade: '',
  rendimento: '',
  ja_investiu: '',
  website: '',
}

const ROTULOS_JA_INVESTIU: Record<JaInvestiu, string> = {
  sim: 'Sim',
  'não': 'Não',
  'não sei': 'Não tenho a certeza',
}

const OPCOES_RENDIMENTO = RENDIMENTOS.map((valor) => ({ valor, rotulo: valor }))
const OPCOES_JA_INVESTIU = JA_INVESTIU.map((valor) => ({
  valor,
  rotulo: ROTULOS_JA_INVESTIU[valor],
}))

export function Formulario({ origem, aoConcluir }: { origem: Origem; aoConcluir: () => void }) {
  const [valores, setValores] = useState<Valores>(VALORES_INICIAIS)
  const [erros, setErros] = useState<Erros>({})
  const [erroEnvio, setErroEnvio] = useState('')
  const [aEnviar, setAEnviar] = useState(false)
  const montadoEm = useRef(Date.now())

  function actualizar(campo: keyof Valores, valor: string) {
    setValores((anteriores) => ({ ...anteriores, [campo]: valor }))
    setErros((anteriores) => {
      if (!anteriores[campo]) return anteriores
      const seguintes = { ...anteriores }
      delete seguintes[campo]
      return seguintes
    })
  }

  function contornoDe(campo: keyof Valores) {
    return erros[campo] ? 'border-erro' : 'border-contorno'
  }

  async function submeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (aEnviar) return

    setErroEnvio('')

    const resultado = RespostaPublicaSchema.safeParse({
      idade: valores.idade.trim() === '' ? undefined : valores.idade,
      rendimento: valores.rendimento === '' ? undefined : valores.rendimento,
      ja_investiu: valores.ja_investiu === '' ? undefined : valores.ja_investiu,
      r1_dificuldade: valores.r1_dificuldade,
      r2_ja_tentou: valores.r2_ja_tentou,
      r3_o_que_faria_comprar: valores.r3_o_que_faria_comprar,
      website: valores.website,
      tempo_preenchimento: Date.now() - montadoEm.current,
    })

    if (!resultado.success) {
      const encontrados: Erros = {}
      for (const problema of resultado.error.issues) {
        const chave = problema.path[0] as keyof Valores
        if (chave && !encontrados[chave]) encontrados[chave] = problema.message
      }
      setErros(encontrados)

      if (encontrados.website) {
        setErroEnvio('Não conseguimos aceitar esta submissão.')
        return
      }

      const primeiro = (Object.keys(VALORES_INICIAIS) as (keyof Valores)[]).find(
        (campo) => encontrados[campo],
      )
      if (primeiro) {
        document
          .getElementById(`campo-${primeiro}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setErros({})
    setAEnviar(true)

    try {
      await enviarResposta({ ...resultado.data, origem })
      aoConcluir()
    } catch {
      setErroEnvio('Não conseguimos enviar a tua resposta. Verifica a ligação e tenta outra vez.')
      setAEnviar(false)
    }
  }

  return (
    <form onSubmit={submeter} noValidate className="relative">
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

      <section className="space-y-12 sm:space-y-16">
        <Campo
          nome="r1_dificuldade"
          rotulo="Qual é a maior dificuldade que tens com dinheiro ou investimento neste momento?"
          nota="Obrigatória"
          ajuda="Escreve como falarias com um amigo. Quanto mais concreto, mais nos ajuda."
          erro={erros.r1_dificuldade}
        >
          <textarea
            id="r1_dificuldade"
            name="r1_dificuldade"
            rows={5}
            maxLength={2000}
            value={valores.r1_dificuldade}
            onChange={(evento) => actualizar('r1_dificuldade', evento.target.value)}
            aria-invalid={erros.r1_dificuldade ? true : undefined}
            aria-describedby={erros.r1_dificuldade ? 'r1_dificuldade-erro' : undefined}
            className={`${CLASSE_ENTRADA} ${contornoDe('r1_dificuldade')} resize-y leading-relaxed`}
            placeholder="Por exemplo: não sobra nada ao fim do mês e não sei por onde começar."
          />
        </Campo>

        <Campo
          nome="r2_ja_tentou"
          rotulo="Já tentaste alguma coisa antes? O que foi e como correu?"
          nota="Opcional"
          ajuda="Vale tudo: uma app, ações, cripto, um PPR, um curso que não chegaste a acabar."
          erro={erros.r2_ja_tentou}
        >
          <textarea
            id="r2_ja_tentou"
            name="r2_ja_tentou"
            rows={4}
            maxLength={2000}
            value={valores.r2_ja_tentou}
            onChange={(evento) => actualizar('r2_ja_tentou', evento.target.value)}
            aria-invalid={erros.r2_ja_tentou ? true : undefined}
            aria-describedby={erros.r2_ja_tentou ? 'r2_ja_tentou-erro' : undefined}
            className={`${CLASSE_ENTRADA} ${contornoDe('r2_ja_tentou')} resize-y leading-relaxed`}
          />
        </Campo>

        <Campo
          nome="r3_o_que_faria_comprar"
          rotulo="O que teria de acontecer para avançares?"
          nota="Opcional"
          ajuda="O que precisavas de saber, ver ou ter garantido antes de dares o passo."
          erro={erros.r3_o_que_faria_comprar}
        >
          <textarea
            id="r3_o_que_faria_comprar"
            name="r3_o_que_faria_comprar"
            rows={4}
            maxLength={2000}
            value={valores.r3_o_que_faria_comprar}
            onChange={(evento) => actualizar('r3_o_que_faria_comprar', evento.target.value)}
            aria-invalid={erros.r3_o_que_faria_comprar ? true : undefined}
            aria-describedby={
              erros.r3_o_que_faria_comprar ? 'r3_o_que_faria_comprar-erro' : undefined
            }
            className={`${CLASSE_ENTRADA} ${contornoDe('r3_o_que_faria_comprar')} resize-y leading-relaxed`}
          />
        </Campo>
      </section>

      <div className="my-14 border-t border-contorno sm:my-20" />

      <section className="space-y-12 sm:space-y-16">
        <header className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-widest text-ouro">Sobre ti</p>
          <p className="text-sm leading-relaxed text-texto-fraco">
            Três campos. Servem para cruzar as respostas por perfil, mais nada.
          </p>
        </header>

        <Campo nome="idade" rotulo="Que idade tens?" erro={erros.idade}>
          <input
            id="idade"
            name="idade"
            type="number"
            inputMode="numeric"
            min={16}
            max={100}
            value={valores.idade}
            onChange={(evento) => actualizar('idade', evento.target.value)}
            aria-invalid={erros.idade ? true : undefined}
            aria-describedby={erros.idade ? 'idade-erro' : undefined}
            className={`${CLASSE_ENTRADA} ${contornoDe('idade')} max-w-40`}
            placeholder="34"
          />
        </Campo>

        <Campo
          nome="rendimento"
          rotulo="Quanto entra em casa por mês?"
          ajuda="Valor líquido, por alto. Se preferires não dizer, também é uma resposta."
          erro={erros.rendimento}
          grupo
        >
          <EscolhaUnica
            nome="rendimento"
            opcoes={OPCOES_RENDIMENTO}
            valor={valores.rendimento}
            aoEscolher={(valor) => actualizar('rendimento', valor)}
            erro={erros.rendimento}
          />
        </Campo>

        <Campo
          nome="ja_investiu"
          rotulo="Já investiste alguma vez?"
          erro={erros.ja_investiu}
          grupo
        >
          <EscolhaUnica
            nome="ja_investiu"
            opcoes={OPCOES_JA_INVESTIU}
            valor={valores.ja_investiu}
            aoEscolher={(valor) => actualizar('ja_investiu', valor)}
            erro={erros.ja_investiu}
            colunas={3}
          />
        </Campo>
      </section>

      {erroEnvio ? (
        <div
          role="alert"
          className="mt-12 flex items-start gap-3 rounded-lg border border-erro bg-superficie px-4 py-3"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-erro" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-erro">{erroEnvio}</p>
        </div>
      ) : null}

      <div className="mt-12 space-y-4 sm:mt-16">
        <button
          type="submit"
          disabled={aEnviar}
          className="group flex w-full items-center justify-center gap-3 rounded-lg bg-ouro px-6 py-4 text-base font-medium text-fundo outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ouro-claro disabled:opacity-60 sm:w-auto"
        >
          {aEnviar ? 'A enviar' : 'Enviar as respostas'}
          {aEnviar ? null : (
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          )}
        </button>
        <p className="text-sm text-texto-subtil">
          Não pedimos nome, email nem telefone. Não há nada para comprar a seguir.
        </p>
      </div>
    </form>
  )
}
