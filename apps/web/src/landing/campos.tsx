export const CLASSE_ENTRADA =
  'w-full rounded-lg border bg-superficie/80 px-4 py-3.5 text-base text-texto outline-none backdrop-blur transition-colors placeholder:text-texto-subtil focus:border-ouro focus:ring-1 focus:ring-ouro'

const LETRAS = 'ABCDEFGHIJ'

type Opcao = { valor: string; rotulo: string }

type PropsEscolha = {
  nome: string
  opcoes: readonly Opcao[]
  valor: string
  aoEscolher: (valor: string) => void
  colunas?: number
}

export function EscolhaUnica({ nome, opcoes, valor, aoEscolher, colunas = 2 }: PropsEscolha) {
  return (
    <div
      role="radiogroup"
      aria-label={nome}
      className={`grid gap-2.5 ${colunas === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}
    >
      {opcoes.map((opcao, i) => (
        <label
          key={opcao.valor}
          className="flex cursor-pointer items-center gap-3 rounded-lg border border-contorno bg-superficie/80 px-4 py-3.5 backdrop-blur transition-all hover:border-contorno-claro has-[:checked]:border-ouro has-[:checked]:bg-ouro/10 has-[:focus-visible]:border-ouro-claro"
        >
          <input
            type="radio"
            name={nome}
            value={opcao.valor}
            checked={valor === opcao.valor}
            onChange={() => aoEscolher(opcao.valor)}
            className="peer sr-only"
          />
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-contorno-claro font-mono text-[0.7rem] text-texto-subtil transition-colors peer-checked:border-ouro peer-checked:bg-ouro peer-checked:text-fundo">
            {LETRAS[i]}
          </span>
          <span className="text-sm text-texto-fraco transition-colors peer-checked:text-texto sm:text-base">
            {opcao.rotulo}
          </span>
        </label>
      ))}
    </div>
  )
}
